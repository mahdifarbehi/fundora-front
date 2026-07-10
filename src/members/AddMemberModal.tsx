import { useState } from "react";
import { Alert, Form, Input, Modal, Select, message } from "antd";
import { z } from "zod";
import { useAddMember } from "./hooks";
import { applyZodErrors, applyApiFieldErrors } from "../lib/zodForm";
import { normalizeDigits, toEnglishDigits, toPersianDigits } from "../lib/digits";
import NumberInput from "../components/NumberInput";
import { ApiError } from "../lib/errors";
import { errorMessage, strings } from "../lib/strings";

const schema = z.object({
  phone: z
    .string()
    .min(1, strings.validation.phoneRequired)
    .regex(/^09\d{9}$/, strings.validation.phoneInvalid),
  full_name: z.string().optional().default(""),
  share_count: z.coerce
    .number()
    .int(strings.validation.integerRequired)
    .min(1, strings.validation.shareCountMin),
  cards: z.array(z.string()).optional(),
});

export default function AddMemberModal({
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
  const addMember = useAddMember(fundId);

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
    // Cards are English/numeric — normalize each to ASCII and drop empties (ADR 0007).
    const cards = (parsed.data.cards ?? [])
      .map((c) => toEnglishDigits(c).replace(/\D/g, ""))
      .filter(Boolean);

    addMember.mutate(
      {
        phone: parsed.data.phone,
        full_name: parsed.data.full_name,
        share_count: parsed.data.share_count,
        ...(cards.length > 0 ? { cards } : {}),
      },
      {
        onSuccess: () => {
          message.success(strings.members.addSuccess);
          close();
        },
        onError: (err) => {
          if (err instanceof ApiError) {
            if (applyApiFieldErrors(form, err)) return;
            // MEMBER_ALREADY_EXISTS carries a `phone` — surface it on the phone field.
            if (err.code === "MEMBER_ALREADY_EXISTS") {
              form.setFields([{ name: "phone", errors: [errorMessage(err.code)] }]);
              return;
            }
            // CARD_ALREADY_REGISTERED carries the conflicting `number` — surface on the cards field.
            if (err.code === "CARD_ALREADY_REGISTERED") {
              const number = typeof err.context.number === "string" ? err.context.number : "";
              const msg = number
                ? `${errorMessage(err.code)} (${toPersianDigits(number)})`
                : errorMessage(err.code);
              form.setFields([{ name: "cards", errors: [msg] }]);
              return;
            }
            setFormError(errorMessage(err.code));
          } else {
            setFormError(errorMessage("UNKNOWN"));
          }
        },
      },
    );
  };

  return (
    <Modal
      open={open}
      title={strings.members.addTitle}
      okText={strings.members.submit}
      cancelText={strings.members.cancel}
      confirmLoading={addMember.isPending}
      onOk={() => form.submit()}
      onCancel={close}
      destroyOnHidden
    >
      {formError && <Alert type="error" message={formError} showIcon style={{ marginBottom: 16 }} />}

      <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false}>
        <Form.Item
          name="phone"
          label={strings.auth.phoneLabel}
          normalize={normalizeDigits}
          rules={[{ required: true, message: strings.validation.phoneRequired }]}
        >
          <Input inputMode="numeric" placeholder={strings.auth.phonePlaceholder} autoFocus />
        </Form.Item>

        <Form.Item name="full_name" label={strings.auth.fullNameLabel}>
          <Input />
        </Form.Item>

        <Form.Item
          name="share_count"
          label={strings.members.shareCountLabel}
          initialValue="1"
          rules={[{ required: true, message: strings.validation.shareCountMin }]}
        >
          <NumberInput />
        </Form.Item>

        <Form.Item name="cards" label={strings.members.cardsLabel} extra={strings.members.cardsHelp}>
          <Select mode="tags" tokenSeparators={[",", " "]} open={false} suffixIcon={null} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
