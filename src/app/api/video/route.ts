import { NextResponse } from "next/server";
import { assertStudioKey, studioToken } from "@/lib/studio-auth";
import { fromLocalInput } from "@/lib/video";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function save(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      key?: string;
      id?: string;
      title?: string;
      createdAt?: string | number;
      likes?: number | string;
      views?: number | string;
    };
    const denied = assertStudioKey(body.key);
    if (denied) return denied;
    const id = String(body.id || "").trim();
    const title = String(body.title || "").trim();
    if (!id || !title) {
      return NextResponse.json({ error: "Id and title required." }, { status: 400 });
    }
    const tok = studioToken();
    if (tok.error) return tok.error;
    const createdAt =
      typeof body.createdAt === "string" && body.createdAt.includes("T")
        ? fromLocalInput(body.createdAt)
        : Number(body.createdAt) || Date.now();
    const { updateVideo } = await import("@/lib/firestore-admin");
    await updateVideo(tok.token, id, {
      title,
      createdAt,
      likes: Number(body.likes) || 0,
      views: Number(body.views) || 0,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Save failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  return save(req);
}

export async function PATCH(req: Request) {
  return save(req);
}
