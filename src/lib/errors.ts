import axios from "axios";

// Every backend error carries a stable machine-readable `code` (FRONTEND_API §2).
// We normalize any thrown error — axios/network/unknown — into one ApiError shape so
// callers branch on `code`, never on HTTP status strings or message text.

// A non-exhaustive list of codes we branch on; `string` keeps unknown codes usable.
export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_AUTHENTICATED"
  | "TOKEN_NOT_VALID"
  | "NO_ACTIVE_ACCOUNT"
  | "PERMISSION_DENIED"
  | "NOT_FOUND"
  | "MEMBER_ALREADY_EXISTS"
  | "WALLET_OVERDRAFT"
  | "NETWORK_ERROR"
  | "UNKNOWN"
  | (string & {});

/** Per-field validation codes, e.g. { share_count: ["min_value"] } (FRONTEND_API §2.2). */
export type FieldErrors = Record<string, string[]>;

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status?: number;
  readonly fields?: FieldErrors;
  /** Extra context keys the backend attaches to a domain error (e.g. `requested`, `balance`). */
  readonly context: Record<string, unknown>;

  constructor(args: {
    code: ApiErrorCode;
    status?: number;
    fields?: FieldErrors;
    context?: Record<string, unknown>;
  }) {
    super(args.code);
    this.name = "ApiError";
    this.code = args.code;
    this.status = args.status;
    this.fields = args.fields;
    this.context = args.context ?? {};
  }
}

/** Derive a stable code from the HTTP status when the body carries no `code`. */
function statusFallbackCode(status: number | undefined): ApiErrorCode {
  switch (status) {
    case 401:
      return "NOT_AUTHENTICATED";
    case 403:
      return "PERMISSION_DENIED";
    case 404:
      return "NOT_FOUND";
    default:
      return "UNKNOWN";
  }
}

/** Turn any caught value into an ApiError by reading the backend's `code` body. */
export function normalizeError(err: unknown): ApiError {
  if (err instanceof ApiError) return err;

  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    const data = err.response?.data as Record<string, unknown> | undefined;

    // No response body → the request never reached the API (offline, proxy down, CORS).
    if (!err.response || data == null || typeof data !== "object") {
      return new ApiError({ code: "NETWORK_ERROR", status });
    }

    const { code, fields, ...context } = data as {
      code?: string;
      fields?: FieldErrors;
    };
    // Most errors carry a machine `code`, but some DRF defaults (e.g. a get_object_or_404
    // returns `{"detail": ...}` with no code) don't — fall back to the HTTP status so
    // callers can still branch on NOT_FOUND / PERMISSION_DENIED / NOT_AUTHENTICATED.
    return new ApiError({
      code: code ?? statusFallbackCode(status),
      status,
      fields: fields,
      context,
    });
  }

  return new ApiError({ code: "UNKNOWN" });
}
