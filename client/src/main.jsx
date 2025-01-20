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
import { I18nextProvider } from 'react-i18next'
import i18n from '@/config/i18n'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary
      FallbackComponent={InternalServerError}
      onReset={() => {
        location.href = '/home'
        // Realiza alguna acción para reiniciar el estado de la aplicación
      }}>
      <Provider store={store}>
        <I18nextProvider i18n={i18n}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </I18nextProvider>
      </Provider>
    </ErrorBoundary>

    {/* <Toaster /> */}
  </React.StrictMode>
)
