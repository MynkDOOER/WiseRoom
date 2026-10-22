import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { io } from "socket.io-client";
import { API_URL } from "../api/http";
import { RealtimeContext } from "./context";

export default function RealtimeProvider({ children }) {
  const { getToken, userId } = useAuth();
  const [status, setStatus] = useState("connecting");
  const socketRef = useRef(null),
    listeners = useRef(new Set()),
    watching = useRef(null);
  const dispatch = useCallback((event) => {
    for (const listener of listeners.current) listener(event);
  }, []);
  const subscribe = useCallback((listener) => {
    listeners.current.add(listener);
    return () => listeners.current.delete(listener);
  }, []);
  const joinRef = useRef(null);
  const watchRoom = useCallback((roomId) => {
    watching.current = roomId;
    joinRef.current?.(roomId);
    return () => {
      if (watching.current === roomId) {
        watching.current = null;
        if (socketRef.current?.connected)
          socketRef.current.emit("room:unwatch", { roomId });
      }
    };
  }, []);
  const setTyping = useCallback((roomId, typing) => {
    if (socketRef.current?.connected && watching.current === roomId)
      socketRef.current.volatile.emit("typing:set", { roomId, typing });
  }, []);

  useEffect(() => {
    let disposed = false,
      retry,
      refreshing = false,
      reconcileTimer;
    const socket = io(API_URL, {
      autoConnect: false,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      auth: (callback) => {
        getToken({ skipCache: true })
          .then((token) => {
            if (disposed) return;
            callback({ token, active: !document.hidden });
            if (!token) setStatus("authentication-required");
          })
          .catch(() => {
            if (!disposed) callback({ token: null });
          });
      },
    });
    socketRef.current = socket;
    function scheduleRetry() {
      clearTimeout(retry);
      retry = setTimeout(() => {
        if (!disposed && !socket.connected) socket.connect();
      }, 5000);
    }
    function watch(roomId) {
      if (!socket.connected || !roomId) return;
      socket.timeout(10000).emit("room:watch", { roomId }, (error, result) => {
        if (disposed || watching.current !== roomId) return;
        if (!error && result?.ok) dispatch({ type: "sync", roomId });
        else if (result?.code === "ACCESS_DENIED")
          dispatch({ type: "room:removed", roomId });
      });
    }
    joinRef.current = watch;
    async function refreshAuthentication() {
      if (refreshing || disposed || !socket.connected) return;
      refreshing = true;
      try {
        const token = await getToken({ skipCache: true });
        if (disposed || !socket.connected) return;
        if (!token) {
          setStatus("authentication-required");
          socket.disconnect();
          return;
        }
        socket
          .timeout(10000)
          .emit("auth:refresh", { token }, (error, result) => {
            if (!disposed && (error || !result?.ok)) {
              socket.disconnect();
              scheduleRetry();
            }
          });
      } catch {
        if (!disposed) scheduleRetry();
      } finally {
        refreshing = false;
      }
    }
    socket.on("connect", () => {
      clearTimeout(retry);
      setStatus("connected");
      watch(watching.current);
      dispatch({ type: "sync" });
    });
    socket.on("disconnect", (reason) => {
      if (disposed) return;
      setStatus("reconnecting");
      dispatch({ type: "connection:lost" });
      if (reason === "io server disconnect") scheduleRetry();
    });
    socket.on("connect_error", (error) => {
      if (disposed) return;
      setStatus(
        error.data?.code === "AUTH_REQUIRED"
          ? "authentication-required"
          : "reconnecting",
      );
      // Middleware denials do not automatically reconnect; obtain a fresh Clerk token on retry.
      scheduleRetry();
    });
    socket.on("auth:required", refreshAuthentication);
    socket.on("workspace:event", dispatch);
    socket.on("presence:changed", (data) =>
      dispatch({ type: "presence:changed", ...data }),
    );
    function reconcile() {
      if (disposed || document.hidden) return;
      dispatch({ type: "sync" });
      if (!socket.connected) socket.connect();
      else watch(watching.current);
    }
    function visibility() {
      if (socket.connected)
        socket.emit("presence:active", { active: !document.hidden });
      if (!document.hidden) reconcile();
    }
    // A slow API reconciliation also covers a process crash between commit and notification.
    reconcileTimer = setInterval(reconcile, 60000);
    window.addEventListener("online", reconcile);
    window.addEventListener("focus", reconcile);
    document.addEventListener("visibilitychange", visibility);
    socket.connect();
    return () => {
      disposed = true;
      clearTimeout(retry);
      clearInterval(reconcileTimer);
      window.removeEventListener("online", reconcile);
      window.removeEventListener("focus", reconcile);
      document.removeEventListener("visibilitychange", visibility);
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
      joinRef.current = null;
    };
  }, [getToken, userId, dispatch]);

  const value = useMemo(
    () => ({ status, subscribe, watchRoom, setTyping }),
    [status, subscribe, watchRoom, setTyping],
  );
  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
}
