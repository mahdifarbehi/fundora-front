import { useState } from "react";
import { Alert, Button, Card, Flex, Form, Input, Typography } from "antd";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "./AuthContext";
import { applyZodErrors } from "../lib/zodForm";
import { normalizeDigits } from "../lib/digits";
import { ApiError } from "../lib/errors";
import { errorMessage, strings } from "../lib/strings";

const { Title } = Typography;

// Zod is the source of truth for the submit-time contract (locked decision). Iranian
// mobile numbers are 09 + 9 digits. Password is only required-non-empty here — the backend
// owns password strength (we don't want to reject a valid short existing password).
const loginSchema = z.object({
  phone: z
    .string()
    .min(1, strings.validation.phoneRequired)
    .regex(/^09\d{9}$/, strings.validation.phoneInvalid),
  password: z.string().min(1, strings.validation.passwordRequired),
});

type LoginValues = z.infer<typeof loginSchema>;

interface FromState {
  from?: { pathname: string };
}

export default function LoginPage() {
  const [form] = Form.useForm<LoginValues>();
  const { status, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const from = (location.state as FromState | null)?.from?.pathname ?? "/";

  // Already signed in? Skip the login screen entirely.
  if (status === "authed") return <Navigate to={from} replace />;

  const onFinish = async (values: LoginValues) => {
    setFormError(null);
    const parsed = loginSchema.safeParse(values);
    if (!parsed.success) {
      applyZodErrors(form, parsed.error); // inline errors, before any network call
      return;
    }
    setSubmitting(true);
    try {
      await signIn(parsed.data.phone, parsed.data.password);
      navigate(from, { replace: true });
    } catch (err) {
      // Surface the backend's machine code as a Persian message (e.g. NO_ACTIVE_ACCOUNT).
      const code = err instanceof ApiError ? err.code : "UNKNOWN";
      setFormError(errorMessage(code));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Flex align="center" justify="center" style={{ minHeight: "100vh" }}>
      <Card style={{ width: 360 }}>
        <Flex vertical align="center" style={{ marginBottom: 16 }}>
          <Title level={3} style={{ margin: 0 }}>
            {strings.auth.loginTitle}
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

          <Form.Item
            name="password"
            label={strings.auth.passwordLabel}
            rules={[{ required: true, message: strings.validation.passwordRequired }]}
          >
            <Input.Password />
          </Form.Item>

          <Button type="primary" htmlType="submit" block loading={submitting}>
            {strings.auth.submit}
          </Button>
        </Form>

        <Flex justify="center" style={{ marginTop: 16 }}>
          <Link to="/register">{strings.auth.toRegister}</Link>
        </Flex>
      </Card>
    </Flex>
  );
}
