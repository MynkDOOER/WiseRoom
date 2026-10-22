import { createContext, useContext } from "react";
export const RealtimeContext = createContext(null);
export function useRealtime() {
  const value = useContext(RealtimeContext);
  if (!value) throw new Error("RealtimeProvider is required.");
  return value;
}
