import type { VideoDoc } from "@/lib/types";

export function parseVideo(id: string, data: Record<string, unknown>): VideoDoc {
  return {
    id,
    title: String(data.title ?? ""),
    createdAt: Number(data.createdAt ?? 0),
    duration: Number(data.duration ?? 0),
    size: Number(data.size ?? 0),
    videoUrl: String(data.videoUrl ?? ""),
    posterUrl: String(data.posterUrl ?? ""),
    likes: Math.max(0, Math.floor(Number(data.likes ?? 0))),
    views: Math.max(0, Math.floor(Number(data.views ?? 0))),
  };
}

export function compactCount(n: number) {
  const v = Math.max(0, Math.floor(n));
  if (v < 1000) return String(v);
  if (v < 1_000_000) {
    const k = v / 1000;
    return `${k < 10 ? k.toFixed(1).replace(/\.0$/, "") : Math.round(k)}K`;
  }
  const m = v / 1_000_000;
  return `${m < 10 ? m.toFixed(1).replace(/\.0$/, "") : Math.round(m)}M`;
}

export function toLocalInput(ts: number) {
  const d = new Date(ts || Date.now());
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function fromLocalInput(value: string) {
  const t = new Date(value).getTime();
  return Number.isFinite(t) ? t : Date.now();
}
