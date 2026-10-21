import { useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import {
  getThread,
  replyToThread,
  markRoomRead,
  notifyActivity,
} from "../api/collaboration";
import Modal from "./Modal";
import { syncDeletedMessages } from "../api/messages";
import { mergeMessage, mergeMessages } from "../utils/mergeMessages";
import MessageItem from "./MessageItem";
import Icon from "./Icon";
export default function ThreadPanel({
  roomId,
  messageId,
  onClose,
  onParentUpdated,
  onTyping = () => {},
}) {
  const { getToken } = useAuth();
  const [data, setData] = useState(null),
    [error, setError] = useState(""),
    [draft, setDraft] = useState(""),
    [busy, setBusy] = useState(false),
    [older, setOlder] = useState(false);
  const scroll = useRef(null),
    pending = useRef(false),
    controller = useRef(null),
    dataRef = useRef(null);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);
  useEffect(() => {
    const abort = new AbortController();
    controller.current = abort;
    async function load() {
      if (pending.current) return;
      pending.current = true;
      try {
        const token = await getToken();
        if (abort.signal.aborted) return;
        const page = await getThread(
          token,
          roomId,
          messageId,
          null,
          abort.signal,
        );
        if (abort.signal.aborted) return;
        const tombstones = await syncDeletedMessages(
          token,
          roomId,
          dataRef.current?.replies || [],
          abort.signal,
        );
        if (abort.signal.aborted) return;
        setData((current) =>
          current
            ? {
                ...page,
                parent: mergeMessage(current.parent, page.parent),
                replies: mergeMessages(current.replies, [
                  ...page.replies,
                  ...tombstones,
                ]),
                pagination:
                  !current.pagination.hasMore &&
                  page.pagination.hasMore &&
                  !page.replies.some((row) =>
                    current.replies.some((item) => item.id === row.id),
                  )
                    ? page.pagination
                    : current.pagination,
              }
            : page,
        );
        setError("");
        onParentUpdated(page.parent);
        const last = page.replies.at(-1) || page.parent;
        await markRoomRead(token, roomId, last.id);
        notifyActivity();
      } catch (cause) {
        if (!abort.signal.aborted) setError(cause.message);
      } finally {
        pending.current = false;
      }
    }
    load();
    const tick = setInterval(() => {
      if (!document.hidden) load();
    }, 6000);
    return () => {
      abort.abort();
      clearInterval(tick);
    };
  }, [getToken, roomId, messageId, onParentUpdated]);
  async function send(event) {
    event.preventDefault();
    if (busy || !draft.trim()) return;
    setBusy(true);
    setError("");
    try {
      const token = await getToken();
      const reply = await replyToThread(
        token,
        roomId,
        data.parent.id,
        draft.trim(),
      );
      if (controller.current?.signal.aborted) return;
      setData((current) => ({
        ...current,
        replies: current.replies.some((item) => item.id === reply.id)
          ? current.replies
          : [...current.replies, reply],
        parent: {
          ...current.parent,
          _count: {
            replies:
              reply.parentReplyCount ||
              (current.parent._count?.replies || 0) + 1,
          },
        },
      }));
      setDraft("");
      onTyping(false);
      onParentUpdated({
        ...data.parent,
        _count: {
          replies:
            reply.parentReplyCount || (data.parent._count?.replies || 0) + 1,
        },
      });
      notifyActivity();
      requestAnimationFrame(() => {
        if (scroll.current)
          scroll.current.scrollTop = scroll.current.scrollHeight;
      });
    } catch (cause) {
      if (!controller.current?.signal.aborted) setError(cause.message);
    } finally {
      if (!controller.current?.signal.aborted) setBusy(false);
    }
  }
  async function loadOlder() {
    if (older || !data.pagination.hasMore) return;
    setOlder(true);
    try {
      const page = await getThread(
        await getToken(),
        roomId,
        data.parent.id,
        data.pagination.nextCursor,
        controller.current.signal,
      );
      if (controller.current.signal.aborted) return;
      setData((current) => ({
        ...current,
        replies: [
          ...page.replies,
          ...current.replies.filter(
            (row) => !page.replies.some((item) => item.id === row.id),
          ),
        ],
        pagination: page.pagination,
      }));
    } catch (cause) {
      if (!controller.current.signal.aborted) setError(cause.message);
    } finally {
      if (!controller.current.signal.aborted) setOlder(false);
    }
  }
  function updated(message) {
    setData((current) =>
      current
        ? {
            ...current,
            ...(message.id === current.parent.id
              ? { parent: mergeMessage(current.parent, message) }
              : {
                  replies: current.replies.map((row) =>
                    row.id === message.id ? mergeMessage(row, message) : row,
                  ),
                }),
          }
        : current,
    );
    if (message.id === data?.parent.id) onParentUpdated(message);
  }
  return (
    <Modal title="Thread" className="thread-drawer" onClose={onClose}>
      <div className="thread-scroll" ref={scroll}>
        {!data && !error && (
          <p className="muted" role="status">
            Loading thread…
          </p>
        )}
        {data && (
          <>
            <MessageItem message={data.parent} onUpdated={updated} />
            <div className="thread-divider">
              {data.parent._count?.replies || 0}{" "}
              {(data.parent._count?.replies || 0) === 1 ? "reply" : "replies"}
            </div>
            {data.pagination.hasMore && (
              <button
                type="button"
                className="text-button"
                onClick={loadOlder}
                disabled={older}
              >
                {older ? "Loading…" : "Load earlier replies"}
              </button>
            )}
            {data.replies.map((message) => (
              <MessageItem
                key={message.id}
                message={message}
                onUpdated={updated}
              />
            ))}
          </>
        )}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
      </div>
      {data && !data.parent.deletedAt && (
        <form className="thread-composer" onSubmit={send}>
          <label className="sr-only" htmlFor="thread-reply">
            Reply in thread
          </label>
          <textarea
            id="thread-reply"
            placeholder="Reply in thread…"
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value);
              onTyping(Boolean(event.target.value.trim()));
            }}
            maxLength={4000}
            disabled={busy}
            rows={3}
          />
          <button className="button primary" disabled={busy || !draft.trim()}>
            {busy ? "Sending…" : "Reply"}
            <Icon name="send" size={14} />
          </button>
        </form>
      )}
    </Modal>
  );
}
