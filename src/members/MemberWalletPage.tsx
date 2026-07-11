import { useState } from "react";
import { App, Button, Empty, Flex, Space, Statistic, Table, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { Link, useParams } from "react-router-dom";
import { useFundId } from "../funds/fundScope";
import { useMember } from "./hooks";
import { useSettleWallet, useWallet } from "../wallets/hooks";
import type { WalletTransaction } from "../wallets/api";
import AdjustmentModal from "../wallets/AdjustmentModal";
import ApiErrorAlert from "../components/ApiErrorAlert";
import { formatNumber, formatToman } from "../lib/money";
import { toPersianDigits } from "../lib/digits";
import { formatJalaliDate } from "../lib/jalali";
import { ApiError } from "../lib/errors";
import { errorMessage, strings } from "../lib/strings";

const { Title, Text } = Typography;

// The ledger is server-paginated (limit/offset); one page at a time (§6.5).
const PAGE_SIZE = 10;

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
    title: strings.wallet.colDescription,
    dataIndex: "description",
    key: "description",
    render: (d: string) => d || "—",
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
  const member = useMember(fundId, memberId!);
  const { modal, message } = App.useApp();

  const [page, setPage] = useState(1);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const { data, isLoading, isError, error } = useWallet(memberId!, {
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });
  const settle = useSettleWallet(memberId!, fundId);

  const ownerName = member
    ? member.user_full_name || toPersianDigits(member.user_phone)
    : strings.wallet.unknownMember(formatNumber(Number(memberId)));

  const runSettle = () => {
    modal.confirm({
      title: strings.wallet.settleConfirmTitle,
      content: strings.wallet.settleConfirmBody,
      okText: strings.wallet.settleConfirmOk,
      cancelText: strings.wallet.cancel,
      onOk: () =>
        new Promise<void>((resolve) => {
          settle.mutate(undefined, {
            onSuccess: (paid) => {
              message.success(
                paid.length > 0
                  ? strings.wallet.settlePaid(formatNumber(paid.length))
                  : strings.wallet.settleNothing,
              );
              resolve();
            },
            onError: (err) => {
              message.error(errorMessage(err instanceof ApiError ? err.code : "UNKNOWN"));
              resolve();
            },
          });
        }),
    });
  };

  return (
    <Flex vertical gap="middle">
      <Flex align="center" justify="space-between">
        <Flex vertical>
          <Title level={4} style={{ margin: 0 }}>
            {strings.wallet.of(ownerName)}
          </Title>
          {/* show phone as a subtitle only when the title is showing the name */}
          {member?.user_full_name && <Text type="secondary">{toPersianDigits(member.user_phone)}</Text>}
        </Flex>
        <Space>
          <Button onClick={() => setAdjustOpen(true)}>{strings.wallet.adjust}</Button>
          <Button onClick={runSettle} loading={settle.isPending}>
            {strings.wallet.settle}
          </Button>
          <Link to={`/funds/${fundId}/members`}>
            <Button>{strings.wallet.back}</Button>
          </Link>
        </Space>
      </Flex>

      {isError && <ApiErrorAlert error={error} />}

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
        pagination={{
          current: page,
          pageSize: PAGE_SIZE,
          total: data?.count ?? 0,
          onChange: setPage,
          showSizeChanger: false,
          hideOnSinglePage: true,
        }}
        locale={{ emptyText: <Empty description={strings.wallet.empty} /> }}
      />

      <AdjustmentModal
        memberId={memberId!}
        fundId={fundId}
        open={adjustOpen}
        onClose={() => setAdjustOpen(false)}
      />
    </Flex>
  );
}
