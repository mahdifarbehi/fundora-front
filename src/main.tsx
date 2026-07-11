import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App as AntApp, ConfigProvider } from "antd";
import faIR from "antd/locale/fa_IR";
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import "antd/dist/reset.css";
// Vazirmatn — self-hosted Persian font (SIL OFL), no CDN. Weights used across the UI.
import "@fontsource/vazirmatn/400.css";
import "@fontsource/vazirmatn/500.css";
import "@fontsource/vazirmatn/700.css";
import App from "./app/App.tsx";
import ErrorBoundary from "./app/ErrorBoundary.tsx";
import { AuthProvider } from "./auth/AuthContext.tsx";
import { queryClient } from "./lib/queryClient.ts";

const FONT_FAMILY =
  "Vazirmatn, -apple-system, BlinkMacSystemFont, 'Segoe UI', Tahoma, sans-serif";

// Direction is set once, here and on <html dir="rtl"> — no runtime switching (ADR 0003).
// The fa_IR locale drives Ant Design's own strings (pagination, pickers, empty states).
// The theme token sets the font for all Ant Design components; index.html sets it on <body>.
// Provider order: RTL/locale → server-state cache → router → auth/session → app routes.
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConfigProvider direction="rtl" locale={faIR} theme={{ token: { fontFamily: FONT_FAMILY } }}>
      {/* Ant's App provides context-aware message/modal/notification (RTL + theme) via
          App.useApp(); it must sit inside ConfigProvider and above the routes. */}
      <AntApp>
        {/* Top-level crash guard: catches render errors anywhere below and shows a Persian
            fallback instead of a blank screen (ErrorBoundary sits under ConfigProvider/AntApp
            so the fallback still gets RTL + theme). */}
        <ErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <BrowserRouter>
              <AuthProvider>
                <App />
              </AuthProvider>
            </BrowserRouter>
          </QueryClientProvider>
        </ErrorBoundary>
      </AntApp>
    </ConfigProvider>
  </StrictMode>,
);
