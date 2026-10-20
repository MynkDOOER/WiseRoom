export const API_URL = (import.meta.env?.VITE_API_URL || "http://localhost:3000").replace(/\/$/, "");
export const withAvatarUrl = room => ({ ...room, avatarUrl: room.avatarUrl ? new URL(room.avatarUrl, API_URL).href : null });
export async function apiRequest(token, path, { method = "GET", body, binary, signal } = {}) {
  if (!token) throw Object.assign(new Error("Your session expired. Please sign in again."), { status: 401 });
  let response;
  try { response = await fetch(`${API_URL}/api${path}`, { method, headers: { Authorization: `Bearer ${token}`, ...(binary ? { "Content-Type": binary.type } : body !== undefined ? { "Content-Type": "application/json" } : {}) }, ...(binary ? { body: binary } : body !== undefined ? { body: JSON.stringify(body) } : {}), signal }); }
  catch (error) { if (error.name === "AbortError") throw error; throw new Error("Cannot reach the server. Please try again.", { cause: error }); }
  if (response.status === 204) return null;
  const data = await response.json().catch(() => null);
  if (!response.ok) throw Object.assign(new Error(data?.message || "Couldn’t complete this request. Try again."), { status: response.status });
  if (!data) throw new Error("The server returned an unexpected response.");
  return data;
}
