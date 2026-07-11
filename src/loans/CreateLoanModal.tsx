import { useState } from "react";
import { Alert, Form, Modal, Select, message } from "antd";
import { z } from "zod";
import { useCreateLoan } from "./hooks";
import type { CreateLoanInput } from "./api";
import { useMembers } from "../members/hooks";
import { useFund } from "../funds/hooks";
import { applyApiFieldErrors, applyZodErrors } from "../lib/zodForm";
import MoneyInput from "../components/MoneyInput";
import NumberInput from "../components/NumberInput";
import JalaliDateTimeInput from "../components/JalaliDateTimeInput";
import { formatNumber, formatToman } from "../lib/money";
import { toPersianDigits } from "../lib/digits";
import { isoToDateOnly } from "../lib/jalali";
import { ApiError } from "../lib/errors";
import { errorMessage, strings } from "../lib/strings";

// Empty numeric inputs mean "use the fund default" (§7.2), so coerce "" → undefined rather than 0.
const optionalPositiveInt = z.preprocess(
  (v) => (v === "" || v == null ? undefined : v),
  z.coerce.number().int(strings.validation.integerRequired).min(1, strings.validation.countMin).optional(),
);

const schema = z.object({
  member_id: z.number({ message: strings.loans.memberRequired }),
  loan_amount: optionalPositiveInt,
  installment_count: optionalPositiveInt,
  installments_to_generate: optionalPositiveInt,
});

export default function CreateLoanModal({
  fundId,
  open,
  onClose,
}: {
  fundId: string;
  open: boolean;
  onClose: () => void;
}) {
  const [form] = Form.useForm();
  const [formError, setFormError] = useState<string | null>(null);
  const { data: membersData, isLoading: membersLoading } = useMembers(fundId);
  const { data: fund } = useFund(fundId);
  const create = useCreateLoan(fundId);

  const close = () => {
    form.resetFields();
    setFormError(null);
    onClose();
  };

  const memberOptions = (membersData?.results ?? []).map((m) => ({
    value: m.id,
    label: m.user_full_name || toPersianDigits(m.user_phone),
  }));

  const onFinish = (values: { issue_date?: string } & Record<string, unknown>) => {
    setFormError(null);
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      applyZodErrors(form, parsed.error);
      return;
    }

    const issueDate = isoToDateOnly(values.issue_date);
    const input: CreateLoanInput = {
      member_id: parsed.data.member_id,
      ...(parsed.data.loan_amount != null ? { loan_amount: parsed.data.loan_amount } : {}),
      ...(parsed.data.installment_count != null
        ? { installment_count: parsed.data.installment_count }
        : {}),
      ...(parsed.data.installments_to_generate != null
        ? { installments_to_generate: parsed.data.installments_to_generate }
        : {}),
      ...(issueDate ? { issue_date: issueDate } : {}),
    };

    create.mutate(input, {
      onSuccess: () => {
        message.success(strings.loans.createSuccess);
        close();
      },
      onError: (err) => {
        const apiErr = err instanceof ApiError ? err : null;
        // INSTALLMENTS_TO_GENERATE_EXCEEDS_COUNT / LOAN_AMOUNT_TOO_SMALL are form-level; a
        // VALIDATION_ERROR's fields (e.g. member_id) render inline.
        if (apiErr && applyApiFieldErrors(form, apiErr)) return;
        setFormError(errorMessage(apiErr?.code ?? "UNKNOWN"));
      },
    });
  };

  return (
    <Modal
      open={open}
      title={strings.loans.addTitle}
      okText={strings.loans.submit}
      cancelText={strings.loans.cancel}
      confirmLoading={create.isPending}
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
        initialValues={{ issue_date: new Date().toISOString() }}
      >
        <Form.Item
          name="member_id"
          label={strings.loans.memberLabel}
          rules={[{ required: true, message: strings.loans.memberRequired }]}
        >
          <Select
            placeholder={strings.loans.memberPlaceholder}
            options={memberOptions}
            loading={membersLoading}
            showSearch
            optionFilterProp="label"
          />
        </Form.Item>

        <Form.Item
          name="loan_amount"
          label={strings.loans.amountLabel}
          extra={fund && strings.loans.optionalDefaultHelp(formatToman(fund.default_loan_amount))}
        >
          <MoneyInput />
        </Form.Item>

        <Form.Item
          name="installment_count"
          label={strings.loans.installmentCountLabel}
          extra={fund && strings.loans.optionalDefaultHelp(formatNumber(fund.default_installment_count))}
        >
          <NumberInput />
        </Form.Item>

        <Form.Item
          name="installments_to_generate"
          label={strings.loans.installmentsToGenerateLabel}
          extra={strings.loans.installmentsToGenerateHelp}
        >
          <NumberInput />
        </Form.Item>

        <Form.Item name="issue_date" label={strings.loans.issueDateLabel}>
          <JalaliDateTimeInput />
        </Form.Item>
      </Form>
    </Modal>
  );
}
