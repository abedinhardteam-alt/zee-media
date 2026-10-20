import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center bg-black text-center">
      <div>
        <p className="font-display text-3xl">Not on the feed</p>
        <Link href="/" className="mt-4 inline-block text-sm text-gold">
          Back to ZEE MEDIA
        </Link>
      </div>
    </div>
  );
}
