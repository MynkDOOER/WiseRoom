import test from "node:test";
import assert from "node:assert/strict";
import { safeReturnPath } from "../src/utils/authReturn.js";
import { parseInvitation } from "../src/api/invites.js";
test("sign-in return paths only allow local six-character invitation paths", () => {
  assert.equal(safeReturnPath("/join/ABC123"), "/join/ABC123");
  for (const value of [null, "//evil.example/join/ABC123", "https://evil.example", "/join/ABC123?next=evil", "/join/ABC123/extra", "/rooms/anything"]) assert.equal(safeReturnPath(value), "/");
});
test("invitation entry accepts codes and same-origin links", () => {
  const origin = "https://wiseroom.example";
  for (const value of ["abc123", " ABC123 ", "/join/abc123", `${origin}/join/abc123`]) assert.equal(parseInvitation(value, origin), "ABC123");
});
test("invitation entry rejects unrelated origins and malformed tokens", () => {
  for (const value of ["abc", "1234567", "a!b123", "https://evil.example/join/ABC123", "javascript:alert(1)", "0".repeat(64)]) assert.throws(() => parseInvitation(value, "https://wiseroom.example"));
});
