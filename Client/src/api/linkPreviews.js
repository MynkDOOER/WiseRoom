import { apiRequest, API_URL } from "./http";
const path = (roomId, messageId, kind, index) =>
  `/rooms/${encodeURIComponent(roomId)}/messages/${encodeURIComponent(messageId)}/link-${kind}?index=${index}`;
export function loadLinkPreview(token, roomId, messageId, index, signal) {
  return apiRequest(token, path(roomId, messageId, "preview", index), {
    signal,
  });
}
export async function loadLinkImage(token, roomId, messageId, index, signal) {
  if (!token) throw new Error("Sign in to load this preview.");
  const response = await fetch(
    `${API_URL}/api${path(roomId, messageId, "image", index)}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    },
  );
  if (response.status === 204) return null;
  if (
    !response.ok ||
    !response.headers.get("content-type")?.startsWith("image/webp")
  )
    throw new Error("Preview image unavailable.");
  return response.blob();
}
