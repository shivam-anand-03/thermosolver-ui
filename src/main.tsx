import 'katex/dist/katex.min.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { warmUpApi } from './lib/api'
import './index.css'

// wake a sleeping (free-tier) API before the user's first request
warmUpApi()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
