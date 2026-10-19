const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(/\/$/, "");

async function request(token, path, { method = "GET", body, signal } = {}) {
  if (!token) throw new Error("Your session expired. Please sign in again.");
  let response;
  try {
    response = await fetch(`${API_URL}/api/rooms${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal,
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new Error("Cannot reach the server. Please try again when it is available.", { cause: error });
  }
  if (response.status === 204) return null;
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.message || (response.status === 401 ? "Please sign in again." : "Couldn't complete this request. Please try again."));
  }
  if (!data) throw new Error("The server returned an unexpected response. Please try again.");
  return data;
}

export const listRooms = async (token, signal) => (await request(token, "", { signal })).rooms;
export const createRoom = async (token, name) => (await request(token, "", { method: "POST", body: { name } })).room;
export const joinRoom = async (token, inviteToken) => (await request(token, "/join", { method: "POST", body: { inviteToken } })).room;
export const getRoom = async (token, roomId, signal) => (await request(token, `/${encodeURIComponent(roomId)}`, { signal })).room;
export const getMembers = async (token, roomId, signal) => (await request(token, `/${encodeURIComponent(roomId)}/members`, { signal })).members;
export const getInvite = async (token, roomId) => (await request(token, `/${encodeURIComponent(roomId)}/invite`)).inviteToken;
export const leaveRoom = async (token, roomId) => request(token, `/${encodeURIComponent(roomId)}/members/me`, { method: "DELETE" });
