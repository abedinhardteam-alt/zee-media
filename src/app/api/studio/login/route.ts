import { NextResponse } from "next/server";
import { assertStudioKey } from "@/lib/studio-auth";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { key?: string };
  const denied = assertStudioKey(body.key);
  if (denied) return denied;
  return NextResponse.json({ ok: true });
}
