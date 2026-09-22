import { useAuth } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const { isSignedIn, isLoaded } = useAuth();
  if (!isLoaded) return null; // or a loading spinner
  if (!isSignedIn) return <Navigate to="/sign-in" replace />;
  return children;
}