// Adapted for WiseRoom from React Bits VoicePill (reactbits.dev/micro/voice-pill).
// Uses the supplied tap/hold/slide interaction with a shared real recording stream.
import { useRef } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import Mic01Icon from "@hugeicons/core-free-icons/Mic01Icon";

export default function VoicePill({ recorder, disabled }) {
  const press = useRef(null);
  const active = ["requesting", "recording"].includes(recorder.status);
  const seconds = Math.floor(recorder.elapsed / 1000);
  const toggle = () => (active ? recorder.stop() : recorder.start());
  return (
    <div className={`voice-pill ${active ? "is-recording" : ""}`}>
      {active && (
        <>
          <span className="voice-wave" aria-hidden="true">
            {recorder.bars.map((height, i) => (
              <i key={i} style={{ height }} />
            ))}
          </span>
          <time>
            {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}
          </time>
        </>
      )}
      <button
        type="button"
        className="voice-pill-button"
        disabled={disabled || recorder.status === "stopping"}
        aria-pressed={active}
        aria-label={active ? "Stop recording" : "Record voice message"}
        title="Tap to record; tap again to stop. Hold to record; slide left to cancel."
        onPointerDown={(e) => {
          if (e.button !== 0 || !e.isPrimary) return;
          press.current = {
            id: e.pointerId,
            x: e.clientX,
            start: performance.now(),
            wasActive: active,
          };
          e.currentTarget.setPointerCapture(e.pointerId);
          if (!active) recorder.start();
        }}
        onPointerMove={(e) => {
          const p = press.current;
          if (p?.id === e.pointerId && e.clientX < p.x - 64) {
            recorder.stop(true);
            press.current = null;
          }
        }}
        onPointerUp={(e) => {
          const p = press.current;
          press.current = null;
          if (
            p?.id === e.pointerId &&
            (p.wasActive || performance.now() - p.start >= 300)
          )
            recorder.stop();
        }}
        onPointerCancel={() => {
          press.current = null;
          recorder.stop(true);
        }}
        onClick={(e) => {
          if (e.detail === 0) toggle();
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            recorder.stop(true);
          }
        }}
      >
        {active ? (
          <span className="voice-stop" />
        ) : (
          <HugeiconsIcon icon={Mic01Icon} size={19} strokeWidth={2} />
        )}
      </button>
    </div>
  );
}
