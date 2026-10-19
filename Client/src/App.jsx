import { Navigate, Route, Routes } from "react-router-dom";
import SignInPage from "./Pages/SignInPage";
import SignUpPage from "./Pages/SignUpPage";
import HomePage from "./Pages/HomePage";
import RoomPage from "./Pages/RoomPage";
import ProtectedRoute from "./ProtectedRoutes/AuthRoutes";
import { useAuth } from "@clerk/clerk-react";
import WorkspaceProvider from "./components/WorkspaceProvider";
import WorkspaceLayout from "./components/WorkspaceLayout";

function Workspace() {
  const { userId } = useAuth();
  return <WorkspaceProvider key={userId}><WorkspaceLayout/></WorkspaceProvider>;
}

const App = () => {
  return (
    <Routes>
      <Route path="/sign-in/*" element={<SignInPage />} />
      <Route path="/sign-up/*" element={<SignUpPage />} />
      <Route element={<ProtectedRoute><Workspace/></ProtectedRoute>}>
        <Route path="/" element={<HomePage/>}/>
        <Route path="/rooms/:roomId" element={<RoomPage/>}/>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
