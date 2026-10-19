import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ClerkProvider } from '@clerk/clerk-react'
import { BrowserRouter } from 'react-router-dom'

createRoot(document.getElementById('root')).render(
  <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY} appearance={{
    variables: {
      colorPrimary: '#315E83', colorBackground: '#FFFFFF', colorText: '#1C3043',
      colorTextSecondary: '#586B7D', colorInputBackground: '#F5F9FD', colorInputText: '#1C3043',
      colorNeutral: '#1C3043', colorDanger: '#B43D39', fontFamily: '"DM Sans", sans-serif', borderRadius: '0.625rem',
    },
    elements: { card: 'clerk-card', socialButtonsBlockButton: 'clerk-social-button', footer: 'clerk-footer' },
  }}>
      <BrowserRouter>
      <App />
   </BrowserRouter>
    </ClerkProvider>
)
