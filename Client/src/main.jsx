import { createRoot } from "react-dom/client";
import "./index.css";
import "./styles/composer.css";
import App from "./App.jsx";
import { ClerkProvider } from "@clerk/clerk-react";
import { BrowserRouter } from "react-router-dom";

createRoot(document.getElementById("root")).render(
  <ClerkProvider
    publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}
    appearance={{
      variables: {
        colorPrimary: "#9303C5",
        colorBackground: "#141020",
        colorText: "#F7F5FF",
        colorTextSecondary: "#B6AEC6",
        colorInputBackground: "#141020",
        colorInputText: "#F7F5FF",
        colorNeutral: "#F7F5FF",
        colorDanger: "#FF9AA8",
        fontFamily: '"JetBrains Mono", monospace',
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
