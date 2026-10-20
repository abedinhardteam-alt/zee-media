const CLIENT_ID =
  "563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e2.apps.googleusercontent.com";
const CLIENT_SECRET = "jEQC98uNEz5zB6Tv8X7x2o_Z";

export async function accessTokenFromRefresh(refresh: string) {
  if (refresh.startsWith("ya29.")) return refresh;
  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    refresh_token: refresh,
    grant_type: "refresh_token",
  });
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const json = (await res.json()) as { access_token?: string; error?: string };
  if (!res.ok || !json.access_token) {
    throw new Error(json.error || "Google token refresh failed");
  }
  return json.access_token;
}
