import { Flex, Spin } from "antd";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { strings } from "../lib/strings";

// Route guard for the protected tree. While the app-load refresh is in flight we show a
// spinner (not the login page) so a valid returning session never flashes /login. Once
// resolved: anon → redirect to /login (remembering where they were headed); authed → render.
export default function RequireAuth() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "loading") {
    return (
      <Flex align="center" justify="center" style={{ minHeight: "100vh" }} vertical gap="middle">
        <Spin size="large" />
        <span>{strings.auth.loadingSession}</span>
      </Flex>
    );
  }

  if (status === "anon") {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
