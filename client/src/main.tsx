import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// import { Toaster } from "@/components/ui/toaster";

import './index.css'
import store from './redux/store'
import { Provider } from 'react-redux'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
    {/* <Toaster /> */}
  </StrictMode>
)
