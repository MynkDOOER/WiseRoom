import { useAuth } from "@clerk/clerk-react";
import { Navigate, useLocation } from "react-router-dom";
import { safeReturnPath } from "../utils/authReturn";

export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const { isSignedIn, isLoaded } = useAuth();
  if (!isLoaded) return <div className="app-loading" role="status"><img src="/favicon.svg" width="52" height="52" alt=""/><p>Opening WiseRoom…</p></div>;
  if (!isSignedIn) return <Navigate to={`/sign-in?returnTo=${encodeURIComponent(safeReturnPath(location.pathname))}`} replace />;
  return children;
}
