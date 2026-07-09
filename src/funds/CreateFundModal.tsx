import { useMemo, useState } from "react";
import { Alert, Form, Input, Modal, Select, Typography, message } from "antd";
import { z } from "zod";
import { useCreateFund } from "./hooks";
import { applyZodErrors, applyApiFieldErrors } from "../lib/zodForm";
import { formatNumber } from "../lib/money";
import {
  jalaliDayPossibilities,
  recommendedContributionDay,
  wrapsJalaliMonth,
} from "../lib/jalali";
import MoneyInput from "../components/MoneyInput";
import NumberInput from "../components/NumberInput";
import { ApiError } from "../lib/errors";
import { errorMessage, strings } from "../lib/strings";

const { Text } = Typography;

// Money + counts are typed as text (so Persian digits normalize to ASCII, ADR 0007) and
// Zod coerces them to integers; contribution_day is clamped to 1–28 (FRONTEND_API §5).
const schema = z.object({
  name: z.string().min(1, strings.validation.nameRequired),
  monthly_share_amount: z.coerce
    .number()
    .int(strings.validation.integerRequired)
    .min(1, strings.validation.amountMin),
  default_loan_amount: z.coerce
    .number()
    .int(strings.validation.integerRequired)
    .min(1, strings.validation.amountMin),
  default_installment_count: z.coerce
    .number()
    .int(strings.validation.integerRequired)
    .min(1, strings.validation.countMin),
  contribution_day: z.coerce
    .number()
    .int(strings.validation.integerRequired)
    .min(1, strings.validation.contributionDayRange)
    .max(28, strings.validation.contributionDayRange),
});

export default function CreateFundModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form] = Form.useForm();
  const [formError, setFormError] = useState<string | null>(null);
  const createFund = useCreateFund();

  // contribution_day is a Gregorian day (1–28); we surface its Jalali possibilities and a
  // recommendation so the user understands the calendar relationship (ADR 0004, display-only).
  const recommended = useMemo(() => recommendedContributionDay(), []);
  const dayOptions = useMemo(
    () => Array.from({ length: 28 }, (_, i) => ({ value: i + 1, label: formatNumber(i + 1) })),
    [],
  );
  const selectedDay = Form.useWatch("contribution_day", form) as number | undefined;
  const possibilities = useMemo(
    () => (typeof selectedDay === "number" ? jalaliDayPossibilities(selectedDay) : []),
    [selectedDay],
  );

  const close = () => {
    form.resetFields();
    setFormError(null);
    onClose();
  };

  const onFinish = (values: unknown) => {
    setFormError(null);
    const parsed = schema.safeParse(values);
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
        <Form.Item
          name="name"
          label={strings.funds.nameLabel}
          rules={[{ required: true, message: strings.validation.nameRequired }]}
        >
          <Input autoFocus />
        </Form.Item>

        <Form.Item
          name="monthly_share_amount"
          label={strings.funds.monthlyShareLabel}
          rules={[{ required: true, message: strings.validation.amountRequired }]}
        >
          <MoneyInput />
        </Form.Item>

        <Form.Item
          name="default_loan_amount"
          label={strings.funds.defaultLoanLabel}
          rules={[{ required: true, message: strings.validation.amountRequired }]}
        >
          <MoneyInput />
        </Form.Item>

        <Form.Item
          name="default_installment_count"
          label={strings.funds.installmentCountLabel}
          rules={[{ required: true, message: strings.validation.countMin }]}
        >
          <NumberInput />
        </Form.Item>

        <Form.Item
          name="contribution_day"
          label={strings.funds.contributionDayLabel}
          initialValue={recommended.day}
          extra={strings.funds.contributionDayGregorianNote}
          rules={[{ required: true, message: strings.validation.contributionDayRange }]}
        >
          <Select options={dayOptions} />
        </Form.Item>

        <div style={{ marginTop: -12, marginBottom: 16, lineHeight: 1.8 }}>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {strings.funds.contributionDayRecommend(formatNumber(recommended.day))}
            </Text>
          </div>
          {possibilities.length > 0 && typeof selectedDay === "number" && (
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {strings.funds.contributionDayPossibilities(
                  formatNumber(selectedDay),
                  possibilities.map(formatNumber).join("، "),
                )}
              </Text>
            </div>
          )}
          {wrapsJalaliMonth(possibilities) && (
            <div>
              <Text type="warning" style={{ fontSize: 12 }}>
                {strings.funds.contributionDayWrapWarning}
              </Text>
            </div>
          )}
        </div>
      </Form>
    </Modal>
  );
}
