import { NextResponse } from "next/server";
import { MAX_VIDEO_BYTES } from "@/lib/firebase";
import { assertStudioKey, studioToken } from "@/lib/studio-auth";
import { fromLocalInput } from "@/lib/video";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const form = await req.formData();
  const denied = assertStudioKey(String(form.get("key") || ""));
  if (denied) return denied;
  const title = String(form.get("title") || "").trim();
  const file = form.get("file");
  if (!title || !(file instanceof File)) {
    return NextResponse.json({ error: "Title and video required." }, { status: 400 });
  }
  if (file.size > MAX_VIDEO_BYTES) {
    return NextResponse.json({ error: "Max 32 MB on the free plan." }, { status: 400 });
  }
  const tok = studioToken();
  if (tok.error) return tok.error;

  const posted = String(form.get("createdAt") || "");
  const createdAt = posted ? fromLocalInput(posted) : Date.now();
  const likes = Number(form.get("likes")) || 0;
  const views = Number(form.get("views")) || 0;

  const id = `v${Date.now().toString(36)}`;
  const buf = Buffer.from(await file.arrayBuffer());
  const { publishMedia } = await import("@/lib/hosting-publish");
  try {
    const urls = await publishMedia({
      token: tok.token,
      id,
      video: buf,
      contentType: file.type || "video/mp4",
    });
    const { seedVideo } = await import("@/lib/firestore-admin");
    await seedVideo(tok.token, {
      id,
      title,
      createdAt,
      duration: 0,
      size: file.size,
      videoUrl: urls.videoUrl,
      posterUrl: urls.posterUrl,
      likes,
      views,
    });
    return NextResponse.json({ ok: true, id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Publish failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
