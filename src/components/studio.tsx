"use client";

import { useState, type FormEvent } from "react";
import { Logo } from "@/components/logo";
import { MAX_VIDEO_BYTES } from "@/lib/firebase";

export function Studio() {
  const [key, setKey] = useState("");
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setMsg("");
    if (!file) {
      setMsg("Pick a video.");
      return;
    }
    if (file.size > MAX_VIDEO_BYTES) {
      setMsg("Max 32 MB on the free Firebase plan.");
      return;
    }
    setBusy(true);
    try {
      const body = new FormData();
      body.set("key", key);
      body.set("title", title);
      body.set("file", file);
      const res = await fetch("/api/upload", { method: "POST", body });
      const data = (await res.json()) as { ok?: boolean; error?: string; id?: string };
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setMsg(`Live · /v/${data.id}`);
      setTitle("");
      setFile(null);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-dvh bg-[#0a0a0a] px-4 py-10">
      <div className="mx-auto max-w-md">
        <Logo />
        <h1 className="font-display mt-8 text-3xl font-semibold">Studio</h1>
        <p className="mt-2 text-sm text-muted">
          Private desk. Public visitors only watch. Max 32 MB per video (Firebase Spark).
        </p>
        <form className="mt-8 space-y-4" onSubmit={submit}>
          <label className="block text-xs font-semibold tracking-wide text-muted uppercase">
            Studio key
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-black px-3 text-sm text-white outline-none focus:border-gold"
              required
            />
          </label>
          <label className="block text-xs font-semibold tracking-wide text-muted uppercase">
            Title
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-black px-3 text-sm text-white outline-none focus:border-gold"
              required
            />
          </label>
          <label className="block text-xs font-semibold tracking-wide text-muted uppercase">
            Video
            <input
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="mt-1 w-full text-sm"
              required
            />
          </label>
          <button
            disabled={busy}
            className="h-12 w-full rounded-full bg-gold text-sm font-semibold text-black disabled:opacity-50"
          >
            {busy ? "Publishing…" : "Publish"}
          </button>
        </form>
        {msg ? <p className="mt-4 text-sm text-gold">{msg}</p> : null}
      </div>
    </div>
  );
}
