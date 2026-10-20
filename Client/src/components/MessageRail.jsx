import { useEffect, useId, useRef, useState } from "react";
import Icon from "./Icon";

const clamp = (value) => Math.max(0, Math.min(1, value));
function snippet(message) {
  if (message.voiceMime) return "Voice message";
  return (
    message.body
      .replace(/```[\s\S]*?```/g, "[Code note]")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 180) || "Message"
  );
}

export default function MessageRail({ messages, scrollRef, historyId }) {
  const previewId = useId();
  const positions = useRef([]);
  const dragging = useRef(false);
  const [view, setView] = useState({
    progress: 1,
    active: messages.length - 1,
    stops: [],
  });
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    const scroll = scrollRef.current;
    if (!scroll) return;
    let frame = 0;
    function measure() {
      const top = scroll.getBoundingClientRect().top;
      const rows = [...scroll.querySelectorAll("[data-message-id]")];
      positions.current = rows.map(
        (row) => row.getBoundingClientRect().top - top + scroll.scrollTop,
      );
      const max = Math.max(0, scroll.scrollHeight - scroll.clientHeight);
      const progress = max ? clamp(scroll.scrollTop / max) : 1;
      const target = scroll.scrollTop + scroll.clientHeight * 0.3;
      let active = 0;
      positions.current.forEach((position, index) => {
        if (position <= target) active = index;
      });
      if (progress >= 0.995) active = messages.length - 1;
      const step = Math.max(1, Math.ceil(messages.length / 70));
      const stops = positions.current.flatMap((position, index) =>
        index % step === 0 || index === messages.length - 1
          ? [
              {
                index,
                position: max
                  ? clamp((position - scroll.clientHeight * 0.3) / max)
                  : 1,
              },
            ]
          : [],
      );
      setView({ progress, active, stops });
    }
    function schedule() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    }
    scroll.addEventListener("scroll", schedule, { passive: true });
    const resize = new ResizeObserver(schedule);
    resize.observe(scroll);
    const list = scroll.querySelector(".message-list");
    if (list) resize.observe(list);
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      scroll.removeEventListener("scroll", schedule);
    };
  }, [messages, scrollRef]);

  function locate(fraction) {
    const scroll = scrollRef.current;
    const target =
      fraction * Math.max(0, scroll.scrollHeight - scroll.clientHeight) +
      scroll.clientHeight * 0.3;
    let closest = 0;
    positions.current.forEach((position, index) => {
      if (
        Math.abs(position - target) <
        Math.abs((positions.current[closest] || 0) - target)
      )
        closest = index;
    });
    return closest;
  }
  function point(event, scrollTo = false) {
    const rect = event.currentTarget.getBoundingClientRect();
    const fraction = clamp((event.clientY - rect.top) / rect.height);
    setPreview({ index: locate(fraction), fraction });
    if (scrollTo) {
      const element = scrollRef.current;
      element.scrollTop =
        fraction * Math.max(0, element.scrollHeight - element.clientHeight);
    }
  }
  function key(event) {
    const scroll = scrollRef.current;
    let index = preview?.index ?? view.active;
    if (event.key === "ArrowUp") index--;
    else if (event.key === "ArrowDown") index++;
    else if (event.key === "Home") index = 0;
    else if (event.key === "End") index = messages.length - 1;
    else if (event.key === "PageUp" || event.key === "PageDown") {
      event.preventDefault();
      scroll.scrollBy({
        top: scroll.clientHeight * 0.8 * (event.key === "PageUp" ? -1 : 1),
      });
      return;
    } else return;
    event.preventDefault();
    index = Math.max(0, Math.min(messages.length - 1, index));
    scroll.scrollTop =
      index === messages.length - 1
        ? scroll.scrollHeight
        : Math.max(
            0,
            (positions.current[index] || 0) - scroll.clientHeight * 0.3,
          );
    setPreview({
      index,
      fraction: messages.length > 1 ? index / (messages.length - 1) : 1,
    });
  }
  if (messages.length < 2) return null;
  const message = preview ? messages[preview.index] : null;
  return (
    <div className="message-rail-wrap">
      <div
        className="message-rail"
        role="scrollbar"
        tabIndex={0}
        aria-label="Message timeline. Drag to scroll; use arrow keys to move between loaded messages."
        aria-controls={historyId}
        aria-orientation="vertical"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(view.progress * 100)}
        aria-valuetext={`Message ${view.active + 1} of ${messages.length} loaded messages`}
        aria-describedby={message ? previewId : undefined}
        onPointerDown={(event) => {
          event.preventDefault();
          event.currentTarget.focus();
          dragging.current = true;
          event.currentTarget.setPointerCapture(event.pointerId);
          point(event, true);
        }}
        onPointerMove={(event) => point(event, dragging.current)}
        onPointerUp={(event) => {
          dragging.current = false;
          event.currentTarget.releasePointerCapture(event.pointerId);
        }}
        onPointerCancel={() => {
          dragging.current = false;
          setPreview(null);
        }}
        onPointerLeave={() => {
          if (!dragging.current) setPreview(null);
        }}
        onFocus={() =>
          setPreview({ index: view.active, fraction: view.progress })
        }
        onBlur={() => setPreview(null)}
        onKeyDown={key}
      >
        <div className="message-rail-ruler" aria-hidden="true" />
        {view.stops.map((stop) => (
          <span
            key={stop.index}
            aria-hidden="true"
            className={`message-rail-stop ${messages[stop.index]?.saved || messages[stop.index]?.savedBy?.length ? "is-saved" : ""}`}
            style={{ top: `${stop.position * 100}%` }}
          />
        ))}
        <span
          className="message-rail-current"
          aria-hidden="true"
          style={{ top: `${view.progress * 100}%` }}
        />
      </div>
      {message && (
        <div
          className="message-rail-preview"
          id={previewId}
          role="tooltip"
          style={{ "--preview-position": `${preview.fraction * 100}%` }}
        >
          <div>
            <strong>{message.author.displayName || "Member"}</strong>
            {Boolean(message.saved || message.savedBy?.length) && (
              <Icon name="bookmark" size={13} />
            )}
          </div>
          <p>{snippet(message)}</p>
          <span>
            {new Date(message.createdAt).toLocaleString([], {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </span>
        </div>
      )}
    </div>
  );
}
