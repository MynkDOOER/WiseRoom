import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import python from "highlight.js/lib/languages/python";
import cpp from "highlight.js/lib/languages/cpp";
import java from "highlight.js/lib/languages/java";
import xml from "highlight.js/lib/languages/xml";
import css from "highlight.js/lib/languages/css";
import sql from "highlight.js/lib/languages/sql";
import json from "highlight.js/lib/languages/json";
import bash from "highlight.js/lib/languages/bash";
for (const [name, grammar] of Object.entries({
  javascript,
  typescript,
  python,
  cpp,
  java,
  xml,
  css,
  sql,
  json,
  bash,
}))
  hljs.registerLanguage(name, grammar);
export function highlightCode(code, language) {
  const aliases = {
    js: "javascript",
    jsx: "javascript",
    ts: "typescript",
    tsx: "typescript",
    html: "xml",
    c: "cpp",
    "c++": "cpp",
    sh: "bash",
    py: "python",
  };
  const requested = language.trim().toLowerCase();
  const name = aliases[requested] || requested;
  // Only highlighted output goes into HTML; Highlight.js escapes the original source.
  return hljs.getLanguage(name)
    ? hljs.highlight(code, { language: name, ignoreIllegals: true }).value
    : null;
}
