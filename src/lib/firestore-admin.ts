import type { VideoDoc } from "@/lib/types";
import { accessTokenFromRefresh } from "@/lib/google-token";

const PROJECT = "zee-media-10d6c";

export async function seedVideo(refreshOrAccess: string, video: VideoDoc) {
  const access = await accessTokenFromRefresh(refreshOrAccess);
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/videos/${video.id}`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${access}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fields: {
        title: { stringValue: video.title },
        createdAt: { integerValue: String(video.createdAt) },
        duration: { doubleValue: video.duration },
        size: { integerValue: String(video.size) },
        videoUrl: { stringValue: video.videoUrl },
        posterUrl: { stringValue: video.posterUrl },
      },
    }),
  });
  if (!res.ok) {
    throw new Error(`Firestore write failed (${res.status}): ${await res.text()}`);
  }
}
