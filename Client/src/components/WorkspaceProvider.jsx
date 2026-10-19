import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { syncUser } from "../api/users";
import { listRooms } from "../api/rooms";
import { WorkspaceContext } from "../context/workspaceContext";
export default function WorkspaceProvider({ children }) {
  const { getToken, userId } = useAuth();
  const [result, setResult] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const [roomDialog, setRoomDialog] = useState(null);
  const refreshRooms = useCallback(() => setAttempt(value => value + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    async function prepare() {
      try {
        const token = await getToken();
        if (controller.signal.aborted) return;
        if (!token) throw new Error("Your session expired. Please sign in again.");
        const account = await syncUser(token, controller.signal);
        const rooms = await listRooms(token, controller.signal);
        if (!controller.signal.aborted) setResult({ userId, account, rooms });
      } catch (error) {
        if (!controller.signal.aborted) setResult(previous => ({
          ...(previous?.userId === userId ? previous : {}), userId,
          error: error instanceof TypeError ? "Cannot reach the server. Please try again." : error.message,
        }));
      }
    }
    prepare();
    return () => controller.abort();
  }, [getToken, userId, attempt]);
  const current = result?.userId === userId ? result : null;
  return <WorkspaceContext.Provider value={{
    account: current?.account, rooms: current?.rooms || [], loading: !current,
    error: current?.error, refreshRooms, roomDialog, setRoomDialog,
  }}>{children}</WorkspaceContext.Provider>;
}
