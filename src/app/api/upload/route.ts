import { NextResponse } from "next/server";
import { MAX_VIDEO_BYTES } from "@/lib/firebase";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const key = process.env.STUDIO_KEY;
  if (!key) {
    return NextResponse.json({ error: "Studio is not configured." }, { status: 503 });
  }
  const form = await req.formData();
  if (form.get("key") !== key) {
    return NextResponse.json({ error: "Wrong studio key." }, { status: 401 });
  }
  const title = String(form.get("title") || "").trim();
  const file = form.get("file");
  if (!title || !(file instanceof File)) {
    return NextResponse.json({ error: "Title and video required." }, { status: 400 });
  }
  if (file.size > MAX_VIDEO_BYTES) {
    return NextResponse.json({ error: "Max 32 MB on the free plan." }, { status: 400 });
  }
  const token = process.env.FIREBASE_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "Publish token missing." }, { status: 503 });
  }

  const id = `v${Date.now().toString(36)}`;
  const buf = Buffer.from(await file.arrayBuffer());
  const { publishMedia } = await import("@/lib/hosting-publish");
  try {
    const urls = await publishMedia({
      token,
      id,
      video: buf,
      contentType: file.type || "video/mp4",
    });
    const { seedVideo } = await import("@/lib/firestore-admin");
    await seedVideo(token, {
      id,
      title,
      createdAt: Date.now(),
      duration: 0,
      size: file.size,
      videoUrl: urls.videoUrl,
      posterUrl: urls.posterUrl,
    });
    return NextResponse.json({ ok: true, id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Publish failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
