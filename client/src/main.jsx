import React from 'react'
import ReactDOM from 'react-dom/client'

// import { Toaster } from "@/components/ui/toaster";
import './index.css'
import { BrowserRouter } from 'react-router'
import store from './redux/store'
import { Provider } from 'react-redux'
import App from './App'
import InternalServerError from '@/components/500/InternalServerError'
import { ErrorBoundary } from 'react-error-boundary'
import '@/config/i18n'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary
      FallbackComponent={InternalServerError}
      onReset={() => {
        location.href = '/home'
        // Realiza alguna acción para reiniciar el estado de la aplicación
      }}>
      <Provider store={store}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </Provider>
    </ErrorBoundary>

    {/* <Toaster /> */}
  </React.StrictMode>
)
