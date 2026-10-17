const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:3000")
  .replace(/\/$/, "");

export async function syncUser(token, signal) {
  const response = await fetch(`${API_URL}/api/users/sync`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    signal,
  });

  if (!response.ok) {
    throw new Error(response.status === 401
      ? "Your session expired. Please sign in again."
      : "We couldn't load your account. Please try again.");
  }

  const { user } = await response.json();
  return user;
}
