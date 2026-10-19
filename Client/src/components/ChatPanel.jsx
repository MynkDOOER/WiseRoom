import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import { getMessages, sendMessage } from "../api/messages";
import Icon from "./Icon";
import MessageContent from "./MessageContent";

const accessDenied = error => [401, 403, 404].includes(error.status);

export default function ChatPanel({ roomId, roomName }) {
  const { getToken, userId } = useAuth();
  const [messages, setMessages] = useState([]);
  const [pagination, setPagination] = useState({ hasMore: false, nextCursor: null });
  const [loading, setLoading] = useState({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [sending, setSending] = useState(false);
  const [olderError, setOlderError] = useState("");
  const [sendError, setSendError] = useState("");
  const [draft, setDraft] = useState("");
  const scrollRef = useRef(null);
  const draftRef = useRef(null);
  const controllerRef = useRef(null);
  const operations = useRef({ older: false, sending: false });
  const scrollChange = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    controllerRef.current = controller;
    async function load() {
      try {
        const token = await getToken();
        if (controller.signal.aborted) return;
        const page = await getMessages(token, roomId, { signal: controller.signal });
        if (controller.signal.aborted) return;
        scrollChange.current = { mode: "bottom" };
        setMessages(page.messages);
        setPagination(page.pagination);
        setLoading({ status: "ready" });
      } catch (error) {
        if (!controller.signal.aborted) {
          setMessages([]);
          setLoading({ status: accessDenied(error) ? "denied" : "error", message: error.message });
        }
      }
    }
    load();
    return () => controller.abort();
  }, [getToken, roomId, attempt]);

  useLayoutEffect(() => {
    const input = draftRef.current;
    if (!input) return;
    input.style.height = "auto";
    input.style.height = `${Math.min(input.scrollHeight, 160)}px`;
  }, [draft, loading.status]);

  useLayoutEffect(() => {
    const element = scrollRef.current;
    const change = scrollChange.current;
    if (!element || !change) return;
    if (change.mode === "bottom") element.scrollTop = element.scrollHeight;
    else element.scrollTop = change.top + element.scrollHeight - change.height;
    scrollChange.current = null;
  }, [messages]);

  function refresh() {
    if (operations.current.older || operations.current.sending) return;
    setMessages([]);
    setPagination({ hasMore: false, nextCursor: null });
    setOlderError("");
    setSendError("");
    setLoading({ status: "loading" });
    setAttempt(value => value + 1);
  }

  async function loadOlder() {
    if (!pagination.hasMore || !pagination.nextCursor || operations.current.older || operations.current.sending || loading.status !== "ready") return;
    const controller = controllerRef.current;
    if (!controller || controller.signal.aborted) return;
    operations.current.older = true;
    setLoadingOlder(true);
    setOlderError("");
    try {
      const token = await getToken();
      if (controller.signal.aborted) return;
      const page = await getMessages(token, roomId, { before: pagination.nextCursor, signal: controller.signal });
      if (controller.signal.aborted) return;
      const element = scrollRef.current;
      if (element) scrollChange.current = { mode: "prepend", top: element.scrollTop, height: element.scrollHeight };
      setMessages(current => {
        const ids = new Set(current.map(message => message.id));
        return [...page.messages.filter(message => !ids.has(message.id)), ...current];
      });
      setPagination(page.pagination);
    } catch (error) {
      if (!controller.signal.aborted) {
        if (accessDenied(error)) { setMessages([]); setLoading({ status: "denied", message: error.message }); }
        else setOlderError(error.message);
      }
    } finally {
      operations.current.older = false;
      if (!controller.signal.aborted) setLoadingOlder(false);
    }
  }

  async function submit(event) {
    event.preventDefault();
    const body = draft.trim();
    if (!body || body.length > 4000 || operations.current.sending || operations.current.older || loading.status !== "ready") return;
    const controller = controllerRef.current;
    if (!controller || controller.signal.aborted) return;
    operations.current.sending = true;
    setSending(true);
    setSendError("");
    try {
      const token = await getToken();
      if (controller.signal.aborted) return;
      const message = await sendMessage(token, roomId, body, { signal: controller.signal });
      if (controller.signal.aborted) return;
      scrollChange.current = { mode: "bottom" };
      setMessages(current => current.some(item => item.id === message.id) ? current : [...current, message]);
      setDraft("");
    } catch (error) {
      if (!controller.signal.aborted) {
        if (accessDenied(error)) { setMessages([]); setLoading({ status: "denied", message: error.message }); }
        else setSendError(error.message);
      }
    } finally {
      operations.current.sending = false;
      if (!controller.signal.aborted) setSending(false);
    }
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      event.currentTarget.form.requestSubmit();
    }
  }

  return (
    <section className="chat-panel" aria-labelledby="conversation-heading">
      <div className="section-heading chat-heading">
        <h2 id="conversation-heading">Conversation</h2>
        <button className="text-button refresh-messages" onClick={refresh} disabled={loading.status === "loading" || loadingOlder || sending} title="Load the latest messages from your group"><Icon name="refresh" size={13}/>Refresh latest</button>
      </div>
      {loading.status === "loading" ? <p className="chat-notice muted" role="status">Loading messages…</p>
        : loading.status === "denied" ? <div className="chat-notice" role="alert"><p>{loading.message}</p><Link to="/" className="back-link">Back to your rooms</Link></div>
          : loading.status === "error" ? <div className="chat-notice" role="alert"><p>{loading.message}</p><button className="button secondary" onClick={refresh}>Try again</button></div>
            : <>
              {pagination.hasMore && <div className="history-controls"><button className="text-button" onClick={loadOlder} disabled={loadingOlder || sending}>{loadingOlder ? "Loading older messages…" : "Load older messages"}</button></div>}
              {olderError && <p className="form-error history-error" role="alert">{olderError} Use “Load older messages” to retry.</p>}
              <div className="chat-scroll" ref={scrollRef} tabIndex={0} role="region" aria-label="Message history" aria-busy={loadingOlder} onScroll={event => { if (event.currentTarget.scrollTop <= 50 && !olderError) loadOlder(); }}>
                {messages.length === 0 ? <div className="chat-empty"><span className="empty-icon"><Icon name="chat" size={28}/></span><p className="eyebrow">A LITTLE ROOM FOR SOMETHING GOOD</p><h3>This is where it starts.</h3><p className="muted">A thought, a question, a simple hello.<br/>Make the first move.</p></div> : <ol className="message-list">
                  {messages.map((message, index) => {
                    const previous = messages[index - 1];
                    const date = new Date(message.createdAt);
                    const sameDay = previous && new Date(previous.createdAt).toDateString() === date.toDateString();
                    const grouped = sameDay && previous.author.id === message.author.id && date - new Date(previous.createdAt) <= 300000;
                    const mine = message.author.id === userId;
                    const displayName = mine ? "You" : message.author.displayName || "Unnamed member";
                    return <li key={message.id} className={`message ${mine ? "mine" : ""} ${grouped ? "grouped" : ""}`}>
                      {!sameDay && <div className="date-separator"><span>{date.toDateString() === new Date().toDateString() ? "Today" : date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</span></div>}
                      <div className="message-row"><span className={`avatar message-avatar ${mine ? "own-avatar" : ""} ${grouped ? "avatar-spacer" : ""}`} aria-hidden="true">{(message.author.displayName || "U").slice(0, 1).toUpperCase()}</span><div className="message-content">
                        <div className={`message-meta ${grouped ? "sr-only" : ""}`}><strong>{displayName}</strong></div>
                        <MessageContent body={message.body} createdAt={message.createdAt}/>
                      </div></div>
                    </li>;
                  })}
                </ol>}
              </div>
              <form className="message-composer" onSubmit={submit}>
                <div className="composer-input"><label className="sr-only" htmlFor="message-draft">Message your room</label>
                <textarea ref={draftRef} id="message-draft" value={draft} onChange={event => setDraft(event.target.value)} onKeyDown={handleKeyDown} placeholder={`Message ${roomName || "your room"}…`} maxLength={4000} rows={1} readOnly={sending} disabled={loadingOlder} aria-describedby="composer-hint"/>
                <button className="send-button" disabled={!draft.trim() || sending || loadingOlder} aria-label={sending ? "Sending message" : "Send message"} title="Send message (Enter)"><Icon name={sending ? "refresh" : "send"} size={18}/></button></div>
                {sendError && <p className="form-error" role="alert">{sendError} Your draft is still here.</p>}
                <div className="composer-footer"><span id="composer-hint"><kbd>Enter</kbd> to send <span className="composer-hint-divider">·</span> <kbd>Shift + Enter</kbd> for a new line</span><span className="character-count">{draft.length.toLocaleString()}/4,000</span></div>
                <p className="chat-sync-note">Use Refresh latest to see new messages from your group.</p>
              </form>
            </>}
    </section>
  );
}
