import { Alert } from "antd";
import type { CSSProperties } from "react";
import { ApiError } from "../lib/errors";
import { errorMessage } from "../lib/strings";

/**
 * The one way to render a failed query/mutation as a readable Persian message: map the backend
 * `code` (or a generic fallback for non-ApiError throws) through the central error table. Replaces
 * the inline `<Alert message={errorMessage(error instanceof ApiError ? …)} />` copied across pages.
 */
export default function ApiErrorAlert({
  error,
  style,
}: {
  error: unknown;
  style?: CSSProperties;
}) {
  const code = error instanceof ApiError ? error.code : "UNKNOWN";
  return <Alert type="error" showIcon message={errorMessage(code)} style={style} />;
}
