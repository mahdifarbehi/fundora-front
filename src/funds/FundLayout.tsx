import { Flex, Menu } from "antd";
import { Link, Outlet } from "react-router-dom";
import { useFundId, useCurrentFundScope } from "./fundScope";
import { strings } from "../lib/strings";

// The frame for a single fund's sections. The fund id is in the URL (ADR 0006); this adds a
// horizontal nav (overview / members / … ) and renders the active section via <Outlet/>.
// New sections (loans, wallet, bank) become more menu items + child routes in later phases.
export default function FundLayout() {
  const fundId = useFundId();
  const { subPath } = useCurrentFundScope();
  const selected = subPath.split("/")[0] || "overview";

  const items = [
    { key: "overview", label: <Link to={`/funds/${fundId}`}>{strings.fundNav.overview}</Link> },
    { key: "members", label: <Link to={`/funds/${fundId}/members`}>{strings.fundNav.members}</Link> },
  ];

  return (
    <Flex vertical gap="large">
      <Menu mode="horizontal" selectedKeys={[selected]} items={items} />
      <Outlet />
    </Flex>
  );
}
