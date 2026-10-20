const CLIENT_ID =
  "563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com";
const CLIENT_SECRET = "j9iVZfS8kkCEFUPaAeJV0sAi";

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
  const raw = await res.text();
  let json: { access_token?: string; error?: string; error_description?: string } = {};
  try {
    json = raw ? (JSON.parse(raw) as typeof json) : {};
  } catch {
    throw new Error("Google token refresh returned invalid JSON");
  }
  if (!res.ok || !json.access_token) {
    throw new Error(json.error_description || json.error || "Google token refresh failed");
  }
  return json.access_token;
}
