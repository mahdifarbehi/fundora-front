import { useState } from "react";
import { Button, Empty, Flex, Table, Typography } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useNavigate } from "react-router-dom";
import { useFundId } from "../funds/fundScope";
import { useMembers } from "./hooks";
import type { Member } from "./api";
import AddMemberModal from "./AddMemberModal";
import ApiErrorAlert from "../components/ApiErrorAlert";
import { formatNumber } from "../lib/money";
import { toPersianDigits } from "../lib/digits";
import { formatJalaliDate } from "../lib/jalali";
import { strings } from "../lib/strings";

const { Title } = Typography;

const columns: ColumnsType<Member> = [
  {
    title: strings.members.colName,
    dataIndex: "user_full_name",
    key: "user_full_name",
    render: (v: string) => v || strings.members.noName,
  },
  {
    title: strings.members.colPhone,
    dataIndex: "user_phone",
    key: "user_phone",
    render: (v: string) => toPersianDigits(v), // Persian digits, NOT grouped
  },
  {
    title: strings.members.colShareCount,
    dataIndex: "share_count",
    key: "share_count",
    render: (v: number) => formatNumber(v),
  },
  {
    title: strings.members.colCreatedAt,
    dataIndex: "created_at",
    key: "created_at",
    render: (v: string) => formatJalaliDate(v),
  },
];

export default function MembersPage() {
  const fundId = useFundId();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const { data, isLoading, isError, error } = useMembers(fundId);

  return (
    <Flex vertical gap="middle">
      <Flex align="center" justify="space-between">
        <Title level={4} style={{ margin: 0 }}>
          {strings.members.title}
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
          {strings.members.add}
        </Button>
      </Flex>

      {isError && <ApiErrorAlert error={error} />}

      <Table<Member>
        rowKey="id"
        columns={columns}
        dataSource={data?.results ?? []}
        loading={isLoading}
        pagination={false}
        scroll={{ x: "max-content" }}
        locale={{ emptyText: <Empty description={strings.members.empty} /> }}
        onRow={(m) => ({
          onClick: () => navigate(`/funds/${fundId}/members/${m.id}/wallet`),
          style: { cursor: "pointer" },
        })}
      />

      <AddMemberModal fundId={fundId} open={modalOpen} onClose={() => setModalOpen(false)} />
    </Flex>
  );
}
