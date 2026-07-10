import { Alert, Button, Empty, Flex, Statistic, Table, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { Link, useParams } from "react-router-dom";
import { useFundId } from "../funds/fundScope";
import { useWallet } from "../wallets/hooks";
import type { WalletTransaction } from "../wallets/api";
import { formatToman } from "../lib/money";
import { formatJalaliDate } from "../lib/jalali";
import { ApiError } from "../lib/errors";
import { errorMessage, strings } from "../lib/strings";

const { Title } = Typography;

const columns: ColumnsType<WalletTransaction> = [
  {
    title: strings.wallet.colAmount,
    dataIndex: "amount",
    key: "amount",
    render: (amount: number, row) => {
      const sign = row.direction === "CREDIT" ? "+" : "−";
      return (
        <span style={{ color: row.direction === "CREDIT" ? "#3f8600" : "#cf1322" }}>
          {sign} {formatToman(amount)}
        </span>
      );
    },
  },
  {
    title: strings.wallet.colType,
    dataIndex: "type",
    key: "type",
    render: (t: string) => strings.wallet.txnType[t] ?? t,
  },
  {
    title: strings.wallet.colDate,
    dataIndex: "created_at",
    key: "created_at",
    render: (v: string) => formatJalaliDate(v),
  },
];

export default function MemberWalletPage() {
  const fundId = useFundId();
  const { memberId } = useParams<{ memberId: string }>();
  const { data, isLoading, isError, error } = useWallet(memberId!);

  return (
    <Flex vertical gap="middle">
      <Flex align="center" justify="space-between">
        <Title level={4} style={{ margin: 0 }}>
          {strings.wallet.title}
        </Title>
        <Link to={`/funds/${fundId}/members`}>
          <Button>{strings.wallet.back}</Button>
        </Link>
      </Flex>

      {isError && (
        <Alert
          type="error"
          showIcon
          message={errorMessage(error instanceof ApiError ? error.code : "UNKNOWN")}
        />
      )}

      <Statistic
        title={strings.wallet.balance}
        value={data ? formatToman(data.balance) : "—"}
        loading={isLoading}
      />

      <Table<WalletTransaction>
        rowKey="id"
        columns={columns}
        dataSource={data?.results ?? []}
        loading={isLoading}
        pagination={false}
        locale={{ emptyText: <Empty description={strings.wallet.empty} /> }}
      />
    </Flex>
  );
}
