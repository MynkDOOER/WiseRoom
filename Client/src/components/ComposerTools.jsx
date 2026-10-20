import { useRef, useState } from "react";
import Modal from "./Modal";
import Icon from "./Icon";

const expressions = [
  ["Unbothered", "(⌐■_■)"],
  ["Tiny celebration", "٩(ˊᗜˋ*)و"],
  ["Table flip", "(╯°□°)╯︵ ┻━┻"],
  ["Putting it back", "┬─┬ノ( º _ ºノ)"],
  ["A little shrug", "¯\\_(ツ)_/¯"],
  ["Happy tears", "ಥ‿ಥ"],
  ["Approved", "( •̀ ω •́ )✧"],
  ["A hug", "(づ｡◕‿‿◕｡)づ"],
  ["Looking respectfully", "(ಠ_ಠ)"],
  ["Melting", "🫠"],
  ["Goblin mode", "👹"],
  ["Upside down", "🙃"],
  ["A little magic", "🪄"],
  ["Brain loading", "🧠"],
  ["Duck energy", "🦆"],
  ["Sparkles", "✨"],
  ["Snail pace", "🐌"],
  ["Plot twist", "🍿"],
];
const languages = [
  "text",
  "javascript",
  "typescript",
  "python",
  "cpp",
  "java",
  "html",
  "css",
  "sql",
  "json",
  "bash",
];

export default function ComposerTools({ disabled, insert, remaining }) {
  const [dialog, setDialog] = useState(null);
  const [query, setQuery] = useState("");
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const codeRef = useRef(null);
  const fence = "`".repeat(
    Math.max(
      3,
      ...[...code.matchAll(/`+/g)].map((match) => match[0].length + 1),
    ),
  );
  // Renderer supports standard triple fences; reject embedded fences rather than split the snippet.
  const snippet = `\n\`\`\`${language}\n${code}\n\`\`\`\n`;
  const invalid =
    !code.trim() || snippet.length > remaining || fence.length > 3;
  return (
    <>
      <button
        type="button"
        className="icon-button"
        aria-label="Add an expression"
        title="Expressions & emoji"
        disabled={disabled}
        onClick={() => {
          setQuery("");
          setDialog("emoji");
        }}
      >
        <Icon name="smile" />
      </button>
      <button
        type="button"
        className="icon-button"
        aria-label="Paste a code snippet"
        title="Paste a code snippet"
        disabled={disabled}
        onClick={() => setDialog("code")}
      >
        <Icon name="code" />
      </button>
      {dialog === "emoji" && (
        <Modal
          title="A little expression"
          onClose={() => setDialog(null)}
          className="expressions-modal"
        >
          <p className="muted">Tiny moods. Excellent delivery.</p>
          <label className="sr-only" htmlFor="expression-search">
            Find an expression
          </label>
          <input
            id="expression-search"
            data-dialog-autofocus
            placeholder="Find a mood…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="expression-grid">
            {expressions
              .filter(([name]) =>
                name.toLowerCase().includes(query.toLowerCase()),
              )
              .map(([name, value]) => (
                <button
                  type="button"
                  key={name}
                  title={name}
                  disabled={value.length > remaining}
                  onClick={() => {
                    insert(value);
                    setDialog(null);
                  }}
                >
                  <span>{value}</span>
                  <small>{name}</small>
                </button>
              ))}
          </div>
          {!expressions.some(([name]) =>
            name.toLowerCase().includes(query.toLowerCase()),
          ) && (
            <p className="field-hint">No matching mood. Try another word.</p>
          )}
        </Modal>
      )}
      {dialog === "code" && (
        <Modal
          title="Paste a code note"
          className="code-modal"
          onClose={() => setDialog(null)}
        >
          <p className="muted">
            Keep the formatting. Your code is displayed as text, never executed.
          </p>
          <label htmlFor="snippet-language">Language</label>
          <select
            id="snippet-language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            {languages.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <label htmlFor="snippet-code">Code</label>
          <textarea
            id="snippet-code"
            ref={codeRef}
            data-dialog-autofocus
            className="snippet-input"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Paste your code here…"
            rows={10}
            maxLength={4000}
            spellCheck={false}
          />
          <p className="field-hint">
            {snippet.length.toLocaleString()} / {remaining.toLocaleString()}{" "}
            available characters, including formatting.
          </p>
          {fence.length > 3 && (
            <p className="form-error">
              Remove triple backticks from the snippet; the code tool adds them
              for you.
            </p>
          )}
          {snippet.length > remaining && (
            <p className="form-error">
              Shorten the snippet or remove some message text.
            </p>
          )}
          <div className="dialog-footer">
            <button
              type="button"
              className="button"
              onClick={() => setDialog(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="button primary"
              disabled={invalid}
              onClick={() => {
                insert(snippet);
                setCode("");
                setDialog(null);
              }}
            >
              Insert code
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
