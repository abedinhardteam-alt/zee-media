"use client";

import { Check, Eye, Heart, Link2, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { VideoDoc } from "@/lib/types";
import { fullDate, timeAgo } from "@/lib/time";
import { compactCount } from "@/lib/video";

export function Slide({ video, activeHint }: { video: VideoDoc; activeHint: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  const box = useRef<HTMLElement>(null);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  const [inView, setInView] = useState(activeHint);
  const [loved, setLoved] = useState(false);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => setInView(e.isIntersecting && e.intersectionRatio > 0.65),
      { threshold: [0.65] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = muted;
    if (inView) {
      v.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    } else {
      v.pause();
      setPlaying(false);
    }
  }, [inView, muted]);

  async function copyLink() {
    const url = `${window.location.origin}/v/${video.id}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  function togglePlay() {
    const v = ref.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  }

  return (
    <section ref={box} className="slide relative bg-black">
      <video
        ref={ref}
        className="absolute inset-0 h-full w-full object-contain bg-black"
        src={video.videoUrl}
        poster={video.posterUrl || undefined}
        playsInline
        loop
        muted={muted}
        preload="metadata"
        onTimeUpdate={(e) => {
          const t = e.currentTarget;
          if (t.duration) setProgress(t.currentTime / t.duration);
        }}
        onClick={togglePlay}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/35" />
      <div className="absolute right-3 bottom-32 z-10 flex flex-col items-center gap-4">
        <RailBtn
          label={compactCount(video.likes)}
          onClick={() => setLoved((v) => !v)}
          active={loved}
        >
          <Heart className={`h-6 w-6 ${loved ? "fill-[#ff2d55] text-[#ff2d55]" : ""}`} />
        </RailBtn>
        <RailBtn label={compactCount(video.views)}>
          <Eye className="h-6 w-6" />
        </RailBtn>
        <RailBtn label={muted ? "Mute" : "On"} onClick={() => setMuted((m) => !m)}>
          {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </RailBtn>
        <RailBtn label={copied ? "Copied" : "Share"} onClick={copyLink}>
          {copied ? <Check className="h-5 w-5 text-gold" /> : <Link2 className="h-5 w-5" />}
        </RailBtn>
      </div>
      <div className="absolute inset-x-0 bottom-0 z-10 p-5 pb-8">
        <h1 className="font-display max-w-[78%] text-2xl font-semibold leading-tight">{video.title}</h1>
        <p className="mt-2 text-sm text-white/75">
          {timeAgo(video.createdAt)} · {fullDate(video.createdAt)}
        </p>
        <div className="mt-4 h-0.5 overflow-hidden rounded-full bg-white/20">
          <div className="h-full bg-gold" style={{ width: `${progress * 100}%` }} />
        </div>
      </div>
      {!playing && inView ? (
        <button
          onClick={togglePlay}
          className="absolute top-1/2 left-1/2 z-10 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-black/45 backdrop-blur"
          aria-label="Play"
        >
          <Play className="h-7 w-7 fill-white" />
        </button>
      ) : null}
      {playing && inView ? (
        <button className="sr-only" onClick={togglePlay} aria-label="Pause">
          <Pause />
        </button>
      ) : null}
    </section>
  );
}

function RailBtn({
  children,
  label,
  onClick,
  active,
}: {
  children: ReactNode;
  label: string;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={onClick}
        className={`grid h-12 w-12 place-items-center rounded-full bg-white/10 backdrop-blur ring-1 ring-white/15 ${
          active ? "ring-[#ff2d55]/50" : ""
        }`}
      >
        {children}
      </button>
      <span className="text-[11px] font-semibold tracking-wide text-white/80">{label}</span>
    </div>
  );
}
