import { useState } from "react";
import { Alert, Button, Card, Flex, Form, Input, Typography } from "antd";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "./AuthContext";
import { register } from "./api";
import { applyZodErrors, applyApiFieldErrors } from "../lib/zodForm";
import { normalizeDigits } from "../lib/digits";
import { ApiError } from "../lib/errors";
import { errorMessage, strings } from "../lib/strings";

const { Title } = Typography;

// Public self-registration for end users who want to create a fund (FRONTEND_API §4.1).
// Django owns full password strength; we do a cheap min-8 client check and let the rest
// (too_common / too_similar / entirely_numeric) come back as per-field API errors.
const registerSchema = z.object({
  phone: z
    .string()
    .min(1, strings.validation.phoneRequired)
    .regex(/^09\d{9}$/, strings.validation.phoneInvalid),
  full_name: z.string().optional().default(""),
  password: z.string().min(8, strings.validation.passwordTooShort),
});

type RegisterValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [form] = Form.useForm<RegisterValues>();
  const { status, signIn } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Already signed in? No reason to be on the register screen.
  if (status === "authed") return <Navigate to="/" replace />;

  const onFinish = async (values: RegisterValues) => {
    setFormError(null);
    const parsed = registerSchema.safeParse(values);
    if (!parsed.success) {
      applyZodErrors(form, parsed.error);
      return;
    }
    setSubmitting(true);
    try {
      // register() creates/activates the account but does not log in; sign in right after
      // so the new user lands straight in the app.
      await register(parsed.data.phone, parsed.data.password, parsed.data.full_name);
      await signIn(parsed.data.phone, parsed.data.password);
      navigate("/", { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        // Per-field errors (already_registered, password_too_short, …) go inline; anything
        // else becomes a form-level message.
        const placed = applyApiFieldErrors(form, err);
        if (!placed) setFormError(errorMessage(err.code));
      } else {
        setFormError(errorMessage("UNKNOWN"));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Flex align="center" justify="center" style={{ minHeight: "100vh" }}>
      <Card style={{ width: 360 }}>
        <Flex vertical align="center" style={{ marginBottom: 16 }}>
          <Title level={3} style={{ margin: 0 }}>
            {strings.auth.registerTitle}
          </Title>
        </Flex>

        {formError && (
          <Alert type="error" message={formError} showIcon style={{ marginBottom: 16 }} />
        )}

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
            name="password"
            label={strings.auth.passwordLabel}
            rules={[{ required: true, message: strings.validation.passwordRequired }]}
          >
            <Input.Password />
          </Form.Item>

          <Button type="primary" htmlType="submit" block loading={submitting}>
            {strings.auth.registerSubmit}
          </Button>
        </Form>

        <Flex justify="center" style={{ marginTop: 16 }}>
          <Link to="/login">{strings.auth.toLogin}</Link>
        </Flex>
      </Card>
    </Flex>
  );
}
