import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useRealtime } from "../realtime/context";
export default function useRoomPresence(roomId, enabled) {
  const { userId } = useAuth();
  const { subscribe, watchRoom, setTyping, status } = useRealtime();
  const [presence, setPresence] = useState({
    roomId: null,
    online: [],
    typing: [],
  });
  const lastSent = useRef(0),
    stopTimer = useRef(null);
  useEffect(() => {
    if (!enabled) return;
    const stop = subscribe((event) => {
      if (event.type === "presence:changed" && event.roomId === roomId)
        setPresence({
          roomId,
          online: event.online,
          typing: event.typing.filter((id) => id !== userId),
        });
      if (
        event.type === "connection:lost" ||
        (["room:removed", "room:deleted"].includes(event.type) &&
          event.roomId === roomId)
      )
        setPresence({ roomId: null, online: [], typing: [] });
    });
    const leave = watchRoom(roomId);
    return () => {
      clearTimeout(stopTimer.current);
      setTyping(roomId, false);
      leave();
      stop();
    };
  }, [enabled, roomId, subscribe, watchRoom, setTyping, userId]);
  const onTyping = useCallback(
    (value) => {
      clearTimeout(stopTimer.current);
      if (!value || Date.now() - lastSent.current > 900) {
        lastSent.current = Date.now();
        setTyping(roomId, Boolean(value));
      }
      if (value)
        stopTimer.current = setTimeout(() => setTyping(roomId, false), 2200);
    },
    [roomId, setTyping],
  );
  const current =
    enabled && status === "connected" && presence.roomId === roomId
      ? presence
      : { online: [], typing: [] };
  return { ...current, onTyping };
}
