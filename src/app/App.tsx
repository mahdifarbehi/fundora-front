import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "../auth/LoginPage";
import RegisterPage from "../auth/RegisterPage";
import RequireAuth from "./RequireAuth";
import AppShell from "./AppShell";
import HomePage from "./HomePage";

// Route map (ADR 0006): /login is public; everything else is protected and rendered inside
// the app shell. Fund-scoped routes (/funds/:fundId/...) get added under here in later phases.
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<HomePage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
