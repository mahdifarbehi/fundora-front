import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConfigProvider } from "antd";
import faIR from "antd/locale/fa_IR";
import { BrowserRouter } from "react-router-dom";
import "antd/dist/reset.css";
import App from "./app/App.tsx";
import { AuthProvider } from "./auth/AuthContext.tsx";

// Direction is set once, here and on <html dir="rtl"> — no runtime switching (ADR 0003).
// The fa_IR locale drives Ant Design's own strings (pagination, pickers, empty states).
// Provider order: RTL/locale → router → auth/session state → app routes.
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConfigProvider direction="rtl" locale={faIR}>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </ConfigProvider>
  </StrictMode>,
);
