import test from "node:test";
import assert from "node:assert/strict";
import { highlightCode } from "../src/utils/highlightCode.js";
import { getMessageLinks } from "../src/utils/messageLinks.js";
import { messageWindow } from "../src/utils/messageWindow.js";
test("syntax highlighting colors JavaScript without changing source text", () => {
  const html = highlightCode(
    'const ws = new WebSocket("wss://example.com");',
    "javascript",
  );
  assert.match(html, /hljs-keyword/);
  assert.match(html, /WebSocket/);
});
test("HTML snippets remain escaped", () => {
  const html = highlightCode(
    '<script>alert("x")</script><img src=x onerror=alert(1)>',
    "html",
  );
  assert.ok(!html.includes("<script>"));
  assert.ok(!html.includes("<img"));
  assert.match(html, /&lt;/);
});
test("unknown languages fall back to escaped React text", () =>
  assert.equal(highlightCode("a < b", "unknown"), null));
test("language aliases resolve to the supported grammar", () =>
  assert.equal(
    highlightCode("const n = 1;", "js"),
    highlightCode("const n = 1;", "javascript"),
  ));
test("link cards only contain HTTP URLs and reject embedded credentials", () => {
  const links = getMessageLinks(
    "javascript:alert(1) https://user:secret@example.com/ https://example.org/docs",
  );
  assert.equal(links.length, 1);
  assert.equal(links[0].hostname, "example.org");
});
test("links inside code notes do not become cards", () =>
  assert.equal(
    getMessageLinks('```js\nconst url = "https://example.com";\n```').length,
    0,
  ));
test("duplicate links are deduplicated and cards are bounded", () => {
  const links = getMessageLinks(
    "https://a.example https://a.example https://b.example https://c.example",
  );
  assert.equal(links.length, 2);
});
test("invalid percent escapes never crash message rendering", () => {
  const links = getMessageLinks("https://example.com/%broken");
  assert.equal(links.length, 1);
  assert.equal(links[0].title, "%broken");
});
test("sentence punctuation is excluded from a link target", () =>
  assert.equal(
    getMessageLinks("See https://example.com/docs.")[0].href,
    "https://example.com/docs",
  ));
const row = (id, minute) => ({
  id,
  createdAt: `2026-10-20T10:${String(minute).padStart(2, "0")}:00.000Z`,
});
test("a larger poll window does not add older history as new activity", () =>
  assert.deepEqual(
    messageWindow(
      [row("b", 2), row("c", 3)],
      [row("a", 1), row("b", 2), row("c", 3)],
    ).map((row) => row.id),
    ["b", "c"],
  ));
test("polling keeps updates to known messages and genuine new arrivals", () =>
  assert.deepEqual(
    messageWindow([row("b", 2)], [row("a", 1), row("b", 2), row("c", 3)]).map(
      (row) => row.id,
    ),
    ["b", "c"],
  ));
test("a same-timestamp cursor boundary uses the message ID", () =>
  assert.deepEqual(
    messageWindow([row("b", 2)], [row("a", 2), row("b", 2), row("c", 2)]).map(
      (row) => row.id,
    ),
    ["b", "c"],
  ));
