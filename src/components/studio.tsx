"use client";

import { collection, onSnapshot } from "firebase/firestore";
import { LogOut, Plus, Save } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Logo } from "@/components/logo";
import { db, MAX_VIDEO_BYTES } from "@/lib/firebase";
import { fullDate } from "@/lib/time";
import type { VideoDoc } from "@/lib/types";
import { fromLocalInput, parseVideo, toLocalInput } from "@/lib/video";

const KEY_STORE = "zm_studio_key";

export function Studio() {
  const [key, setKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [loginErr, setLoginErr] = useState("");
  const [items, setItems] = useState<VideoDoc[]>([]);
  const [libErr, setLibErr] = useState("");
  const [libReady, setLibReady] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem(KEY_STORE) || "";
    if (!saved) {
      setChecking(false);
      return;
    }
    fetch("/api/studio/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: saved }),
    })
      .then(async (r) => {
        if (!r.ok) throw new Error("expired");
        setKey(saved);
        setAuthed(true);
      })
      .catch(() => sessionStorage.removeItem(KEY_STORE))
      .finally(() => setChecking(false));
  }, []);

  useEffect(() => {
    if (!authed) return;
    return onSnapshot(
      collection(db, "videos"),
      (snap) => {
        setItems(
          snap.docs
            .map((d) => parseVideo(d.id, d.data()))
            .sort((a, b) => b.createdAt - a.createdAt),
        );
        setLibReady(true);
      },
      (e) => {
        setLibErr(e.message);
        setLibReady(true);
      },
    );
  }, [authed]);

  async function login(e: FormEvent) {
    e.preventDefault();
    setLoginErr("");
    const res = await fetch("/api/studio/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key }),
    });
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setLoginErr(data.error || "Wrong key");
      return;
    }
    sessionStorage.setItem(KEY_STORE, key);
    setAuthed(true);
  }

  function logout() {
    sessionStorage.removeItem(KEY_STORE);
    setAuthed(false);
    setKey("");
  }

  if (checking) {
    return (
      <div className="grid min-h-dvh place-items-center bg-[#070707] text-sm text-white/50">
        Opening studio…
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="grid min-h-dvh place-items-center bg-[#070707] px-4">
        <form
          onSubmit={login}
          className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#0e0e0e] p-6"
        >
          <Logo />
          <h1 className="font-display mt-6 text-2xl font-semibold">Studio login</h1>
          <p className="mt-2 text-sm text-muted">Enter the desk key to open the dashboard.</p>
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="Studio key"
            className="mt-6 h-12 w-full rounded-xl border border-white/10 bg-black px-4 text-sm outline-none focus:border-gold"
            autoFocus
          />
          {loginErr ? <p className="mt-3 text-sm text-red-400">{loginErr}</p> : null}
          <button className="mt-5 h-12 w-full rounded-full bg-gold text-sm font-semibold text-black">
            Enter dashboard
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#070707]">
      <header className="sticky top-0 z-20 border-b border-white/8 bg-[#070707]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Logo />
          <button
            onClick={logout}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-white/10 px-4 text-sm text-white/80 hover:bg-white/5"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </header>
      <main className="mx-auto grid max-w-6xl gap-8 px-4 py-8 lg:grid-cols-[360px_1fr]">
        <UploadPanel studioKey={key} />
        <section>
          <div className="mb-4">
            <div className="text-xs font-semibold tracking-[0.16em] text-gold uppercase">Library</div>
            <h2 className="font-display mt-1 text-2xl font-semibold">Posts</h2>
          </div>
          <div className="space-y-4">
            {!libReady ? (
              <p className="text-sm text-muted">Loading posts…</p>
            ) : libErr ? (
              <p className="text-sm text-red-400">{libErr}</p>
            ) : items.length === 0 ? (
              <p className="text-sm text-muted">No posts yet.</p>
            ) : (
              items.map((v) => <EditCard key={v.id} video={v} studioKey={key} />)
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function fieldClass() {
  return "mt-1 h-11 w-full rounded-xl border border-white/10 bg-black px-3 text-sm text-white outline-none focus:border-gold";
}

function UploadPanel({ studioKey }: { studioKey: string }) {
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [createdAt, setCreatedAt] = useState(toLocalInput(Date.now()));
  const [likes, setLikes] = useState("0");
  const [views, setViews] = useState("0");
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
      body.set("key", studioKey);
      body.set("title", title);
      body.set("file", file);
      body.set("createdAt", createdAt);
      body.set("likes", likes);
      body.set("views", views);
      const res = await fetch("/api/upload", { method: "POST", body });
      const data = (await res.json()) as { ok?: boolean; error?: string; id?: string };
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setMsg(`Live · /v/${data.id}`);
      setTitle("");
      setFile(null);
      setCreatedAt(toLocalInput(Date.now()));
      setLikes("0");
      setViews("0");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="h-fit rounded-3xl border border-white/10 bg-[#0e0e0e] p-5">
      <div className="flex items-center gap-2 text-gold">
        <Plus className="h-4 w-4" />
        <span className="text-xs font-semibold tracking-[0.16em] uppercase">New post</span>
      </div>
      <h2 className="font-display mt-2 text-xl font-semibold">Upload video</h2>
      <label className="mt-5 block text-xs font-semibold tracking-wide text-muted uppercase">
        Title
        <input className={fieldClass()} value={title} onChange={(e) => setTitle(e.target.value)} required />
      </label>
      <label className="mt-4 block text-xs font-semibold tracking-wide text-muted uppercase">
        Video
        <input
          type="file"
          accept="video/mp4,video/webm,video/quicktime"
          className="mt-1 w-full text-sm"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          required
        />
      </label>
      <label className="mt-4 block text-xs font-semibold tracking-wide text-muted uppercase">
        Upload time
        <input
          type="datetime-local"
          className={fieldClass()}
          value={createdAt}
          onChange={(e) => setCreatedAt(e.target.value)}
          required
        />
      </label>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <label className="block text-xs font-semibold tracking-wide text-muted uppercase">
          Likes
          <input
            type="number"
            min={0}
            className={fieldClass()}
            value={likes}
            onChange={(e) => setLikes(e.target.value)}
          />
        </label>
        <label className="block text-xs font-semibold tracking-wide text-muted uppercase">
          Views
          <input
            type="number"
            min={0}
            className={fieldClass()}
            value={views}
            onChange={(e) => setViews(e.target.value)}
          />
        </label>
      </div>
      <button
        disabled={busy}
        className="mt-5 h-12 w-full rounded-full bg-gold text-sm font-semibold text-black disabled:opacity-50"
      >
        {busy ? "Publishing…" : "Publish"}
      </button>
      {msg ? <p className="mt-3 text-sm text-gold">{msg}</p> : null}
    </form>
  );
}

function EditCard({ video, studioKey }: { video: VideoDoc; studioKey: string }) {
  const [title, setTitle] = useState(video.title);
  const [createdAt, setCreatedAt] = useState(toLocalInput(video.createdAt));
  const [likes, setLikes] = useState(String(video.likes));
  const [views, setViews] = useState(String(video.views));
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setTitle(video.title);
    setCreatedAt(toLocalInput(video.createdAt));
    setLikes(String(video.likes));
    setViews(String(video.views));
  }, [video]);

  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/video", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: studioKey,
          id: video.id,
          title,
          createdAt: fromLocalInput(createdAt),
          likes: Number(likes) || 0,
          views: Number(views) || 0,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Save failed");
      setMsg("Saved");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="rounded-3xl border border-white/10 bg-[#0e0e0e] p-5">
      <div className="flex flex-wrap items-start gap-4">
        {video.posterUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={video.posterUrl}
            alt=""
            className="h-28 w-20 rounded-xl object-cover bg-black"
          />
        ) : (
          <div className="h-28 w-20 rounded-xl bg-white/5" />
        )}
        <div className="min-w-0 flex-1 space-y-3">
          <div className="text-[11px] text-muted">
            {video.id} · live as {fullDate(fromLocalInput(createdAt))}
          </div>
          <input className={fieldClass()} value={title} onChange={(e) => setTitle(e.target.value)} />
          <input
            type="datetime-local"
            className={fieldClass()}
            value={createdAt}
            onChange={(e) => setCreatedAt(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              min={0}
              className={fieldClass()}
              value={likes}
              onChange={(e) => setLikes(e.target.value)}
              aria-label="Likes"
            />
            <input
              type="number"
              min={0}
              className={fieldClass()}
              value={views}
              onChange={(e) => setViews(e.target.value)}
              aria-label="Views"
            />
          </div>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-muted">Likes · Views</span>
        <button
          disabled={busy}
          className="inline-flex h-10 items-center gap-2 rounded-full bg-white/10 px-4 text-sm font-semibold disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {busy ? "Saving…" : "Save"}
        </button>
      </div>
      {msg ? <p className="mt-2 text-sm text-gold">{msg}</p> : null}
    </form>
  );
}
