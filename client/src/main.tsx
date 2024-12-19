import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// import { Toaster } from "@/components/ui/toaster";
import './index.css'
import store from './redux/store'
import { Provider } from 'react-redux'
import { BrowserRouter } from "react-router";
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
    {/* <Toaster /> */}
  </StrictMode>
)
