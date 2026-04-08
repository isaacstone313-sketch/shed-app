import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import Privacy from './components/Privacy'
import Terms from './components/Terms'

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
  })
}

const path = window.location.pathname
let Root
if (path === '/privacy') Root = Privacy
else if (path === '/terms') Root = Terms
else Root = App

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
