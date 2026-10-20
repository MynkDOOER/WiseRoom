import { Navigate, Route, Routes } from "react-router-dom";
import LandingPage from "./Pages/LandingPage";
import SignInPage from "./Pages/SignInPage";
import SignUpPage from "./Pages/SignUpPage";
import ActivityPage from "./Pages/ActivityPage";
import HomePage from "./Pages/HomePage";
import RoomPage from "./Pages/RoomPage";
import ProtectedRoute from "./ProtectedRoutes/AuthRoutes";
import { useAuth } from "@clerk/clerk-react";
import WorkspaceProvider from "./components/WorkspaceProvider";
import WorkspaceLayout from "./components/WorkspaceLayout";
import UIKitPage from "./Pages/UIKitPage";
import JoinRoomPage from "./Pages/JoinRoomPage";

function Workspace() {
  const { userId } = useAuth();
  return (
    <WorkspaceProvider key={userId}>
      <WorkspaceLayout />
    </WorkspaceProvider>
  );
}

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      {import.meta.env.DEV && <Route path="/ui-kit" element={<UIKitPage />} />}
      <Route path="/sign-in/*" element={<SignInPage />} />
      <Route path="/sign-up/*" element={<SignUpPage />} />
      <Route
        element={
          <ProtectedRoute>
            <Workspace />
          </ProtectedRoute>
        }
      >
        <Route path="/workspace" element={<HomePage />} />
        <Route
          path="/inbox"
          element={<ActivityPage key="inbox" kind="inbox" />}
        />
        <Route
          path="/threads"
          element={<ActivityPage key="threads" kind="threads" />}
        />
        <Route
          path="/saved"
          element={<ActivityPage key="saved" kind="saved" />}
        />
        <Route path="/rooms/:roomId" element={<RoomPage />} />
        <Route path="/join/:code" element={<JoinRoomPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
