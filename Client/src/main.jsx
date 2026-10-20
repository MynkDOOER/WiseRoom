import { createRoot } from "react-dom/client";
import "./index.css";
import "./styles/composer.css";
import "./styles/reference.css";
import App from "./App.jsx";
import { ClerkProvider } from "@clerk/clerk-react";
import { BrowserRouter } from "react-router-dom";

createRoot(document.getElementById("root")).render(
  <ClerkProvider
    publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}
    appearance={{
      variables: {
        colorPrimary: "#AD46F5",
        colorBackground: "#15121A",
        colorText: "#E8E3ED",
        colorTextSecondary: "#8B8497",
        colorInputBackground: "#15121A",
        colorInputText: "#E8E3ED",
        colorNeutral: "#E8E3ED",
        colorDanger: "#FF9AA8",
        fontFamily: '"DM Sans", sans-serif',
        borderRadius: "0.375rem",
      },
      elements: {
        card: "clerk-card",
        socialButtonsBlockButton: "clerk-social-button",
        footer: "clerk-footer",
      },
    }}
  >
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </ClerkProvider>,
);
