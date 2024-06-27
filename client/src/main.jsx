import React from "react";
import ReactDOM from "react-dom/client";

// import { Toaster } from "@/components/ui/toaster";
import "./index.css";
import store from "./redux/store";
import { Provider } from "react-redux";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
    {/* <Toaster /> */}
  </React.StrictMode>
);
