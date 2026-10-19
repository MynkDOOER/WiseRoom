const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(/\/$/, "");

async function request(token, roomId, { method = "GET", query = "", body, signal } = {}) {
  if (!token) throw Object.assign(new Error("Your session expired. Please sign in again."), { status: 401 });
  let response;
  try {
    response = await fetch(`${API_URL}/api/rooms/${encodeURIComponent(roomId)}/messages${query}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify({ body }) } : {}),
      signal,
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new Error("Cannot reach the server. Please try again when it is available.", { cause: error });
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw Object.assign(new Error(data?.message || "Couldn't load this conversation. Please try again."), { status: response.status });
  }
  if (!data) throw new Error("The server returned an unexpected response. Please try again.");
  return data;
}

export const getMessages = async (token, roomId, { before, limit = 30, signal } = {}) => {
  const query = new URLSearchParams({ limit: String(limit) });
  if (before) query.set("before", before);
  return request(token, roomId, { query: `?${query}`, signal });
};

export const sendMessage = async (token, roomId, body, { signal } = {}) => {
  return (await request(token, roomId, { method: "POST", body, signal })).message;
};
