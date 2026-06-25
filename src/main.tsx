import React from "react";
import ReactDOM from "react-dom/client";
import { Analytics } from "@vercel/analytics/react";
import "@fontsource-variable/unbounded";
import "@fontsource-variable/mona-sans";
import "@fontsource-variable/anybody";
import "@fontsource-variable/hubot-sans";
import "@fontsource/newsreader";
import "@fontsource/instrument-sans";
import "@fontsource-variable/spline-sans-mono";
import "./styles.css";
import App from "./App";
import { installErrorReporter } from "./lib/errorReporter";

installErrorReporter();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
    <Analytics />
  </React.StrictMode>,
);
