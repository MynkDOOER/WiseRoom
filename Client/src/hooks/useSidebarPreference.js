import { useEffect, useRef, useState } from "react";
const STORAGE_KEY = "wiseroom.sidebar.v1";
const clamp = (width) => Math.max(200, Math.min(320, width));
function readPreference() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return {
      width: Number.isFinite(saved?.width) ? clamp(saved.width) : 260,
      collapsed: saved?.collapsed === true,
    };
  } catch {
    return { width: 260, collapsed: false };
  }
}
export default function useSidebarPreference() {
  const [preference, setPreference] = useState(readPreference);
  const [resizing, setResizing] = useState(false);
  const drag = useRef(null);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preference));
    } catch {
      /* Storage is optional. */
    }
  }, [preference]);
  function startResize(event) {
    if (event.button !== 0) return;
    drag.current = { x: event.clientX, width: preference.width };
    event.currentTarget.setPointerCapture(event.pointerId);
    setResizing(true);
  }
  function moveResize(event) {
    if (!drag.current) return;
    const width = clamp(drag.current.width + event.clientX - drag.current.x);
    setPreference((current) => ({ ...current, width }));
  }
  function finishResize() {
    drag.current = null;
    setResizing(false);
  }
  function keyboardResize(event) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    setPreference((current) => ({
      ...current,
      width:
        event.key === "Home"
          ? 200
          : event.key === "End"
            ? 320
            : clamp(current.width + (event.key === "ArrowRight" ? 10 : -10)),
    }));
  }
  return {
    ...preference,
    resizing,
    startResize,
    moveResize,
    finishResize,
    keyboardResize,
    toggleCollapsed: () =>
      setPreference((current) => ({
        ...current,
        collapsed: !current.collapsed,
      })),
    resetWidth: () => setPreference((current) => ({ ...current, width: 260 })),
  };
}
