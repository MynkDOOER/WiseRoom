import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { updatePresence } from "../api/collaboration";
export default function useRoomPresence(roomId, enabled) {
  const { getToken } = useAuth();
  const [presence, setPresence] = useState({ online: [], typing: [] });
  const lastType = useRef(0),
    lastSent = useRef(0),
    stopTimer = useRef(null),
    send = useRef(null);
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    let pending = false;
    const ping = async (
      active = !document.hidden,
      typing = active && Date.now() - lastType.current < 2500,
    ) => {
      if (pending || controller.signal.aborted) return;
      pending = true;
      try {
        const token = await getToken();
        if (controller.signal.aborted) return;
        const data = await updatePresence(
          token,
          roomId,
          { active, typing },
          controller.signal,
        );
        if (!controller.signal.aborted)
          setPresence({ online: data.online, typing: data.typing });
      } catch {
        /* Presence is optional; chat error/retry remains independent. */
      } finally {
        pending = false;
      }
    };
    send.current = ping;
    ping();
    const tick = setInterval(() => {
      if (!document.hidden) ping();
    }, 4000);
    const visibility = () => ping(!document.hidden, false);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      controller.abort();
      clearInterval(tick);
      clearTimeout(stopTimer.current);
      send.current = null;
      document.removeEventListener("visibilitychange", visibility);
      getToken()
        .then((token) => {
          if (token)
            return updatePresence(token, roomId, {
              active: false,
              typing: false,
            });
        })
        .catch(() => {});
    };
  }, [getToken, roomId, enabled]);
  const typing = useCallback((value) => {
    lastType.current = value ? Date.now() : 0;
    clearTimeout(stopTimer.current);
    if (Date.now() - lastSent.current > 1500 || !value) {
      lastSent.current = Date.now();
      send.current?.(true, Boolean(value));
    }
    stopTimer.current = setTimeout(() => {
      lastType.current = 0;
      send.current?.(true, false);
    }, 2200);
  }, []);
  return { ...presence, onTyping: typing };
}
