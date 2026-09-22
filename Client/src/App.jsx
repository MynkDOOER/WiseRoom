import { Route, Routes } from "react-router-dom";
import SignInPage from "./Pages/SignInPage";
import SignUpPage from "./Pages/SignUpPage";

const App = () => {
  return (
    <>
    <Routes>
       <Route path="/sign-in/*" element={<SignInPage />} />
       <Route path="/sign-up/*" element={<SignUpPage />} />
   </Routes>
    </>
  )
}

export default App;