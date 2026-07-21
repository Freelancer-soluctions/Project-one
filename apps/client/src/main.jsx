import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { store, persistor } from './redux/store';
import { Provider } from 'react-redux';
import App from './App';
import InternalServerError from '@/components/500/InternalServerError';
import { ErrorBoundary } from 'react-error-boundary';
import i18n from './config/i18n';
import { PersistGate } from 'redux-persist/integration/react';
import { I18nextProvider } from 'react-i18next';
import { Spinner } from './components/loader/Spinner';
import { BrowserRouter } from 'react-router';
import { MentionCountProvider } from '@/hooks';
// Import the Zod error map configuration
import './config/zod-i18n';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary
      FallbackComponent={InternalServerError}
      onReset={() => {
        location.href = '/home';
        // Realiza alguna acción para reiniciar el estado de la aplicación
      }}
    >
      <Provider store={store}>
        <PersistGate loading={<Spinner />} persistor={persistor}>
          <I18nextProvider i18n={i18n}>
            <BrowserRouter>
              <MentionCountProvider>
                <App />
              </MentionCountProvider>
            </BrowserRouter>
          </I18nextProvider>
        </PersistGate>
      </Provider>
    </ErrorBoundary>
  </React.StrictMode>
);
