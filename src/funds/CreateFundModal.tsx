import { useMemo, useState } from "react";
import { Alert, Form, Modal, message } from "antd";
import { useCreateFund } from "./hooks";
import { fundSchema } from "./fundForm";
import FundFormFields from "./FundFormFields";
import { applyZodErrors, applyApiFieldErrors } from "../lib/zodForm";
import { recommendedContributionDay } from "../lib/jalali";
import { ApiError } from "../lib/errors";
import { errorMessage, strings } from "../lib/strings";

export default function CreateFundModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form] = Form.useForm();
  const [formError, setFormError] = useState<string | null>(null);
  const createFund = useCreateFund();

  // contribution_day is a Gregorian day (1–28); recommend one landing near the Jalali month start.
  const recommended = useMemo(() => recommendedContributionDay(), []);

  const close = () => {
    form.resetFields();
    setFormError(null);
    onClose();
  };

  const onFinish = (values: unknown) => {
    setFormError(null);
    const parsed = fundSchema.safeParse(values);
    if (!parsed.success) {
      applyZodErrors(form, parsed.error);
      return;
    }
    createFund.mutate(parsed.data, {
      onSuccess: () => {
        message.success(strings.funds.createSuccess);
        close();
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
      title={strings.funds.createTitle}
      okText={strings.funds.submit}
      cancelText={strings.funds.cancel}
      confirmLoading={createFund.isPending}
      onOk={() => form.submit()}
      onCancel={close}
      destroyOnHidden
    >
      {formError && <Alert type="error" message={formError} showIcon style={{ marginBottom: 16 }} />}

      <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false}>
        <FundFormFields recommendedDay={recommended.day} />
      </Form>
    </Modal>
  );
}
