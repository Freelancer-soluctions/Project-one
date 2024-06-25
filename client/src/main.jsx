import React from "react";
import ReactDOM from "react-dom/client";

import { Toaster } from "@/components/ui/toaster";
import "./index.css";
import store from "./store/store";
import { Provider } from "react-redux";
// import { TanStackProvider } from '@/plugins/TanStackProvider.tsx';

import App from "./App";
import { TanStackProvider } from "./plugins/TanStackProvider";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <TanStackProvider>
      <Provider store={store}>
        <App />
      </Provider>
      <Toaster />
    </TanStackProvider>
  </React.StrictMode>
);
