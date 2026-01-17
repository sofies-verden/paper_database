import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import ReactGA from 'react-ga4'
import './index.css'
import App from './App'

// Initialize Google Analytics 4
const gaMeasurementId = import.meta.env.VITE_GA_MEASUREMENT_ID

if (gaMeasurementId) {
  ReactGA.initialize(gaMeasurementId)
  // Send initial pageview
  ReactGA.send({ hitType: 'pageview', page: window.location.pathname })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
