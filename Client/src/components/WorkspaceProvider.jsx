import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { getUnread } from "../api/collaboration";
import { syncUser } from "../api/users";
import { listRooms } from "../api/rooms";
import { WorkspaceContext } from "../context/workspaceContext";
export default function WorkspaceProvider({ children }) {
  const { getToken, userId } = useAuth();
  const [result, setResult] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const [unread, setUnread] = useState({ total: 0, rooms: [] });
  const [activityAttempt, setActivityAttempt] = useState(0);
  const [roomDialog, setRoomDialog] = useState(null);
  const refreshRooms = useCallback(() => setAttempt((value) => value + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    async function prepare() {
      try {
        const token = await getToken();
        if (controller.signal.aborted) return;
        if (!token)
          throw new Error("Your session expired. Please sign in again.");
        const account = await syncUser(token, controller.signal);
        const rooms = await listRooms(token, controller.signal);
        if (!controller.signal.aborted) setResult({ userId, account, rooms });
      } catch (error) {
        if (!controller.signal.aborted)
          setResult((previous) => ({
            ...(previous?.userId === userId ? previous : {}),
            userId,
            error:
              error instanceof TypeError
                ? "Cannot reach the server. Please try again."
                : error.message,
          }));
      }
    }
    prepare();
    return () => controller.abort();
  }, [getToken, userId, attempt]);
  useEffect(() => {
    const controller = new AbortController(); let pending = false;
    async function load() { if(pending)return; pending=true; try { const token=await getToken(); if(controller.signal.aborted)return; const data=await getUnread(token,controller.signal); if(!controller.signal.aborted)setUnread(data); } catch { /* Activity retries without blocking room navigation. */ } finally {pending=false;} }
    load(); const timer=setInterval(()=>{if(!document.hidden)load();},15000);
    const refresh=()=>setActivityAttempt(value=>value+1);
    window.addEventListener("wiseroom:activity",refresh);
    return()=>{controller.abort();clearInterval(timer);window.removeEventListener("wiseroom:activity",refresh);};
  },[getToken,activityAttempt]);
  const current = result?.userId === userId ? result : null;
  return (
    <WorkspaceContext.Provider
      value={{
        account: current?.account,
        rooms: current?.rooms || [],
        loading: !current,
        error: current?.error,
        refreshRooms,
        unreadTotal: unread.total,
        unreadByRoom: Object.fromEntries(unread.rooms.map(row=>[row.roomId,row.count])),
        roomDialog,
        setRoomDialog,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}
