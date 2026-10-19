import { createContext, useContext } from "react";
export const WorkspaceContext = createContext(null);
export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error("Workspace components need WorkspaceProvider.");
  return context;
}
