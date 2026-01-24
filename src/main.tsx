import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// Import radiants theme CSS
import "@rdna/radiants";
import "@rdna/radiants/tokens";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
