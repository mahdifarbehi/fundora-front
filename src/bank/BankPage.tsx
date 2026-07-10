import { useState } from "react";
import { Alert, Button, Empty, Flex, Table, Tag, Typography } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { Link } from "react-router-dom";
import { useFundId } from "../funds/fundScope";
import { useBankTransactions } from "./hooks";
import RecordTransferModal from "./RecordTransferModal";
import type { BankTransaction } from "./api";
import { formatToman } from "../lib/money";
import { toPersianDigits } from "../lib/digits";
import { formatJalaliDate } from "../lib/jalali";
import { ApiError } from "../lib/errors";
import { errorMessage, strings } from "../lib/strings";

const { Title } = Typography;

const columns: ColumnsType<BankTransaction> = [
  {
    title: strings.bank.colAmount,
    dataIndex: "amount",
    key: "amount",
    render: (v: number) => formatToman(v),
  },
  {
    title: strings.bank.colDate,
    dataIndex: "transfer_datetime",
    key: "transfer_datetime",
    render: (v: string) => formatJalaliDate(v),
  },
  {
    title: strings.bank.colCard,
    dataIndex: "from_card",
    key: "from_card",
    render: (v: string) => toPersianDigits(v),
  },
  {
    title: strings.bank.colTracking,
    dataIndex: "tracking_code",
    key: "tracking_code",
    render: (v: string) => (v ? toPersianDigits(v) : "—"),
  },
  {
    title: strings.bank.colStatus,
    key: "status",
    render: (_, row) =>
      row.wallet_charged ? (
        <Tag color="green">{strings.bank.statusCharged}</Tag>
      ) : (
        <Tag color="orange">{strings.bank.statusUnmatched}</Tag>
      ),
  },
];

export default function BankPage() {
  const fundId = useFundId();
  const [modalOpen, setModalOpen] = useState(false);
  const [last, setLast] = useState<BankTransaction | null>(null);
  const { data, isLoading, isError, error } = useBankTransactions(fundId);

  return (
    <Flex vertical gap="middle">
      <Flex align="center" justify="space-between">
        <Title level={4} style={{ margin: 0 }}>
          {strings.bank.title}
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
          {strings.bank.record}
        </Button>
      </Flex>

      {/* Immediate feedback for the most recent recording, linking to the charged wallet. */}
      {last && (
        <Alert
          type={last.wallet_charged ? "success" : "warning"}
          showIcon
          message={`${formatToman(last.amount)} — ${
            last.wallet_charged ? strings.bank.matched : strings.bank.unmatched
          }`}
          description={
            last.matched_member != null ? (
              <Link to={`/funds/${fundId}/members/${last.matched_member}/wallet`}>
                {strings.wallet.title}
              </Link>
            ) : undefined
          }
        />
      )}

      {isError && (
        <Alert
          type="error"
          showIcon
          message={errorMessage(error instanceof ApiError ? error.code : "UNKNOWN")}
        />
      )}

      <Table<BankTransaction>
        rowKey="id"
        columns={columns}
        dataSource={data?.results ?? []}
        loading={isLoading}
        pagination={false}
        locale={{ emptyText: <Empty description={strings.bank.empty} /> }}
      />

      <RecordTransferModal
        fundId={fundId}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onRecorded={setLast}
      />
    </Flex>
  );
}
