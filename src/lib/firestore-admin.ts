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
        likes: { integerValue: String(Math.max(0, Math.floor(video.likes))) },
        views: { integerValue: String(Math.max(0, Math.floor(video.views))) },
      },
    }),
  });
  if (!res.ok) {
    throw new Error(`Firestore write failed (${res.status}): ${await res.text()}`);
  }
}

export async function updateVideo(
  refreshOrAccess: string,
  id: string,
  patch: { title: string; createdAt: number; likes: number; views: number },
) {
  const access = await accessTokenFromRefresh(refreshOrAccess);
  const qs = [
    "updateMask.fieldPaths=title",
    "updateMask.fieldPaths=createdAt",
    "updateMask.fieldPaths=likes",
    "updateMask.fieldPaths=views",
  ].join("&");
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/videos/${id}?${qs}`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${access}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fields: {
        title: { stringValue: patch.title },
        createdAt: { integerValue: String(patch.createdAt) },
        likes: { integerValue: String(Math.max(0, Math.floor(patch.likes))) },
        views: { integerValue: String(Math.max(0, Math.floor(patch.views))) },
      },
    }),
  });
  if (!res.ok) {
    throw new Error(`Firestore update failed (${res.status}): ${await res.text()}`);
  }
}
