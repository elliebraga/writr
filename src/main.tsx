import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { DialogProvider } from './components/ui/DialogProvider.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DialogProvider>
      <App />
    </DialogProvider>
  </StrictMode>,
)
