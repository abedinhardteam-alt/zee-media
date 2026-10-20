import { NextResponse } from "next/server";

function clean(value: string | undefined) {
  return (value || "").trim().replace(/^["']|["']$/g, "");
}

export function assertStudioKey(provided: string | null | undefined) {
  const key = clean(process.env.STUDIO_KEY);
  if (!key) {
    return NextResponse.json({ error: "Studio is not configured." }, { status: 503 });
  }
  if (!provided || provided !== key) {
    return NextResponse.json({ error: "Wrong studio key." }, { status: 401 });
  }
  return null;
}

export function studioToken():
  | { token: string; error?: undefined }
  | { token?: undefined; error: NextResponse } {
  const token = clean(process.env.FIREBASE_TOKEN);
  if (!token) {
    return { error: NextResponse.json({ error: "Publish token missing." }, { status: 503 }) };
  }
  return { token };
}
