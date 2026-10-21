import {
  useCallback,
  useId,
  useMemo,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useAuth } from "@clerk/clerk-react";
import { Link, useSearchParams } from "react-router-dom";
import {
  syncDeletedMessages,
  getMessages,
  sendMessage,
  sendVoiceMessage,
} from "../api/messages";
import Icon from "./Icon";
import { mergeMessage, mergeMessages } from "../utils/mergeMessages";
import { messageWindow } from "../utils/messageWindow";
import MessageItem from "./MessageItem";
import MessageRail from "./MessageRail";
import ThreadPanel from "./ThreadPanel";
import { getChanges, markRoomRead, notifyActivity } from "../api/collaboration";

import ComposerTools from "./ComposerTools";
import VoicePill from "./VoicePill";
import useVoiceRecorder from "../hooks/useVoiceRecorder";

const accessDenied = (error) => [401, 403, 404].includes(error.status);

export default function ChatPanel({
  roomId,
  roomName,
  searchOpen = false,
  typingMembers = [],
  onTyping = () => {},
}) {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [newCount, setNewCount] = useState(0);
  const sync = useRef(null),
    lastRead = useRef(null),
    messagesRef = useRef([]);
  const threadId = params.get("thread");
  const openThread = (id) =>
    setParams((current) => {
      const next = new URLSearchParams(current);
      if (id) next.set("thread", id);
      else next.delete("thread");
      return next;
    });
  const { getToken } = useAuth();
  const [messages, setMessages] = useState([]);
  const [pagination, setPagination] = useState({
    hasMore: false,
    nextCursor: null,
  });
  const [loading, setLoading] = useState({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [sending, setSending] = useState(false);
  const [olderError, setOlderError] = useState("");
  const [sendError, setSendError] = useState("");
  const [draft, setDraft] = useState("");
  const recorder = useVoiceRecorder();
  const selection = useRef({ start: 0, end: 0 });
  const voiceBusy = recorder.status !== "idle";
  const scrollRef = useRef(null);
  const stickToLatest = useRef(true);
  const historyId = useId();
  const draftRef = useRef(null);
  const controllerRef = useRef(null);
  const operations = useRef({ older: false, sending: false });
  const scrollChange = useRef(null);

  const updateMessage = useCallback(
    (updated) =>
      setMessages((current) =>
        current.map((message) =>
          message.id === updated.id ? mergeMessage(message, updated) : message,
        ),
      ),
    [],
  );
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    const controller = new AbortController();
    controllerRef.current = controller;
    async function load() {
      try {
        const token = await getToken();
        if (controller.signal.aborted) return;
        const page = await getMessages(token, roomId, {
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        scrollChange.current = { mode: "bottom" };
        sync.current = page.syncCursor;
        setMessages(page.messages);
        const latest = page.messages.at(-1);
        if (latest && !document.hidden) {
          lastRead.current = latest.id;
          markRoomRead(token, roomId, latest.id)
            .then(notifyActivity)
            .catch(() => {});
        }
        setPagination(page.pagination);
        setLoading({ status: "ready" });
      } catch (error) {
        if (!controller.signal.aborted) {
          setMessages([]);
          setLoading({
            status: accessDenied(error) ? "denied" : "error",
            message: error.message,
          });
        }
      }
    }
    load();
    return () => controller.abort();
  }, [getToken, roomId, attempt]);

  useEffect(() => {
    if (loading.status !== "ready") return;
    const controller = new AbortController();
    let pending = false;
    async function poll() {
      if (
        pending ||
        document.hidden ||
        operations.current.sending ||
        operations.current.older
      )
        return;
      pending = true;
      try {
        const token = await getToken();
        if (controller.signal.aborted) return;
        const page = await getMessages(token, roomId, {
          limit: 100,
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        const current = messagesRef.current,
          ids = new Set(current.map((row) => row.id));
        // A larger polling window may contain older history; it is not new activity.
        let additions = messageWindow(current, page.messages);
        const overlap = page.messages.some((row) => ids.has(row.id));
        // Catch up through the forward cursor when more than one page arrived.
        if (sync.current && !overlap && page.pagination.hasMore) {
          additions = [];
          for (let count = 0; count < 5; count++) {
            const next = await getChanges(
              token,
              roomId,
              sync.current,
              controller.signal,
            );
            if (controller.signal.aborted) return;
            additions.push(...next.messages);
            sync.current = next.syncCursor;
            if (!next.hasMore) break;
          }
        } else sync.current = page.syncCursor;
        const tombstones = await syncDeletedMessages(
          token,
          roomId,
          current,
          controller.signal,
        );
        if (controller.signal.aborted) return;
        additions.push(...tombstones);
        const element = scrollRef.current;
        const atBottom =
          element &&
          element.scrollHeight - element.scrollTop - element.clientHeight < 100;
        const fresh = additions.filter((row) => !ids.has(row.id));
        if (atBottom) setNewCount(0);
        if (fresh.length && atBottom) scrollChange.current = { mode: "bottom" };
        else if (fresh.length) setNewCount((value) => value + fresh.length);
        setMessages((previous) => mergeMessages(previous, additions));
        const latest = fresh.at(-1);
        if (latest && atBottom && lastRead.current !== latest.id) {
          lastRead.current = latest.id;
          await markRoomRead(token, roomId, latest.id);
          notifyActivity();
        }
      } catch (error) {
        if (!controller.signal.aborted && accessDenied(error)) {
          setMessages([]);
          setLoading({ status: "denied", message: error.message });
        }
      } finally {
        pending = false;
      }
    }
    const timer = setInterval(poll, 6000);
    const focus = () => {
      if (!document.hidden) poll();
    };
    document.addEventListener("visibilitychange", focus);
    return () => {
      controller.abort();
      clearInterval(timer);
      document.removeEventListener("visibilitychange", focus);
    };
  }, [getToken, roomId, loading.status]);

  function jumpToLatest() {
    stickToLatest.current = true;
    const element = scrollRef.current;
    if (element) element.scrollTop = element.scrollHeight;
    setNewCount(0);
    const latest = messagesRef.current.at(-1);
    if (latest && lastRead.current !== latest.id) {
      lastRead.current = latest.id;
      getToken()
        .then((token) => markRoomRead(token, roomId, latest.id))
        .then(notifyActivity)
        .catch(() => {});
    }
  }

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
    if (change.mode === "bottom") {
      stickToLatest.current = true;
      element.scrollTop = element.scrollHeight;
    } else
      element.scrollTop = change.top + element.scrollHeight - change.height;
    scrollChange.current = null;
  }, [messages]);

  // Keep the latest message anchored as fonts/code/composer sizes settle.
  // Readers who scroll into history keep their current position instead.
  useEffect(() => {
    const element = scrollRef.current;
    const list = element?.querySelector(".message-list");
    if (!element || !list) return;
    const resize = new ResizeObserver(() => {
      if (stickToLatest.current) element.scrollTop = element.scrollHeight;
    });
    resize.observe(element);
    resize.observe(list);
    return () => resize.disconnect();
  }, [loading.status, messages.length]);

  function refresh() {
    if (voiceBusy || operations.current.older || operations.current.sending)
      return;
    setMessages([]);
    setPagination({ hasMore: false, nextCursor: null });
    setOlderError("");
    setSendError("");
    setLoading({ status: "loading" });
    setAttempt((value) => value + 1);
  }

  async function loadOlder() {
    if (
      voiceBusy ||
      !pagination.hasMore ||
      !pagination.nextCursor ||
      operations.current.older ||
      operations.current.sending ||
      loading.status !== "ready"
    )
      return;
    const controller = controllerRef.current;
    if (!controller || controller.signal.aborted) return;
    operations.current.older = true;
    setLoadingOlder(true);
    setOlderError("");
    try {
      const token = await getToken();
      if (controller.signal.aborted) return;
      const page = await getMessages(token, roomId, {
        before: pagination.nextCursor,
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      const element = scrollRef.current;
      if (element)
        scrollChange.current = {
          mode: "prepend",
          top: element.scrollTop,
          height: element.scrollHeight,
        };
      setMessages((current) => {
        const ids = new Set(current.map((message) => message.id));
        return [
          ...page.messages.filter((message) => !ids.has(message.id)),
          ...current,
        ];
      });
      setPagination(page.pagination);
    } catch (error) {
      if (!controller.signal.aborted) {
        if (accessDenied(error)) {
          setMessages([]);
          setLoading({ status: "denied", message: error.message });
        } else setOlderError(error.message);
      }
    } finally {
      operations.current.older = false;
      if (!controller.signal.aborted) setLoadingOlder(false);
    }
  }

  async function submit(event) {
    event.preventDefault();
    const body = draft.trim();
    if (
      voiceBusy ||
      !body ||
      body.length > 4000 ||
      operations.current.sending ||
      operations.current.older ||
      loading.status !== "ready"
    )
      return;
    const controller = controllerRef.current;
    if (!controller || controller.signal.aborted) return;
    operations.current.sending = true;
    setSending(true);
    setSendError("");
    try {
      const token = await getToken();
      if (controller.signal.aborted) return;
      const message = await sendMessage(token, roomId, body, {
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      scrollChange.current = { mode: "bottom" };
      setMessages((current) =>
        current.some((item) => item.id === message.id)
          ? current
          : [...current, message],
      );
      setDraft("");
      onTyping(false);
      notifyActivity();
    } catch (error) {
      if (!controller.signal.aborted) {
        if (accessDenied(error)) {
          setMessages([]);
          setLoading({ status: "denied", message: error.message });
        } else setSendError(error.message);
      }
    } finally {
      operations.current.sending = false;
      if (!controller.signal.aborted) setSending(false);
    }
  }

  function insert(value) {
    const { start, end } = selection.current;
    setDraft((current) => current.slice(0, start) + value + current.slice(end));
    requestAnimationFrame(() => {
      draftRef.current?.focus();
      draftRef.current?.setSelectionRange(
        start + value.length,
        start + value.length,
      );
    });
  }

  async function sendVoice() {
    if (
      !recorder.preview ||
      operations.current.sending ||
      operations.current.older ||
      loading.status !== "ready"
    )
      return;
    const controller = controllerRef.current;
    if (!controller || controller.signal.aborted) return;
    operations.current.sending = true;
    setSending(true);
    setSendError("");
    try {
      const token = await getToken();
      if (controller.signal.aborted) return;
      const message = await sendVoiceMessage(token, roomId, recorder.preview, {
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      scrollChange.current = { mode: "bottom" };
      setMessages((current) =>
        current.some((item) => item.id === message.id)
          ? current
          : [...current, message],
      );
      recorder.discard();
    } catch (error) {
      if (!controller.signal.aborted) {
        if (accessDenied(error)) {
          recorder.discard();
          setMessages([]);
          setLoading({ status: "denied", message: error.message });
        } else
          setSendError(
            error.message || "Couldn’t reach the server. Try again.",
          );
      }
    } finally {
      operations.current.sending = false;
      if (!controller.signal.aborted) setSending(false);
    }
  }

  function handleKeyDown(event) {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      event.currentTarget.form.requestSubmit();
    }
  }

  const visibleMessages = useMemo(
    () =>
      messages.filter(
        (message) =>
          !searchOpen ||
          !search.trim() ||
          `${message.body} ${message.author.displayName}`
            .toLowerCase()
            .includes(search.trim().toLowerCase()),
      ),
    [messages, search, searchOpen],
  );

  return (
    <section className="chat-panel" aria-labelledby="conversation-heading">
      <div className="section-heading chat-heading">
        <h2 id="conversation-heading">Conversation</h2>
        <button
          className="text-button refresh-messages"
          onClick={refresh}
          disabled={
            loading.status === "loading" || loadingOlder || sending || voiceBusy
          }
          title="Load the latest messages from your group"
        >
          <Icon name="refresh" size={13} />
          Refresh latest
        </button>
      </div>
      {searchOpen && (
        <div className="message-search">
          <label className="sr-only" htmlFor="loaded-message-search">
            Search loaded messages
          </label>
          <Icon name="search" size={14} />
          <input
            id="loaded-message-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search loaded messages…"
          />
          <span>
            {
              messages.filter((message) =>
                `${message.body} ${message.author.displayName}`
                  .toLowerCase()
                  .includes(search.toLowerCase()),
              ).length
            }{" "}
            found
          </span>
        </div>
      )}
      {loading.status === "loading" ? (
        <p className="chat-notice muted" role="status">
          Loading messages…
        </p>
      ) : loading.status === "denied" ? (
        <div className="chat-notice" role="alert">
          <p>{loading.message}</p>
          <Link to="/workspace" className="back-link">
            Back to your rooms
          </Link>
        </div>
      ) : loading.status === "error" ? (
        <div className="chat-notice" role="alert">
          <p>{loading.message}</p>
          <button className="button secondary" onClick={refresh}>
            Try again
          </button>
        </div>
      ) : (
        <>
          {pagination.hasMore && (
            <div className="history-controls">
              <button
                className="text-button"
                onClick={loadOlder}
                disabled={loadingOlder || sending}
              >
                {loadingOlder
                  ? "Loading older messages…"
                  : "Load older messages"}
              </button>
            </div>
          )}
          {olderError && (
            <p className="form-error history-error" role="alert">
              {olderError} Use “Load older messages” to retry.
            </p>
          )}
          <div className="conversation-history">
            <MessageRail
              messages={visibleMessages}
              scrollRef={scrollRef}
              historyId={historyId}
            />
            <div
              id={historyId}
              className="chat-scroll"
              ref={scrollRef}
              tabIndex={0}
              role="region"
              aria-label="Message history"
              aria-busy={loadingOlder}
              onScroll={(event) => {
                stickToLatest.current =
                  event.currentTarget.scrollHeight -
                    event.currentTarget.scrollTop -
                    event.currentTarget.clientHeight <
                  25;
                if (
                  newCount > 0 &&
                  event.currentTarget.scrollHeight -
                    event.currentTarget.scrollTop -
                    event.currentTarget.clientHeight <
                    25
                )
                  jumpToLatest();
                if (event.currentTarget.scrollTop <= 50 && !olderError)
                  loadOlder();
              }}
            >
              {messages.length === 0 ? (
                <div className="chat-empty">
                  <span className="empty-icon">
                    <Icon name="chat" size={28} />
                  </span>
                  <p className="eyebrow">A LITTLE ROOM FOR SOMETHING GOOD</p>
                  <h3>This is where it starts.</h3>
                  <p className="muted">
                    A thought, a question, a simple hello.
                    <br />
                    Make the first move.
                  </p>
                </div>
              ) : (
                <ol className="message-list">
                  {visibleMessages.map((message, index, array) => {
                    const previous = array[index - 1],
                      date = new Date(message.createdAt);
                    const sameDay =
                      previous &&
                      new Date(previous.createdAt).toDateString() ===
                        date.toDateString();
                    const grouped =
                      sameDay &&
                      previous.author.id === message.author.id &&
                      date - new Date(previous.createdAt) <= 300000;
                    return (
                      <li
                        className="message"
                        key={message.id}
                        data-message-id={message.id}
                      >
                        {!sameDay && (
                          <div className="date-separator">
                            <span>
                              {date.toDateString() === new Date().toDateString()
                                ? "Today"
                                : date.toLocaleDateString(undefined, {
                                    weekday: "short",
                                    month: "short",
                                    day: "numeric",
                                  })}
                            </span>
                          </div>
                        )}
                        <MessageItem
                          message={message}
                          grouped={grouped}
                          onUpdated={updateMessage}
                          onThread={openThread}
                        />
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>
          </div>
          {newCount > 0 && (
            <button
              type="button"
              className="new-messages-button"
              onClick={jumpToLatest}
            >
              {newCount} new {newCount === 1 ? "message" : "messages"} ↓
            </button>
          )}
          <div className="typing-indicator" role="status">
            {typingMembers.length > 0 && (
              <>
                <span className="typing-dots">
                  <i />
                  <i />
                  <i />
                </span>
                {typingMembers
                  .map((member) => member.name.split(" ")[0])
                  .join(", ")}{" "}
                {typingMembers.length === 1 ? "is" : "are"} typing…
              </>
            )}
          </div>
          <form className="message-composer" onSubmit={submit}>
            {recorder.preview && (
              <div className="voice-preview">
                <div>
                  <span className="eyebrow">Voice preview · not sent</span>
                  <audio
                    controls
                    src={recorder.preview.url}
                    aria-label="Preview your recording"
                  />
                </div>
                <div className="voice-preview-actions">
                  <button
                    type="button"
                    className="text-button"
                    onClick={recorder.discard}
                    disabled={sending}
                  >
                    Discard
                  </button>
                  <button
                    type="button"
                    className="button primary"
                    onClick={sendVoice}
                    disabled={sending || loadingOlder}
                  >
                    {sending ? "Sending…" : "Send voice"}
                  </button>
                </div>
              </div>
            )}
            <div
              className={`composer-input reference-composer ${voiceBusy ? "is-recording" : ""}`}
            >
              <label className="sr-only" htmlFor="message-draft">
                Message your room
              </label>
              <textarea
                ref={draftRef}
                id="message-draft"
                value={draft}
                onChange={(event) => {
                  setDraft(event.target.value);
                  onTyping(Boolean(event.target.value.trim()));
                }}
                onSelect={(event) => {
                  selection.current = {
                    start: event.target.selectionStart,
                    end: event.target.selectionEnd,
                  };
                }}
                onKeyDown={handleKeyDown}
                placeholder={`Message ${roomName || "your room"}`}
                maxLength={4000}
                rows={1}
                readOnly={sending || voiceBusy}
                disabled={loadingOlder}
                aria-describedby="composer-hint"
              />
              {voiceBusy && (
                <span className="recording-status" role="status">
                  {recorder.status === "requesting"
                    ? "Waiting for microphone…"
                    : recorder.status === "recording"
                      ? "Recording…"
                      : "Preparing preview…"}
                </span>
              )}
              <div className="composer-tools">
                <div className="composer-edit-tools">
                  <ComposerTools
                    disabled={sending || loadingOlder || voiceBusy}
                    insert={insert}
                    remaining={4000 - draft.length}
                  />
                </div>
                <VoicePill
                  recorder={recorder}
                  disabled={
                    sending || loadingOlder || Boolean(recorder.preview)
                  }
                />
                {voiceBusy && (
                  <button
                    type="button"
                    className="icon-button"
                    aria-label="Cancel recording"
                    onClick={() => recorder.stop(true)}
                  >
                    <Icon name="close" size={16} />
                  </button>
                )}
              </div>
              <div className="composer-send-group">
                <span
                  className="composer-shortcut"
                  title="Shift + Enter for a new line"
                >
                  <kbd>⇧</kbd>
                  <kbd>↵</kbd>new line
                </span>
                <button
                  className="send-button"
                  disabled={
                    !draft.trim() || sending || loadingOlder || voiceBusy
                  }
                  aria-label={sending ? "Sending message" : "Send message"}
                >
                  <span>{sending ? "Sending…" : "Send"}</span>
                  <Icon name="arrow" size={15} />
                </button>
              </div>
            </div>
            {recorder.error && (
              <p className="form-error" role="alert">
                {recorder.error}
              </p>
            )}
            {sendError && (
              <p className="form-error" role="alert">
                {sendError} Your text and unsent recording are still here.
              </p>
            )}
            <span id="composer-hint" className="sr-only">
              Enter to send. Shift + Enter for a new line. Maximum 4,000
              characters. Tap the microphone to record a voice message.
            </span>
            {draft.length >= 3500 && (
              <span className="character-count near-limit" role="status">
                {draft.length.toLocaleString()}/4,000
              </span>
            )}
          </form>
          {threadId && (
            <ThreadPanel
              key={threadId}
              roomId={roomId}
              messageId={threadId}
              onClose={() => openThread(null)}
              onParentUpdated={updateMessage}
              onTyping={onTyping}
            />
          )}
        </>
      )}
    </section>
  );
}
