import { useState } from "react";
import { Button, Empty, Flex, Space, Table, Tooltip, Typography } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useNavigate } from "react-router-dom";
import { useFunds } from "./hooks";
import type { Fund } from "./api";
import CreateFundModal from "./CreateFundModal";
import ApiErrorAlert from "../components/ApiErrorAlert";
import { formatNumber, formatToman } from "../lib/money";
import { jalaliDayPossibilities } from "../lib/jalali";
import { strings } from "../lib/strings";

const { Title, Text } = Typography;

const columns: ColumnsType<Fund> = [
  { title: strings.funds.colName, dataIndex: "name", key: "name" },
  {
    title: strings.funds.colMonthlyShare,
    dataIndex: "monthly_share_amount",
    key: "monthly_share_amount",
    render: (v: number) => formatToman(v),
  },
  {
    title: strings.funds.colDefaultLoan,
    dataIndex: "default_loan_amount",
    key: "default_loan_amount",
    render: (v: number) => formatToman(v),
  },
  {
    title: strings.funds.colInstallmentCount,
    dataIndex: "default_installment_count",
    key: "default_installment_count",
    render: (v: number) => formatNumber(v),
  },
  {
    title: strings.funds.colContributionDay,
    dataIndex: "contribution_day",
    key: "contribution_day",
    render: (v: number) => {
      const possibilities = jalaliDayPossibilities(v).map(formatNumber).join("، ");
      return (
        <Space size={6}>
          <span>{formatNumber(v)}</span>
          <Tooltip title={strings.funds.dayHintTooltip}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {strings.funds.tableJalaliLands(possibilities)}
            </Text>
          </Tooltip>
        </Space>
      );
    },
  },
];

export default function FundsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const { data, isLoading, isError, error } = useFunds();
  const navigate = useNavigate();

  return (
    <Flex vertical gap="middle">
      <Flex align="center" justify="space-between">
        <Title level={3} style={{ margin: 0 }}>
          {strings.funds.title}
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
          {strings.funds.create}
        </Button>
      </Flex>

      {isError && <ApiErrorAlert error={error} />}

      <Table<Fund>
        rowKey="id"
        columns={columns}
        dataSource={data?.results ?? []}
        loading={isLoading}
        pagination={false}
        locale={{ emptyText: <Empty description={strings.funds.empty} /> }}
        onRow={(fund) => ({
          onClick: () => navigate(`/funds/${fund.id}`),
          style: { cursor: "pointer" },
        })}
      />

      <CreateFundModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </Flex>
  );
}
