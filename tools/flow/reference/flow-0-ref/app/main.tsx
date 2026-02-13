import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// Import app styles (includes radiants theme)
import "./index.css";

// Flow is dark-mode only - add dark class to enable radiants dark component styles
document.documentElement.classList.add("dark");

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
