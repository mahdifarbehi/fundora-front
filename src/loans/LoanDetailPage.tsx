import { useState } from "react";
import { Alert, Button, Descriptions, Flex, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { Link, useParams } from "react-router-dom";
import { useFundId } from "../funds/fundScope";
import { useLoan } from "./hooks";
import type { Installment } from "./api";
import { useMember } from "../members/hooks";
import ReverseDueModal from "./ReverseDueModal";
import { formatNumber, formatToman } from "../lib/money";
import { toPersianDigits } from "../lib/digits";
import { formatJalaliDate } from "../lib/jalali";
import { ApiError } from "../lib/errors";
import { errorMessage, strings } from "../lib/strings";

const { Title } = Typography;

export default function LoanDetailPage() {
  const fundId = useFundId();
  const { loanId } = useParams<{ loanId: string }>();
  const { data: loan, isLoading, isError, error } = useLoan(loanId!);
  const member = useMember(fundId, loan ? String(loan.member) : "");
  const [reversing, setReversing] = useState<Installment | null>(null);

  const memberLabel = loan
    ? member
      ? member.user_full_name || toPersianDigits(member.user_phone)
      : formatNumber(loan.member)
    : "—";

  const columns: ColumnsType<Installment> = [
    {
      title: strings.loans.colNumber,
      dataIndex: "installment_number",
      key: "installment_number",
      render: (n: number | null) => (n == null ? "—" : formatNumber(n)),
    },
    {
      title: strings.loans.colDueDate,
      dataIndex: "due_date",
      key: "due_date",
      render: (v: string) => formatJalaliDate(v),
    },
    {
      title: strings.loans.colInstAmount,
      dataIndex: "amount",
      key: "amount",
      render: (v: number) => formatToman(v),
    },
    {
      title: strings.loans.colInstStatus,
      dataIndex: "status",
      key: "status",
      render: (s: string) => (
        <Tag color={s === "PAID" ? "green" : "default"}>{strings.loans.instStatus[s] ?? s}</Tag>
      ),
    },
    {
      title: strings.loans.colPaidAt,
      dataIndex: "paid_at",
      key: "paid_at",
      render: (v: string | null) => (v ? formatJalaliDate(v) : "—"),
    },
    {
      title: "",
      key: "action",
      render: (_, inst) =>
        inst.status === "PAID" ? (
          <Button size="small" danger onClick={() => setReversing(inst)}>
            {strings.loans.reverse}
          </Button>
        ) : null,
    },
  ];

  return (
    <Flex vertical gap="middle">
      <Flex align="center" justify="space-between">
        <Title level={4} style={{ margin: 0 }}>
          {loan ? strings.loans.detailTitle(formatNumber(loan.id)) : strings.loans.title}
        </Title>
        <Link to={`/funds/${fundId}/loans`}>
          <Button>{strings.loans.back}</Button>
        </Link>
      </Flex>

      {isError && (
        <Alert
          type="error"
          showIcon
          message={errorMessage(error instanceof ApiError ? error.code : "UNKNOWN")}
        />
      )}

      {loan && (
        <Descriptions bordered column={1} size="small">
          <Descriptions.Item label={strings.loans.infoMember}>{memberLabel}</Descriptions.Item>
          <Descriptions.Item label={strings.loans.infoAmount}>
            {formatToman(loan.loan_amount)}
          </Descriptions.Item>
          <Descriptions.Item label={strings.loans.infoInstallmentCount}>
            {formatNumber(loan.installment_count)}
          </Descriptions.Item>
          <Descriptions.Item label={strings.loans.infoGenerated}>
            {formatNumber(loan.installments.length)}
          </Descriptions.Item>
          <Descriptions.Item label={strings.loans.infoIssueDate}>
            {formatJalaliDate(loan.issue_date)}
          </Descriptions.Item>
          <Descriptions.Item label={strings.loans.infoStatus}>
            <Tag color={loan.status === "ACTIVE" ? "blue" : "green"}>
              {strings.loans.status[loan.status] ?? loan.status}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label={strings.loans.infoCreatedAt}>
            {formatJalaliDate(loan.created_at)}
          </Descriptions.Item>
        </Descriptions>
      )}

      <Title level={5} style={{ margin: 0 }}>
        {strings.loans.scheduleTitle}
      </Title>
      <Table<Installment>
        rowKey="id"
        columns={columns}
        dataSource={loan?.installments ?? []}
        loading={isLoading}
        pagination={false}
      />

      <ReverseDueModal
        fundId={fundId}
        loanId={loanId!}
        memberId={loan?.member ?? 0}
        installment={reversing}
        open={reversing != null}
        onClose={() => setReversing(null)}
      />
    </Flex>
  );
}
