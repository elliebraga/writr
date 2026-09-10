import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { DialogProvider } from './components/ui/DialogProvider.tsx'
import { initCustomFonts } from './services/fontService.ts'

// Pré-carrega fontes salvas do Google Fonts
initCustomFonts();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DialogProvider>
      <App />
    </DialogProvider>
  </StrictMode>,
)
