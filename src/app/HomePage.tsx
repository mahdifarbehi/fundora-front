import { Card, Typography } from "antd";
import { useAuth } from "../auth/AuthContext";
import { strings } from "../lib/strings";

const { Title, Paragraph } = Typography;

// Placeholder landing screen inside the shell. Replaced by the funds list in Phase 3.
export default function HomePage() {
  const { user } = useAuth();
  return (
    <Card>
      <Title level={3}>{strings.home.title}</Title>
      <Paragraph>{strings.auth.welcome(user?.full_name || user?.phone || "")}</Paragraph>
      <Paragraph type="secondary">{strings.home.placeholder}</Paragraph>
    </Card>
  );
}
