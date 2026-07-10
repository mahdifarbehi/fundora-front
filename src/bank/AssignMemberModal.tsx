import { useEffect, useState } from "react";
import { Alert, Form, Modal, Select, message } from "antd";
import { useMembers } from "../members/hooks";
import { useAssignBankTransaction } from "./hooks";
import type { BankTransaction } from "./api";
import { formatToman } from "../lib/money";
import { toPersianDigits } from "../lib/digits";
import { ApiError } from "../lib/errors";
import { errorMessage, strings } from "../lib/strings";

/**
 * Pick a fund member to manually assign an unmatched transaction to (FRONTEND_API §9.5).
 * Assigning charges that member's wallet; the row then leaves the unmatched queue.
 */
export default function AssignMemberModal({
  fundId,
  transaction,
  open,
  onClose,
}: {
  fundId: string;
  transaction: BankTransaction | null;
  open: boolean;
  onClose: () => void;
}) {
  const [form] = Form.useForm<{ member_id?: number }>();
  const [formError, setFormError] = useState<string | null>(null);
  const { data: membersData, isLoading: membersLoading } = useMembers(fundId);
  const assign = useAssignBankTransaction(fundId);

  // Reset per open so a previous pick/error doesn't leak into the next transaction.
  useEffect(() => {
    if (open) {
      form.resetFields();
      setFormError(null);
    }
  }, [open, transaction, form]);

  const options = (membersData?.results ?? []).map((m) => ({
    value: m.id,
    label: m.user_full_name || toPersianDigits(m.user_phone),
  }));

  const onFinish = ({ member_id }: { member_id?: number }) => {
    setFormError(null);
    if (transaction == null || member_id == null) return;

    const memberName =
      options.find((o) => o.value === member_id)?.label ?? String(member_id);

    assign.mutate(
      { id: transaction.id, memberId: member_id },
      {
        onSuccess: () => {
          message.success(strings.bank.assignSuccess(memberName));
          onClose();
        },
        onError: (err) => {
          setFormError(errorMessage(err instanceof ApiError ? err.code : "UNKNOWN"));
        },
      },
    );
  };

  return (
    <Modal
      open={open}
      title={strings.bank.assignTitle}
      okText={strings.bank.assignSubmit}
      cancelText={strings.bank.cancel}
      confirmLoading={assign.isPending}
      onOk={() => form.submit()}
      onCancel={onClose}
      destroyOnHidden
    >
      {transaction && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message={`${formatToman(transaction.amount)} — ${strings.bank.colCard}: ${toPersianDigits(
            transaction.from_card,
          )}`}
        />
      )}

      {formError && <Alert type="error" message={formError} showIcon style={{ marginBottom: 16 }} />}

      <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false}>
        <Form.Item
          name="member_id"
          label={strings.bank.assignMemberLabel}
          rules={[{ required: true, message: strings.bank.assignMemberRequired }]}
        >
          <Select
            placeholder={strings.bank.assignMemberPlaceholder}
            options={options}
            loading={membersLoading}
            showSearch
            optionFilterProp="label"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
