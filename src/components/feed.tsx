"use client";

import { collection, onSnapshot } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { db } from "@/lib/firebase";
import type { VideoDoc } from "@/lib/types";
import { Slide } from "@/components/slide";
import { Logo } from "@/components/logo";

function parse(id: string, data: Record<string, unknown>): VideoDoc {
  return {
    id,
    title: String(data.title ?? ""),
    createdAt: Number(data.createdAt ?? 0),
    duration: Number(data.duration ?? 0),
    size: Number(data.size ?? 0),
    videoUrl: String(data.videoUrl ?? ""),
    posterUrl: String(data.posterUrl ?? ""),
  };
}

export function Feed({ initialId }: { initialId?: string }) {
  const [items, setItems] = useState<VideoDoc[]>([]);
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    return onSnapshot(
      collection(db, "videos"),
      (snap) => {
        const rows = snap.docs
          .map((d) => parse(d.id, d.data()))
          .sort((a, b) => b.createdAt - a.createdAt);
        setItems(rows);
        setReady(true);
      },
      (e) => {
        setErr(e.message);
        setReady(true);
      },
    );
  }, []);

  const ordered = useMemo(() => {
    if (!initialId) return items;
    const hit = items.find((v) => v.id === initialId);
    if (!hit) return items;
    return [hit, ...items.filter((v) => v.id !== initialId)];
  }, [items, initialId]);

  return (
    <div className="relative h-dvh bg-black">
      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between px-4 py-4">
        <div className="pointer-events-auto drop-shadow-lg">
          <Logo />
        </div>
      </header>
      {!ready ? (
        <div className="grid h-full place-items-center text-sm text-white/50">Loading desk…</div>
      ) : err ? (
        <div className="grid h-full place-items-center px-6 text-center text-sm text-red-300">{err}</div>
      ) : ordered.length === 0 ? (
        <div className="grid h-full place-items-center text-sm text-white/50">No posts yet.</div>
      ) : (
        <div className="feed no-bar">
          {ordered.map((v, i) => (
            <Slide key={v.id} video={v} activeHint={i === 0} />
          ))}
        </div>
      )}
    </div>
  );
}
