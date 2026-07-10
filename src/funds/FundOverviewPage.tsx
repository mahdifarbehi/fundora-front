import { Alert, Button, Descriptions, Flex, Result, Spin, Typography } from "antd";
import { Link } from "react-router-dom";
import { useFundId } from "./fundScope";
import { useFund } from "./hooks";
import { formatNumber, formatToman } from "../lib/money";
import { formatJalaliDate, jalaliDayPossibilities } from "../lib/jalali";
import { ApiError } from "../lib/errors";
import { errorMessage, strings } from "../lib/strings";

const { Title } = Typography;

export default function FundOverviewPage() {
  const fundId = useFundId();
  const { data: fund, isLoading, isError, error } = useFund(fundId);

  if (isLoading) {
    return (
      <Flex align="center" justify="center" style={{ minHeight: 240 }}>
        <Spin size="large" />
      </Flex>
    );
  }

  // Tenant isolation: a fund that isn't yours surfaces as 404 NOT_FOUND (FRONTEND_API §2.3) —
  // show a clean "not found", not an error screen.
  if (isError) {
    const notFound = error instanceof ApiError && error.code === "NOT_FOUND";
    return (
      <Result
        status={notFound ? "404" : "error"}
        title={notFound ? strings.overview.notFound : errorMessage(error instanceof ApiError ? error.code : "UNKNOWN")}
        extra={
          <Link to="/">
            <Button type="primary">{strings.overview.back}</Button>
          </Link>
        }
      />
    );
  }

  if (!fund) return null;

  const dayPossibilities = jalaliDayPossibilities(fund.contribution_day).map(formatNumber).join("، ");

  return (
    <Flex vertical gap="middle">
      <Title level={3} style={{ margin: 0 }}>
        {fund.name}
      </Title>

      <Descriptions bordered column={1} title={strings.overview.title}>
        <Descriptions.Item label={strings.funds.colMonthlyShare}>
          {formatToman(fund.monthly_share_amount)}
        </Descriptions.Item>
        <Descriptions.Item label={strings.funds.colDefaultLoan}>
          {formatToman(fund.default_loan_amount)}
        </Descriptions.Item>
        <Descriptions.Item label={strings.funds.colInstallmentCount}>
          {formatNumber(fund.default_installment_count)}
        </Descriptions.Item>
        <Descriptions.Item label={strings.funds.colContributionDay}>
          {formatNumber(fund.contribution_day)}
          <span style={{ marginInlineStart: 8, color: "rgba(0,0,0,0.45)", fontSize: 12 }}>
            {strings.funds.tableJalaliLands(dayPossibilities)}
          </span>
        </Descriptions.Item>
        <Descriptions.Item label={strings.overview.createdAt}>
          {formatJalaliDate(fund.created_at)}
        </Descriptions.Item>
      </Descriptions>

      <Alert type="info" showIcon message={strings.funds.contributionDayGregorianNote} />
    </Flex>
  );
}
