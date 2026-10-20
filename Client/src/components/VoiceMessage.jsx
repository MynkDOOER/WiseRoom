import { useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { loadVoiceMessage } from "../api/messages";

export default function VoiceMessage({ message, roomId }) {
  const { getToken } = useAuth();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const audio = useRef(null);
  const request = useRef(null);
  useEffect(() => () => request.current?.abort(), []);
  useEffect(
    () => () => {
      if (url) URL.revokeObjectURL(url);
    },
    [url],
  );
  async function load() {
    if (request.current && !request.current.signal.aborted) return;
    const controller = new AbortController();
    request.current = controller;
    setLoading(true);
    setError("");
    try {
      const token = await getToken();
      if (controller.signal.aborted) return;
      const blob = await loadVoiceMessage(
        token,
        roomId,
        message.id,
        controller.signal,
      );
      if (controller.signal.aborted) return;
      setUrl(URL.createObjectURL(blob));
    } catch (cause) {
      if (!controller.signal.aborted) setError(cause.message);
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
        request.current = null;
      }
    }
  }
  const seconds = Math.round(message.voiceDurationMs / 1000);
  return (
    <div className="message-body voice-message">
      <span className="voice-message-label">
        Voice note · {Math.floor(seconds / 60)}:
        {String(seconds % 60).padStart(2, "0")}
      </span>
      {url ? (
        <audio
          ref={audio}
          controls
          src={url}
          preload="metadata"
          aria-label={`Voice message from ${message.author.displayName || "room member"}`}
          onError={() =>
            setError("Your browser couldn’t play this recording format.")
          }
        />
      ) : (
        <button
          type="button"
          className="button"
          onClick={load}
          disabled={loading}
        >
          {loading ? "Loading audio…" : "Load voice note"}
        </button>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <time className="message-time" dateTime={message.createdAt}>
        {new Date(message.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </time>
    </div>
  );
}
