import { useState } from "react";
import { Alert, Badge, Button, Empty, Flex, Space, Table, Tabs, Tag, Typography, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { Link } from "react-router-dom";
import { useFundId } from "../funds/fundScope";
import { useMembers } from "../members/hooks";
import type { Member } from "../members/api";
import {
  useBankTransactions,
  useUnmatchedBankTransactions,
  useRematchBankTransaction,
} from "./hooks";
import RecordTransferModal from "./RecordTransferModal";
import AssignMemberModal from "./AssignMemberModal";
import ApiErrorAlert from "../components/ApiErrorAlert";
import type { BankTransaction } from "./api";
import { formatToman } from "../lib/money";
import { toPersianDigits } from "../lib/digits";
import { formatJalaliDate } from "../lib/jalali";
import { ApiError } from "../lib/errors";
import { errorMessage, strings } from "../lib/strings";

const { Title, Paragraph } = Typography;

// The bank transaction only carries matched_member (id); resolve the name from the members
// list (there's no name-bearing single-member GET).
function memberLabel(member: Member | undefined, id: number | null): string {
  if (id == null) return "—";
  if (!member) return strings.wallet.unknownMember(toPersianDigits(String(id)));
  return member.user_full_name || toPersianDigits(member.user_phone);
}

// Columns shared by both tables (amount / date / card / tracking).
const baseColumns: ColumnsType<BankTransaction> = [
  { title: strings.bank.colAmount, dataIndex: "amount", key: "amount", render: (v: number) => formatToman(v) },
  {
    title: strings.bank.colDate,
    dataIndex: "transfer_datetime",
    key: "transfer_datetime",
    render: (v: string) => formatJalaliDate(v),
  },
  { title: strings.bank.colCard, dataIndex: "from_card", key: "from_card", render: (v: string) => toPersianDigits(v) },
  {
    title: strings.bank.colTracking,
    dataIndex: "tracking_code",
    key: "tracking_code",
    render: (v: string) => (v ? toPersianDigits(v) : "—"),
  },
];

function buildAllColumns(byId: Map<number, Member>): ColumnsType<BankTransaction> {
  return [
    ...baseColumns,
    {
      title: strings.bank.colMember,
      key: "member",
      render: (_, row) => memberLabel(row.matched_member != null ? byId.get(row.matched_member) : undefined, row.matched_member),
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
}

function AllTransactions({ fundId, membersById }: { fundId: string; membersById: Map<number, Member> }) {
  const { data, isLoading, isError, error } = useBankTransactions(fundId);
  return (
    <Flex vertical gap="middle">
      {isError && <ApiErrorAlert error={error} />}
      <Table<BankTransaction>
        rowKey="id"
        columns={buildAllColumns(membersById)}
        dataSource={data?.results ?? []}
        loading={isLoading}
        pagination={false}
        scroll={{ x: "max-content" }}
        locale={{ emptyText: <Empty description={strings.bank.empty} /> }}
      />
    </Flex>
  );
}

function UnmatchedQueue({ fundId, membersById }: { fundId: string; membersById: Map<number, Member> }) {
  const { data, isLoading, isError, error } = useUnmatchedBankTransactions(fundId);
  const rematch = useRematchBankTransaction(fundId);
  const [assignFor, setAssignFor] = useState<BankTransaction | null>(null);
  // Which row is currently re-matching, so only its button shows a spinner.
  const [rematchingId, setRematchingId] = useState<number | null>(null);

  const onRematch = (row: BankTransaction) => {
    setRematchingId(row.id);
    rematch.mutate(row.id, {
      onSuccess: (txn) => {
        if (txn.matched_member != null) {
          message.success(strings.bank.rematchMatched(memberLabel(membersById.get(txn.matched_member), txn.matched_member)));
        } else {
          message.info(strings.bank.rematchStillUnmatched);
        }
      },
      onError: (err) => {
        message.error(errorMessage(err instanceof ApiError ? err.code : "UNKNOWN"));
      },
      onSettled: () => setRematchingId(null),
    });
  };

  const columns: ColumnsType<BankTransaction> = [
    ...baseColumns,
    {
      title: strings.bank.colActions,
      key: "actions",
      render: (_, row) => (
        <Space>
          <Button size="small" type="primary" onClick={() => setAssignFor(row)}>
            {strings.bank.assign}
          </Button>
          <Button
            size="small"
            onClick={() => onRematch(row)}
            loading={rematchingId === row.id}
          >
            {strings.bank.rematch}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Flex vertical gap="middle">
      <Paragraph type="secondary" style={{ margin: 0 }}>
        {strings.bank.unmatchedHint}
      </Paragraph>
      {isError && <ApiErrorAlert error={error} />}
      <Table<BankTransaction>
        rowKey="id"
        columns={columns}
        dataSource={data?.results ?? []}
        loading={isLoading}
        pagination={false}
        scroll={{ x: "max-content" }}
        locale={{ emptyText: <Empty description={strings.bank.unmatchedEmpty} /> }}
      />
      <AssignMemberModal
        fundId={fundId}
        transaction={assignFor}
        open={assignFor != null}
        onClose={() => setAssignFor(null)}
      />
    </Flex>
  );
}

export default function BankPage() {
  const fundId = useFundId();
  const [modalOpen, setModalOpen] = useState(false);
  const [last, setLast] = useState<BankTransaction | null>(null);
  const { data: membersData } = useMembers(fundId);
  const { data: unmatchedData } = useUnmatchedBankTransactions(fundId);

  const membersById = new Map((membersData?.results ?? []).map((m) => [m.id, m]));
  const unmatchedCount = unmatchedData?.count ?? 0;

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

      {/* Immediate feedback for the most recent recording, naming + linking to the wallet. */}
      {last && (
        <Alert
          type={last.wallet_charged ? "success" : "warning"}
          showIcon
          message={
            last.matched_member != null
              ? `${formatToman(last.amount)} — ${strings.bank.matchedTo(
                  memberLabel(membersById.get(last.matched_member), last.matched_member),
                )}`
              : `${formatToman(last.amount)} — ${strings.bank.unmatched}`
          }
          description={
            last.matched_member != null ? (
              <Link to={`/funds/${fundId}/members/${last.matched_member}/wallet`}>
                {strings.wallet.title}
              </Link>
            ) : undefined
          }
        />
      )}

      <Tabs
        items={[
          {
            key: "all",
            label: strings.bank.tabAll,
            children: <AllTransactions fundId={fundId} membersById={membersById} />,
          },
          {
            key: "unmatched",
            label: (
              <Badge count={unmatchedCount} size="small" offset={[10, 0]}>
                {strings.bank.tabUnmatched}
              </Badge>
            ),
            children: <UnmatchedQueue fundId={fundId} membersById={membersById} />,
          },
        ]}
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
