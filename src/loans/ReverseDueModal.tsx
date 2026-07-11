import { useEffect, useState } from "react";
import { Alert, Form, Input, Modal, message } from "antd";
import { useReverseDue } from "./hooks";
import type { Installment } from "./api";
import { formatNumber, formatToman } from "../lib/money";
import { ApiError } from "../lib/errors";
import { errorMessage, strings } from "../lib/strings";

/**
 * Confirm reversing a paid installment (FRONTEND_API §8.1). Description is optional (may be blank).
 * The reversal credits the member's wallet and can flip the loan back to ACTIVE.
 */
export default function ReverseDueModal({
  fundId,
  loanId,
  memberId,
  installment,
  open,
  onClose,
}: {
  fundId: string;
  loanId: string;
  memberId: number;
  installment: Installment | null;
  open: boolean;
  onClose: () => void;
}) {
  const [form] = Form.useForm<{ description?: string }>();
  const [formError, setFormError] = useState<string | null>(null);
  const reverse = useReverseDue(fundId, loanId, memberId);

  useEffect(() => {
    if (open) {
      form.resetFields();
      setFormError(null);
    }
  }, [open, installment, form]);

  const onFinish = ({ description }: { description?: string }) => {
    setFormError(null);
    if (installment == null) return;
    reverse.mutate(
      { dueId: installment.id, description },
      {
        onSuccess: () => {
          message.success(strings.loans.reverseSuccess);
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
      title={strings.loans.reverseTitle}
      okText={strings.loans.reverseConfirm}
      cancelText={strings.loans.cancel}
      okButtonProps={{ danger: true }}
      confirmLoading={reverse.isPending}
      onOk={() => form.submit()}
      onCancel={onClose}
      destroyOnHidden
    >
      {installment && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message={strings.loans.reverseBody}
          description={`${strings.loans.colNumber} ${formatNumber(
            installment.installment_number ?? 0,
          )} — ${formatToman(installment.amount)}`}
        />
      )}

      {formError && <Alert type="error" message={formError} showIcon style={{ marginBottom: 16 }} />}

      <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false}>
        <Form.Item name="description" label={strings.loans.reverseDescLabel}>
          <Input.TextArea rows={2} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
