import { useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import {
  reactToMessage,
  saveMessage,
  notifyActivity,
} from "../api/collaboration";
import MessageContent from "./MessageContent";
import VoiceMessage from "./VoiceMessage";
import Icon from "./Icon";
const choices = ["👍", "🔥", "👀", "❤️", "😂", "🎉"];
export default function MessageItem({
  message,
  grouped = false,
  onUpdated = () => {},
  onThread,
  showRoom = false,
}) {
  const { getToken, userId } = useAuth();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [menu, setMenu] = useState(false),
    [chooser, setChooser] = useState(false),
    [feedback, setFeedback] = useState("");
  const menuRef = useRef(null),
    triggerRef = useRef(null);
  const mine = message.author.id === userId;
  const name = mine ? "You" : message.author.displayName || "Unnamed member";
  const initials = (message.author.displayName || "U")
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    .filter(Boolean);
  const letters =
    (initials[0] || "U") + (initials.length > 1 ? initials.at(-1) : "");
  const selected = Boolean(message.savedBy?.length || message.saved);
  const reactions = new Map();
  for (const reaction of message.reactions || []) {
    const entry = reactions.get(reaction.emoji) || { count: 0, mine: false };
    entry.count++;
    entry.mine ||= reaction.userId === userId;
    reactions.set(reaction.emoji, entry);
  }
  useEffect(() => {
    if (!menu && !chooser) return;
    const close = (event) => {
      if (event.type === "keydown" && event.key !== "Escape") return;
      if (
        event.type === "keydown" ||
        !menuRef.current?.contains(event.target)
      ) {
        setMenu(false);
        setChooser(false);
        if (event.type === "keydown") triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, [menu, chooser]);
  async function action(kind, emoji) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const token = await getToken();
      const updated =
        kind === "save"
          ? await saveMessage(token, message.roomId, message.id, !selected)
          : await reactToMessage(
              token,
              message.roomId,
              message.id,
              emoji,
              !reactions.get(emoji)?.mine,
            );
      onUpdated(updated);
      notifyActivity();
      setMenu(false);
      setChooser(false);
    } catch (cause) {
      setError(cause.message);
    } finally {
      setBusy(false);
    }
  }
  async function copy(link = false) {
    try {
      await navigator.clipboard.writeText(
        link
          ? new URL(
              `/rooms/${message.roomId}?thread=${message.parentId || message.id}`,
              window.location.origin,
            ).href
          : message.body || "Voice message",
      );
      setFeedback(link ? "Message link copied" : "Message copied");
    } catch {
      setError("Copy unavailable in this browser.");
    }
    setMenu(false);
  }
  return (
    <article
      className={`message-item ${mine ? "is-own" : ""} ${grouped ? "is-grouped" : ""}`}
      aria-label={`Message from ${name}`}
    >
      <div className="message-actions" ref={menuRef}>
        {choices.slice(0, 3).map((emoji) => (
          <button
            type="button"
            key={emoji}
            className="quick-reaction"
            title={`React ${emoji}`}
            aria-label={`React ${emoji}`}
            disabled={busy}
            onClick={() => action("reaction", emoji)}
          >
            {emoji}
          </button>
        ))}
        {onThread && (
          <button
            type="button"
            aria-label="Reply in thread"
            title="Reply in thread"
            onClick={() => onThread(message.parentId || message.id)}
          >
            <Icon name="chat" size={14} />
          </button>
        )}
        <button
          ref={triggerRef}
          type="button"
          aria-label="Message actions"
          aria-expanded={menu}
          onClick={() => {
            setMenu(!menu);
            setChooser(false);
          }}
        >
          <Icon name="more" size={15} />
        </button>
        {menu && (
          <div className="message-action-menu">
            {onThread && (
              <button
                type="button"
                onClick={() => {
                  setMenu(false);
                  onThread(message.parentId || message.id);
                }}
              >
                <Icon name="chat" size={14} />
                Reply in thread
              </button>
            )}
            <button
              type="button"
              disabled={busy}
              onClick={() => action("save")}
            >
              <Icon name="bookmark" size={14} />
              {selected ? "Remove from Saved" : "Save message"}
            </button>
            <button type="button" onClick={() => copy()}>
              <Icon name="copy" size={14} />
              Copy text
            </button>
            <button type="button" onClick={() => copy(true)}>
              <Icon name="link" size={14} />
              Copy message link
            </button>
            <button
              type="button"
              onClick={() => {
                setChooser(true);
                setMenu(false);
              }}
            >
              <Icon name="smile" size={14} />
              More reactions
            </button>
          </div>
        )}
        {chooser && (
          <div className="reaction-chooser" aria-label="Choose a reaction">
            {choices.map((emoji) => (
              <button
                type="button"
                disabled={busy}
                key={emoji}
                aria-label={`React ${emoji}`}
                onClick={() => action("reaction", emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
      <span className="avatar message-avatar" aria-hidden="true">
        {letters.toUpperCase()}
      </span>
      {grouped && (
        <time className="grouped-row-time" dateTime={message.createdAt}>
          {new Date(message.createdAt).toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
          })}
        </time>
      )}
      <div className="message-content">
        <div className="message-meta">
          <strong>{name}</strong>
          <time
            dateTime={message.createdAt}
            title={new Date(message.createdAt).toLocaleString()}
          >
            {new Date(message.createdAt).toLocaleTimeString([], {
              hour: "numeric",
              minute: "2-digit",
            })}
          </time>
          {selected && (
            <span className="saved-marker" title="Saved by you">
              <Icon name="bookmark" size={12} />
            </span>
          )}
          {showRoom && (
            <span className="message-room-name">in {message.room?.name}</span>
          )}
        </div>
        {message.voiceMime ? (
          <VoiceMessage message={message} roomId={message.roomId} />
        ) : (
          <MessageContent body={message.body} />
        )}
        {(reactions.size > 0 || message._count?.replies > 0) && (
          <div className="message-extras">
            {[...reactions].map(([emoji, value]) => (
              <button
                type="button"
                className={`reaction-pill ${value.mine ? "selected" : ""}`}
                key={emoji}
                aria-label={`${emoji}, ${value.count} reactions${value.mine ? ", including yours" : ""}`}
                aria-pressed={value.mine}
                onClick={() => action("reaction", emoji)}
                disabled={busy}
              >
                {emoji}
                <span>{value.count}</span>
              </button>
            ))}
            {message._count?.replies > 0 && onThread && (
              <button
                type="button"
                className="thread-link"
                onClick={() => onThread(message.id)}
              >
                <Icon name="chat" size={13} />
                {message._count.replies}{" "}
                {message._count.replies === 1 ? "reply" : "replies"}
              </button>
            )}
          </div>
        )}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        {feedback && (
          <span className="sr-only" role="status">
            {feedback}
          </span>
        )}
      </div>
    </article>
  );
}
