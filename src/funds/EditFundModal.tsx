import { useEffect, useState } from "react";
import { Alert, Form, Modal, message } from "antd";
import { useUpdateFund } from "./hooks";
import type { Fund } from "./api";
import { fundSchema } from "./fundForm";
import FundFormFields from "./FundFormFields";
import { applyZodErrors, applyApiFieldErrors } from "../lib/zodForm";
import { ApiError } from "../lib/errors";
import { errorMessage, strings } from "../lib/strings";

/**
 * Edit a fund's settings (§5.4). Prefilled from the current fund; the "changes apply to future
 * operations only" note is shown so the user knows existing loans/dues won't be rewritten.
 */
export default function EditFundModal({
  fundId,
  fund,
  open,
  onClose,
}: {
  fundId: string;
  fund: Fund;
  open: boolean;
  onClose: () => void;
}) {
  const [form] = Form.useForm();
  const [formError, setFormError] = useState<string | null>(null);
  const update = useUpdateFund(fundId);

  // Reset the form to the fund's current values each time it opens (and if the fund refetches).
  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        name: fund.name,
        monthly_share_amount: String(fund.monthly_share_amount),
        default_loan_amount: String(fund.default_loan_amount),
        default_installment_count: String(fund.default_installment_count),
        contribution_day: fund.contribution_day,
      });
      setFormError(null);
    }
  }, [open, fund, form]);

  const onFinish = (values: unknown) => {
    setFormError(null);
    const parsed = fundSchema.safeParse(values);
    if (!parsed.success) {
      applyZodErrors(form, parsed.error);
      return;
    }
    update.mutate(parsed.data, {
      onSuccess: () => {
        message.success(strings.funds.editSuccess);
        onClose();
      },
      onError: (err) => {
        if (err instanceof ApiError && applyApiFieldErrors(form, err)) return;
        setFormError(errorMessage(err instanceof ApiError ? err.code : "UNKNOWN"));
      },
    });
  };

  return (
    <Modal
      open={open}
      title={strings.funds.editTitle}
      okText={strings.funds.editSubmit}
      cancelText={strings.funds.cancel}
      confirmLoading={update.isPending}
      onOk={() => form.submit()}
      onCancel={onClose}
      destroyOnHidden
    >
      <Alert
        type="info"
        showIcon
        message={strings.funds.settingsFutureNote}
        style={{ marginBottom: 16 }}
      />
      {formError && <Alert type="error" message={formError} showIcon style={{ marginBottom: 16 }} />}

      <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false}>
        <FundFormFields />
      </Form>
    </Modal>
  );
}
