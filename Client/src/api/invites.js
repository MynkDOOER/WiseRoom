import { apiRequest } from "./http.js";
const codePath = (code) => `/invites/${encodeURIComponent(code)}`;
export const previewInvite = (token, code, signal) =>
  apiRequest(token, codePath(code), { signal });
export const requestAccess = (token, code) =>
  apiRequest(token, `${codePath(code)}/requests`, { method: "POST" });
export const cancelAccess = (token, code) =>
  apiRequest(token, `${codePath(code)}/requests/me`, { method: "DELETE" });
export const myRequests = async (token, signal) =>
  (await apiRequest(token, "/invites/requests/me", { signal })).requests;
export const cancelMyRequest = (token, requestId) =>
  apiRequest(token, `/invites/requests/${encodeURIComponent(requestId)}/me`, {
    method: "DELETE",
  });
export function parseInvitation(value, origin = window.location.origin) {
  const input = value.trim();
  if (/^[a-z0-9]{6}$/i.test(input)) return input.toUpperCase();
  try {
    const url = new URL(input, origin);
    const match = url.pathname.match(/^\/join\/([a-z0-9]{6})\/?$/i);
    if (url.origin === origin && match) return match[1].toUpperCase();
  } catch {
    /* Invalid input below. */
  }
  throw new Error("Paste a WiseRoom invitation link or a six-character code.");
}
