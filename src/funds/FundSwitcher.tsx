import { Select } from "antd";
import { useNavigate } from "react-router-dom";
import { useFunds } from "./hooks";
import { useCurrentFundScope } from "./fundScope";
import { strings } from "../lib/strings";

// Switching funds is just navigation to the same screen under a different :fundId (ADR 0006).
// It reads the active fund from the URL (not state) and preserves the sub-path so you stay on
// the same section (overview/members/…) when you switch.
export default function FundSwitcher() {
  const navigate = useNavigate();
  const { fundId, subPath } = useCurrentFundScope();
  const { data } = useFunds();

  const funds = data?.results ?? [];
  if (funds.length === 0) return null;

  return (
    <Select
      value={fundId}
      placeholder={strings.funds.switcherPlaceholder}
      style={{ minWidth: 200 }}
      options={funds.map((f) => ({ value: String(f.id), label: f.name }))}
      onChange={(id) => navigate(`/funds/${id}${subPath ? `/${subPath}` : ""}`)}
    />
  );
}
