export function safeReturnPath(value) {
  if (typeof value !== "string") return "/";
  return /^\/join\/[a-z0-9]{6}$/i.test(value) ? value : "/";
}
