import { useState } from "react";
import { Alert, Form, Input, Modal, Radio, message } from "antd";
import { z } from "zod";
import { useAdjustWallet } from "./hooks";
import type { Direction } from "./api";
import { applyApiFieldErrors, applyZodErrors } from "../lib/zodForm";
import MoneyInput from "../components/MoneyInput";
import { formatToman } from "../lib/money";
import { ApiError } from "../lib/errors";
import { errorMessage, strings } from "../lib/strings";

// amount is a raw ASCII integer emitted by MoneyInput; description must be non-blank (§6.6).
const schema = z.object({
  amount: z.coerce
    .number()
    .int(strings.validation.integerRequired)
    .min(1, strings.validation.amountMin),
  direction: z.enum(["CREDIT", "DEBIT"]),
  description: z.string().trim().min(1, strings.errors.ADJUSTMENT_DESCRIPTION_REQUIRED),
});

/**
 * Manually credit or debit a member's wallet (FRONTEND_API §6.6). A CREDIT auto-settles pending
 * dues; a DEBIT is rejected with WALLET_OVERDRAFT if it exceeds the current balance.
 */
export default function AdjustmentModal({
  memberId,
  fundId,
  open,
  onClose,
}: {
  memberId: string;
  fundId: string;
  open: boolean;
  onClose: () => void;
}) {
  const [form] = Form.useForm<{ amount?: string; direction?: Direction; description?: string }>();
  const [formError, setFormError] = useState<string | null>(null);
  const adjust = useAdjustWallet(memberId, fundId);

  const close = () => {
    form.resetFields();
    setFormError(null);
    onClose();
  };

  const onFinish = (values: Record<string, unknown>) => {
    setFormError(null);
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      applyZodErrors(form, parsed.error);
      return;
    }

    adjust.mutate(parsed.data, {
      onSuccess: () => {
        message.success(
          parsed.data.direction === "CREDIT"
            ? strings.wallet.adjustSuccessCredit
            : strings.wallet.adjustSuccessDebit,
        );
        close();
      },
      onError: (err) => {
        const apiErr = err instanceof ApiError ? err : null;
        // Spell out an overdraft with the amounts the backend returned; place any per-field
        // VALIDATION_ERROR on its field (e.g. a whitespace description → `description:["blank"]`);
        // otherwise fall back to a form-level message keyed by code.
        if (apiErr?.code === "WALLET_OVERDRAFT") {
          setFormError(
            strings.overdraftDetail(
              formatToman(Number(apiErr.context.requested)),
              formatToman(Number(apiErr.context.balance)),
            ),
          );
        } else if (apiErr && applyApiFieldErrors(form, apiErr)) {
          // field errors rendered inline; no form-level banner needed
        } else {
          setFormError(errorMessage(apiErr?.code ?? "UNKNOWN"));
        }
      },
    });
  };

  return (
    <Modal
      open={open}
      title={strings.wallet.adjustTitle}
      okText={strings.wallet.adjustSubmit}
      cancelText={strings.wallet.cancel}
      confirmLoading={adjust.isPending}
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
        initialValues={{ direction: "CREDIT" }}
      >
        <Form.Item name="direction" label={strings.wallet.adjustDirectionLabel}>
          <Radio.Group optionType="button" buttonStyle="solid">
            <Radio.Button value="CREDIT">{strings.wallet.adjustCredit}</Radio.Button>
            <Radio.Button value="DEBIT">{strings.wallet.adjustDebit}</Radio.Button>
          </Radio.Group>
        </Form.Item>

        <Form.Item
          name="amount"
          label={strings.wallet.adjustAmountLabel}
          rules={[{ required: true, message: strings.validation.amountRequired }]}
        >
          <MoneyInput />
        </Form.Item>

        <Form.Item
          name="description"
          label={strings.wallet.adjustDescriptionLabel}
          rules={[{ required: true, message: strings.errors.ADJUSTMENT_DESCRIPTION_REQUIRED }]}
        >
          <Input.TextArea rows={2} placeholder={strings.wallet.adjustDescriptionPlaceholder} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
