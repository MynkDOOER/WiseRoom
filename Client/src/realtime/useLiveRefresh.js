import { useEffect, useRef } from "react";
import { useRealtime } from "./context";

// Coalesce bursts of notifications and use the current callback without resubscribing.
export default function useLiveRefresh(callback, { roomId, types = "" } = {}) {
  const { subscribe } = useRealtime();
  const latest = useRef(callback);
  useEffect(() => {
    latest.current = callback;
  }, [callback]);
  useEffect(() => {
    let timer;
    const selected = types.split(" ").filter(Boolean);
    const stop = subscribe((event) => {
      if (
        event.type !== "sync" &&
        selected.length &&
        !selected.includes(event.type)
      )
        return;
      if (roomId && event.roomId && event.roomId !== roomId) return;
      clearTimeout(timer);
      if (["room:removed", "room:deleted"].includes(event.type)) {
        latest.current(event);
        return;
      }
      timer = setTimeout(() => latest.current(event), 80);
    });
    return () => {
      stop();
      clearTimeout(timer);
    };
  }, [subscribe, roomId, types]);
}
