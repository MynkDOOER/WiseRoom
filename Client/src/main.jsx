import { createRoot } from "react-dom/client";
import "./index.css";
import "./styles/composer.css";
import "./styles/reference.css";
import "./styles/brand.css";
import "./styles/landing.css";
import "./styles/conversation-theme.css";
import "./styles/auth.css";
import "./styles/interior.css";
import App from "./App.jsx";
import { ClerkProvider } from "@clerk/clerk-react";
import { BrowserRouter } from "react-router-dom";

createRoot(document.getElementById("root")).render(
  <ClerkProvider
    publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}
    appearance={{
      variables: {
        colorPrimary: "#FF5A1F",
        colorBackground: "#1A161D",
        colorText: "#F4EDE6",
        colorTextSecondary: "#B9AFA8",
        colorInputBackground: "#1A161D",
        colorInputText: "#F4EDE6",
        colorNeutral: "#F4EDE6",
        colorDanger: "#FF9E89",
        fontFamily: '"Hanken Grotesk", sans-serif',
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
