import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// One place to notice an expired or revoked session. Every page fetches directly,
// so wrapping fetch here saves threading an error handler through all of them:
// any 401 tells AuthProvider to drop back to the login screen.
const originalFetch = window.fetch.bind(window)
window.fetch = async (...args) => {
  const response = await originalFetch(...args)
  const url = String(args[0] instanceof Request ? args[0].url : args[0])
  // A failed login is a 401 too, but it is the login form's to report, not a session loss.
  if (response.status === 401 && !url.includes('/api/auth/login')) {
    window.dispatchEvent(new Event('cb:unauthorized'))
  }
  return response
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
