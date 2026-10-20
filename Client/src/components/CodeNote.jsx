import { useState } from "react";
import Icon from "./Icon";
import { highlightCode } from "../utils/highlightCode";
export default function CodeNote({ source, language }) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const html = highlightCode(source, language);
  async function copy() {
    try {
      await navigator.clipboard.writeText(source);
      setCopied(true);
      setError("");
    } catch {
      setError("Copy unavailable. Select the code to copy it manually.");
    }
  }
  return (
    <div className="code-block">
      <div className="code-language">
        <span>{language || "text"}</span>
        <button
          type="button"
          className="code-copy"
          onClick={copy}
          aria-label="Copy code"
        >
          <Icon name={copied ? "check" : "copy"} size={12} />
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre>
        {html === null ? (
          <code>{source}</code>
        ) : (
          <code dangerouslySetInnerHTML={{ __html: html }} />
        )}
      </pre>
      {error && (
        <p className="field-hint" role="status">
          {error}
        </p>
      )}
    </div>
  );
}
