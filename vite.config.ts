import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Dev-server proxy: the browser only ever talks to the Vite origin, and Vite
// forwards every /api/* call to the Django backend. This keeps dev same-origin
// so the httpOnly refresh cookie works without CORS (ADR 0002).
// Point BACKEND at wherever the fundora backend runs locally.
const BACKEND = process.env.FUNDORA_API ?? "http://localhost:8000";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: BACKEND,
        changeOrigin: true,
      },
    },
  },
});
