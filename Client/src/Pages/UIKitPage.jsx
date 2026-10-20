import { useState } from "react";
import { Link } from "react-router-dom";
import Button from "../components/ui/Button";
import TextField from "../components/ui/TextField";
import Badge from "../components/ui/Badge";
import RoomAvatar from "../components/ui/RoomAvatar";
import Modal from "../components/Modal";
import Icon from "../components/Icon";
import MessageContent from "../components/MessageContent";

const colors = [
  ["Canvas", "#0F0C11", "--canvas"],
  ["Paper", "#1A161D", "--paper"],
  ["Ivory", "#F4EDE6", "--ink"],
  ["Orange", "#FF5A1F", "--accent"],
  ["Highlight", "#392018", "--highlight"],
];
export default function UIKitPage() {
  const [dialog, setDialog] = useState(false);
  const [name, setName] = useState("");
  const [feedback, setFeedback] = useState("");
  return (
    <main className="kit-page">
      <header className="kit-header">
        <div>
          <Badge tone="accent">WiseRoom / UI kit</Badge>
          <h1>Built to talk.</h1>
          <p>
            Quiet surfaces, focused conversations. These are the same components
            used by the app.
          </p>
        </div>
        <Link className="button secondary" to="/workspace">
          Open workspace
          <Icon name="arrow" />
        </Link>
      </header>
      <section className="kit-section">
        <h2>01 / Color</h2>
        <div className="kit-grid">
          {colors.map(([label, hex, token]) => (
            <div className="kit-swatch" key={token}>
              <div style={{ background: `var(${token})` }} />
              <p>
                {label}
                <code>
                  {hex} · {token}
                </code>
              </p>
            </div>
          ))}
        </div>
      </section>
      <section className="kit-section">
        <h2>02 / Typography</h2>
        <div className="kit-sample">
          <p className="kit-type-display">
            A clear place for your conversations.
          </p>
          <p className="kit-space">
            Bricolage Grotesque for display headings. Hanken Grotesk for the
            interface and messages. JetBrains Mono for code and small labels.
          </p>
          <p className="kit-caption">
            Body 15px · Metadata 12px · Headings 600–800 · Comfortable line
            spacing
          </p>
          <pre className="kit-space">
            <code>const room = await getRoom(roomId);</code>
          </pre>
        </div>
      </section>
      <section className="kit-section">
        <h2>03 / Actions & states</h2>
        <div className="kit-sample">
          <div className="kit-actions">
            <Button
              variant="primary"
              onClick={() => setFeedback("Primary action selected.")}
            >
              <Icon name="plus" />
              Primary action
            </Button>
            <Button onClick={() => setDialog(true)}>Open dialog</Button>
            <Button
              variant="danger-outline"
              onClick={() =>
                setFeedback(
                  "Destructive actions require confirmation in the app.",
                )
              }
            >
              Destructive
            </Button>
            <Button disabled>Unavailable</Button>
          </div>
          <div className="kit-actions kit-space">
            <Badge tone="accent">Owner</Badge>
            <Badge>Member</Badge>
            <Badge tone="danger">Error</Badge>
            <RoomAvatar name="Design studio" />
            <RoomAvatar name="Reading room" />
          </div>
          {feedback && (
            <p className="kit-feedback" role="status">
              {feedback}
            </p>
          )}
        </div>
      </section>
      <section className="kit-section">
        <h2>04 / Fields</h2>
        <div className="kit-grid">
          <div className="kit-sample">
            <TextField
              label="Room name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              hint="3–80 characters. The owner can rename it."
              placeholder="e.g. Design studio"
            />
          </div>
          <div className="kit-sample">
            <TextField
              label="Validation example"
              defaultValue="D"
              error="Use at least 3 characters."
            />
          </div>
        </div>
      </section>
      <section className="kit-section">
        <h2>05 / Conversation</h2>
        <div className="kit-sample">
          <div className="message kit-message">
            <div className="message-meta">
              <strong>Member</strong>
            </div>
            <MessageContent
              body="A readable message with a quiet surface and a clear outline."
              createdAt="2026-10-20T10:30:00Z"
            />
          </div>
          <div className="message mine kit-message">
            <div className="message-meta">
              <strong>You</strong>
            </div>
            <MessageContent
              body={
                "Code stays distinct.\n```js\nconst room = await getRoom(roomId);\n```"
              }
              createdAt="2026-10-20T10:31:00Z"
            />
          </div>
        </div>
      </section>
      <section className="kit-section">
        <h2>06 / Interaction rules</h2>
        <div className="kit-sample">
          <p>
            Soft outlines on surfaces. Left-aligned messages. Visible keyboard
            focus. Generous touch targets. Color always paired with labels.
            Motion follows your system preference.
          </p>
        </div>
      </section>
      {dialog && (
        <Modal title="A reusable dialog" onClose={() => setDialog(false)}>
          <p className="muted">
            Native keyboard focus, Escape to close, and focus returned to the
            opener.
          </p>
          <div className="dialog-footer">
            <Button onClick={() => setDialog(false)}>Close</Button>
            <Button
              variant="primary"
              onClick={() => {
                setDialog(false);
                setFeedback("Dialog action completed.");
              }}
            >
              Confirm
            </Button>
          </div>
        </Modal>
      )}
    </main>
  );
}
