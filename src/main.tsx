import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Global CSS first so experience token sheets (pulled in by the engine) cascade after it.
import './index.css'
import { App } from '@/app/App'

const root = document.getElementById('root')
if (!root) throw new Error('Root element #root not found')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
