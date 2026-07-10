import { useState } from "react";
import { Alert, Form, Input, Modal, message } from "antd";
import { z } from "zod";
import { usePostBankTransaction } from "./hooks";
import type { BankTransaction } from "./api";
import { applyZodErrors } from "../lib/zodForm";
import { normalizeDigits } from "../lib/digits";
import MoneyInput from "../components/MoneyInput";
import JalaliDateTimeInput from "../components/JalaliDateTimeInput";
import { ApiError } from "../lib/errors";
import { errorMessage, strings } from "../lib/strings";

// transfer_datetime is entered as a Jalali date-time (JalaliDateTimeInput) and stored/sent as
// a Gregorian/UTC ISO string (ADR 0004).
const schema = z.object({
  amount: z.coerce
    .number()
    .int(strings.validation.integerRequired)
    .min(1, strings.validation.amountMin),
  from_card: z.string().min(1, strings.validation.fromCardRequired),
  tracking_code: z.string().optional().default(""),
  note: z.string().optional().default(""),
});

export default function RecordTransferModal({
  fundId,
  open,
  onClose,
  onRecorded,
}: {
  fundId: string;
  open: boolean;
  onClose: () => void;
  onRecorded: (txn: BankTransaction) => void;
}) {
  const [form] = Form.useForm();
  const [formError, setFormError] = useState<string | null>(null);
  const post = usePostBankTransaction(fundId);

  const close = () => {
    form.resetFields();
    setFormError(null);
    onClose();
  };

  const onFinish = (values: { transfer_datetime?: string } & Record<string, unknown>) => {
    setFormError(null);
    const parsed = schema.safeParse(values);
    const dt = values.transfer_datetime; // already a Gregorian/UTC ISO string
    if (!parsed.success) {
      applyZodErrors(form, parsed.error);
      return;
    }
    if (!dt) {
      form.setFields([{ name: "transfer_datetime", errors: [strings.validation.datetimeRequired] }]);
      return;
    }

    post.mutate(
      {
        amount: parsed.data.amount,
        transfer_datetime: dt,
        from_card: parsed.data.from_card,
        ...(parsed.data.tracking_code ? { tracking_code: parsed.data.tracking_code } : {}),
        ...(parsed.data.note ? { note: parsed.data.note } : {}),
      },
      {
        onSuccess: (txn) => {
          message.success(txn.wallet_charged ? strings.bank.matched : strings.bank.unmatched);
          onRecorded(txn);
          close();
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
      title={strings.bank.recordTitle}
      okText={strings.bank.submit}
      cancelText={strings.bank.cancel}
      confirmLoading={post.isPending}
      onOk={() => form.submit()}
      onCancel={close}
      destroyOnHidden
    >
      {formError && <Alert type="error" message={formError} showIcon style={{ marginBottom: 16 }} />}

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        requiredMark={false}
        initialValues={{ transfer_datetime: new Date().toISOString() }}
      >
        <Form.Item
          name="amount"
          label={strings.bank.amountLabel}
          rules={[{ required: true, message: strings.validation.amountRequired }]}
        >
          <MoneyInput />
        </Form.Item>

        <Form.Item
          name="transfer_datetime"
          label={strings.bank.datetimeLabel}
          rules={[{ required: true, message: strings.validation.datetimeRequired }]}
        >
          <JalaliDateTimeInput showTime />
        </Form.Item>

        <Form.Item
          name="from_card"
          label={strings.bank.fromCardLabel}
          normalize={normalizeDigits}
          rules={[{ required: true, message: strings.validation.fromCardRequired }]}
        >
          <Input inputMode="numeric" />
        </Form.Item>

        <Form.Item name="tracking_code" label={strings.bank.trackingLabel} normalize={normalizeDigits}>
          <Input inputMode="numeric" />
        </Form.Item>

        <Form.Item name="note" label={strings.bank.noteLabel}>
          <Input.TextArea rows={2} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
