import { useState } from "react";
import { Button, Flex, Layout, Space, Typography } from "antd";
import { LogoutOutlined } from "@ant-design/icons";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import FundSwitcher from "../funds/FundSwitcher";
import { strings } from "../lib/strings";

const { Header, Content } = Layout;
const { Text } = Typography;

// The frame every protected screen renders inside: a header with the app name, the signed-in
// user, and a logout button; a content area where routed screens mount via <Outlet/>.
export default function AppShell() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  const onLogout = async () => {
    setLoggingOut(true);
    try {
      await signOut();
      navigate("/login", { replace: true });
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header>
        <Flex align="center" justify="space-between" style={{ height: "100%" }}>
          <Space size="middle">
            <Link to="/">
              <Text strong style={{ color: "#fff", fontSize: 18 }}>
                {strings.appName}
              </Text>
            </Link>
            <FundSwitcher />
          </Space>
          <Space size="middle">
            {user && <Text style={{ color: "rgba(255,255,255,0.85)" }}>{user.full_name || user.phone}</Text>}
            <Button
              type="text"
              icon={<LogoutOutlined />}
              onClick={onLogout}
              loading={loggingOut}
              style={{ color: "#fff" }}
            >
              {strings.auth.logout}
            </Button>
          </Space>
        </Flex>
      </Header>
      <Content style={{ padding: 24 }}>
        <Outlet />
      </Content>
    </Layout>
  );
}
