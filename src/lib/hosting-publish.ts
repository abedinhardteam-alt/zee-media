import { createHash } from "crypto";
import { accessTokenFromRefresh } from "@/lib/google-token";

const SITE = "zee-media-10d6c";

type VersionFile = { path: string; hash: string };

async function gfetch(access: string, url: string, init?: RequestInit) {
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${access}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  return res;
}

export async function publishMedia(input: {
  token: string;
  id: string;
  video: Buffer;
  contentType: string;
  poster?: Buffer;
}) {
  const access = await accessTokenFromRefresh(input.token);
  const files: Record<string, Buffer> = {
    [`/media/${input.id}.mp4`]: input.video,
  };
  if (input.poster) files[`/media/${input.id}.jpg`] = input.poster;

  const hashes: Record<string, string> = {};
  for (const [path, buf] of Object.entries(files)) {
    hashes[path] = createHash("sha256").update(buf).digest("hex");
  }

  const rel = await gfetch(
    access,
    `https://firebasehosting.googleapis.com/v1beta1/sites/${SITE}/releases?pageSize=1`,
  );
  const relJson = (await rel.json()) as {
    releases?: { version?: { name?: string } }[];
  };
  const currentName = relJson.releases?.[0]?.version?.name;
  const existing: Record<string, string> = {};
  if (currentName) {
    let page: string | undefined;
    do {
      const q = page ? `?pageToken=${page}` : "";
      const fr = await gfetch(
        access,
        `https://firebasehosting.googleapis.com/v1beta1/${currentName}/files${q}`,
      );
      const fj = (await fr.json()) as {
        files?: VersionFile[];
        nextPageToken?: string;
      };
      for (const f of fj.files || []) existing[f.path] = f.hash;
      page = fj.nextPageToken;
    } while (page);
  }

  const merged = { ...existing, ...hashes };
  const verRes = await gfetch(
    access,
    `https://firebasehosting.googleapis.com/v1beta1/sites/${SITE}/versions`,
    { method: "POST", body: JSON.stringify({ status: "CREATED" }) },
  );
  if (!verRes.ok) throw new Error(`Create version failed: ${await verRes.text()}`);
  const version = (await verRes.json()) as { name: string };

  const pop = await gfetch(access, `https://firebasehosting.googleapis.com/v1beta1/${version.name}:populateFiles`, {
    method: "POST",
    body: JSON.stringify({ files: merged }),
  });
  if (!pop.ok) throw new Error(`Populate files failed: ${await pop.text()}`);
  const popJson = (await pop.json()) as {
    uploadRequiredHashes?: string[];
    uploadUrl?: string;
  };

  const need = new Set(popJson.uploadRequiredHashes || []);
  for (const [path, buf] of Object.entries(files)) {
    const hash = hashes[path];
    if (!need.has(hash) || !popJson.uploadUrl) continue;
    const up = await fetch(`${popJson.uploadUrl}/${hash}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access}`,
        "Content-Type": "application/octet-stream",
      },
      body: new Uint8Array(buf),
    });
    if (!up.ok) throw new Error(`Media upload failed: ${await up.text()}`);
  }

  const fin = await gfetch(access, `https://firebasehosting.googleapis.com/v1beta1/${version.name}?update_mask=status`, {
    method: "PATCH",
    body: JSON.stringify({ status: "FINALIZED" }),
  });
  if (!fin.ok) throw new Error(`Finalize failed: ${await fin.text()}`);

  const rels = await gfetch(
    access,
    `https://firebasehosting.googleapis.com/v1beta1/sites/${SITE}/releases?versionName=${version.name}`,
    { method: "POST", body: "{}" },
  );
  if (!rels.ok) throw new Error(`Release failed: ${await rels.text()}`);

  return {
    videoUrl: `/play/${input.id}.mp4`,
    posterUrl: input.poster ? `/play/${input.id}.jpg` : "",
  };
}
