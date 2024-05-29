import React from 'react'
import ReactDOM from 'react-dom/client'

import { Toaster } from "@/components/ui/toaster"
import './index.css'

// import { TanStackProvider } from '@/plugins/TanStackProvider.tsx';

import App from './App'
import { TanStackProvider } from './plugins/TanStackProvider'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <TanStackProvider>
      <App />
      <Toaster />
    </TanStackProvider>
  </React.StrictMode>,
)
