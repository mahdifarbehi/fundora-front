import { Layout, Menu, theme } from "antd";
import { Link, Outlet } from "react-router-dom";
import { useFundId, useCurrentFundScope } from "./fundScope";
import { strings } from "../lib/strings";

const { Sider, Content } = Layout;

// Max width for the content column so pages don't sprawl edge-to-edge on wide monitors.
const CONTENT_MAX = 1160;

// The frame for a single fund's sections: a real full-height nav panel pinned to the right edge
// (RTL start side) + the active section via <Outlet/>. The sider is a solid panel with a divider
// so it reads as navigation; the content column is padded and width-capped.
export default function FundLayout() {
  const fundId = useFundId();
  const { subPath } = useCurrentFundScope();
  const selected = subPath.split("/")[0] || "overview";
  const { token } = theme.useToken();

  const items = [
    { key: "overview", label: <Link to={`/funds/${fundId}`}>{strings.fundNav.overview}</Link> },
    { key: "members", label: <Link to={`/funds/${fundId}/members`}>{strings.fundNav.members}</Link> },
    { key: "loans", label: <Link to={`/funds/${fundId}/loans`}>{strings.fundNav.loans}</Link> },
    { key: "bank", label: <Link to={`/funds/${fundId}/bank`}>{strings.fundNav.bank}</Link> },
    { key: "reports", label: <Link to={`/funds/${fundId}/reports`}>{strings.fundNav.reports}</Link> },
  ];

  return (
    // Fill the viewport below the ~64px app header so the sider is full-height even on short pages.
    <Layout style={{ minHeight: "calc(100vh - 64px)" }}>
      <Sider
        theme="light"
        width={200}
        style={{
          background: token.colorBgContainer,
          borderInlineEnd: `1px solid ${token.colorSplit}`,
        }}
      >
        <Menu
          mode="vertical"
          selectedKeys={[selected]}
          items={items}
          style={{ borderInlineEnd: "none", background: "transparent", paddingTop: 8 }}
        />
      </Sider>
      <Content style={{ padding: 24, minWidth: 0 }}>
        <div style={{ maxWidth: CONTENT_MAX, marginInline: "auto", width: "100%" }}>
          <Outlet />
        </div>
      </Content>
    </Layout>
  );
}
