import { useAuth } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const { isSignedIn, isLoaded } = useAuth();
  if (!isLoaded) return <div className="app-loading" role="status"><img src="/favicon.svg" width="52" height="52" alt=""/><p>Opening WiseRoom…</p></div>;
  if (!isSignedIn) return <Navigate to="/sign-in" replace />;
  return children;
}
