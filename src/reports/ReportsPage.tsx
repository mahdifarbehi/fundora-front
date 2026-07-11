import { useState } from "react";
import { Alert, Button, Card, Empty, Flex, Statistic, Table, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useFundId } from "../funds/fundScope";
import { useMonthlyReport } from "./hooks";
import type { MemberBalance } from "./api";
import { useMembers } from "../members/hooks";
import JalaliDateTimeInput from "../components/JalaliDateTimeInput";
import { formatNumber, formatToman } from "../lib/money";
import { toPersianDigits } from "../lib/digits";
import { isoToDateOnly } from "../lib/jalali";
import { ApiError } from "../lib/errors";
import { errorMessage, strings } from "../lib/strings";

const { Title, Text } = Typography;

export default function ReportsPage() {
  const fundId = useFundId();
  // `draftIso` is what the picker holds; `period` (YYYY-MM-DD) is the committed query, set on
  // "generate" so we don't refetch on every field edit.
  const [draftIso, setDraftIso] = useState<string | undefined>(new Date().toISOString());
  const [period, setPeriod] = useState<string | undefined>(undefined);
  const { data, isLoading, isError, error, isFetching } = useMonthlyReport(fundId, period);
  const { data: membersData } = useMembers(fundId);

  const memberName = (id: number) => {
    const m = membersData?.results.find((x) => x.id === id);
    return m ? m.user_full_name || toPersianDigits(m.user_phone) : formatNumber(id);
  };

  const columns: ColumnsType<MemberBalance> = [
    {
      title: strings.reports.colMember,
      dataIndex: "member_id",
      key: "member_id",
      render: (id: number) => memberName(id),
    },
    {
      title: strings.reports.colBalance,
      dataIndex: "balance",
      key: "balance",
      render: (v: number) => formatToman(v),
    },
  ];

  return (
    <Flex vertical gap="middle">
      <Title level={4} style={{ margin: 0 }}>
        {strings.reports.title}
      </Title>

      <Flex align="end" gap="middle" wrap>
        <Flex vertical gap={4}>
          <Text>{strings.reports.periodLabel}</Text>
          <JalaliDateTimeInput value={draftIso} onChange={setDraftIso} />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {strings.reports.periodHelp}
          </Text>
        </Flex>
        <Button
          type="primary"
          disabled={!draftIso}
          loading={isFetching}
          onClick={() => setPeriod(isoToDateOnly(draftIso))}
        >
          {strings.reports.generate}
        </Button>
      </Flex>

      {isError && (
        <Alert
          type="error"
          showIcon
          message={errorMessage(error instanceof ApiError ? error.code : "UNKNOWN")}
        />
      )}

      {!period && !isError && <Empty description={strings.reports.emptyPrompt} />}

      {period && data && (
        <>
          <Flex gap="middle" wrap>
            <Card size="small">
              <Statistic title={strings.reports.expectedContributions} value={formatToman(data.expected_contributions)} />
            </Card>
            <Card size="small">
              <Statistic title={strings.reports.receivedContributions} value={formatToman(data.received_contributions)} />
            </Card>
            <Card size="small">
              <Statistic title={strings.reports.activeLoanTotal} value={formatToman(data.active_loan_total)} />
            </Card>
            <Card size="small">
              <Statistic title={strings.reports.activeLoanCount} value={formatNumber(data.active_loan_count)} />
            </Card>
          </Flex>

          <Title level={5} style={{ margin: 0 }}>
            {strings.reports.memberBalancesTitle}
          </Title>
          <Table<MemberBalance>
            rowKey="member_id"
            columns={columns}
            dataSource={data.member_balances}
            loading={isLoading}
            pagination={false}
            locale={{ emptyText: <Empty description={strings.reports.emptyBalances} /> }}
          />
        </>
      )}
    </Flex>
  );
}
