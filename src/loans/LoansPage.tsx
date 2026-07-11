import { useState } from "react";
import { Alert, Button, Empty, Flex, Table, Tag, Typography } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useNavigate } from "react-router-dom";
import { useFundId } from "../funds/fundScope";
import { useLoans } from "./hooks";
import type { Loan } from "./api";
import { useMembers } from "../members/hooks";
import CreateLoanModal from "./CreateLoanModal";
import { formatNumber, formatToman } from "../lib/money";
import { toPersianDigits } from "../lib/digits";
import { formatJalaliDate } from "../lib/jalali";
import { ApiError } from "../lib/errors";
import { errorMessage, strings } from "../lib/strings";

const { Title } = Typography;

export default function LoansPage() {
  const fundId = useFundId();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const { data, isLoading, isError, error } = useLoans(fundId);
  const { data: membersData } = useMembers(fundId);

  // member id → display name, to label each loan's borrower (the loan carries only the id).
  const memberName = (id: number) => {
    const m = membersData?.results.find((x) => x.id === id);
    return m ? m.user_full_name || toPersianDigits(m.user_phone) : formatNumber(id);
  };

  const columns: ColumnsType<Loan> = [
    {
      title: strings.loans.colMember,
      dataIndex: "member",
      key: "member",
      render: (id: number) => memberName(id),
    },
    {
      title: strings.loans.colAmount,
      dataIndex: "loan_amount",
      key: "loan_amount",
      render: (v: number) => formatToman(v),
    },
    {
      title: strings.loans.colInstallments,
      key: "installments",
      render: (_, loan) => {
        const paid = loan.installments.filter((i) => i.status === "PAID").length;
        return strings.loans.installmentsProgress(
          formatNumber(paid),
          formatNumber(loan.installments.length),
        );
      },
    },
    {
      title: strings.loans.colIssueDate,
      dataIndex: "issue_date",
      key: "issue_date",
      render: (v: string) => formatJalaliDate(v),
    },
    {
      title: strings.loans.colStatus,
      dataIndex: "status",
      key: "status",
      render: (s: string) => (
        <Tag color={s === "ACTIVE" ? "blue" : "green"}>{strings.loans.status[s] ?? s}</Tag>
      ),
    },
  ];

  return (
    <Flex vertical gap="middle">
      <Flex align="center" justify="space-between">
        <Title level={4} style={{ margin: 0 }}>
          {strings.loans.title}
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
          {strings.loans.add}
        </Button>
      </Flex>

      {isError && (
        <Alert
          type="error"
          showIcon
          message={errorMessage(error instanceof ApiError ? error.code : "UNKNOWN")}
        />
      )}

      <Table<Loan>
        rowKey="id"
        columns={columns}
        dataSource={data?.results ?? []}
        loading={isLoading}
        pagination={false}
        locale={{ emptyText: <Empty description={strings.loans.empty} /> }}
        onRow={(loan) => ({
          onClick: () => navigate(`/funds/${fundId}/loans/${loan.id}`),
          style: { cursor: "pointer" },
        })}
      />

      <CreateLoanModal fundId={fundId} open={modalOpen} onClose={() => setModalOpen(false)} />
    </Flex>
  );
}
