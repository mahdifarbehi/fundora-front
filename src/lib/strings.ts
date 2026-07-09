// Single home for all user-facing Persian strings (ADR 0003 — Persian-only, no i18n
// runtime). Import from here instead of hardcoding Persian in components, so every
// string is in one place and easy to review/change.

export const strings = {
  appName: "فاندورا",
  tagline: "پنل مدیریت صندوق خانوادگی",

  auth: {
    loginTitle: "ورود به فاندورا",
    registerTitle: "ساخت حساب کاربری",
    phoneLabel: "شماره موبایل",
    phonePlaceholder: "۰۹۱۲۰۰۰۰۰۰۰",
    fullNameLabel: "نام و نام خانوادگی",
    passwordLabel: "گذرواژه",
    submit: "ورود",
    registerSubmit: "ثبت‌نام",
    logout: "خروج",
    loadingSession: "در حال بررسی نشست…",
    welcome: (name: string) => `خوش آمدید، ${name}`,
    toRegister: "حساب ندارید؟ ثبت‌نام کنید",
    toLogin: "حساب دارید؟ وارد شوید",
  },

  home: {
    title: "داشبورد",
    placeholder: "به‌زودی: فهرست صندوق‌ها",
  },

  // Field-level validation messages (used by Zod schemas).
  validation: {
    phoneRequired: "شماره موبایل الزامی است.",
    phoneInvalid: "شماره موبایل معتبر نیست (مثال: ۰۹۱۲۰۰۰۰۰۰۰).",
    passwordRequired: "گذرواژه الزامی است.",
    passwordTooShort: "گذرواژه باید حداقل ۸ نویسه باشد.",
  },

  // Per-field API error codes → Persian (FRONTEND_API §2.2 / §4.1). Shown under the field.
  fieldErrors: {
    required: "این فیلد الزامی است.",
    blank: "این فیلد نمی‌تواند خالی باشد.",
    null: "این فیلد الزامی است.",
    invalid: "مقدار نامعتبر است.",
    max_length: "طول مقدار بیش از حد مجاز است.",
    already_registered: "این شماره قبلاً ثبت شده است. وارد شوید.",
    password_too_short: "گذرواژه بیش از حد کوتاه است.",
    password_too_common: "گذرواژه بیش از حد ساده و رایج است.",
    password_too_similar: "گذرواژه به اطلاعات شخصی شما شبیه است.",
    password_entirely_numeric: "گذرواژه نمی‌تواند فقط عدد باشد.",
  } as Record<string, string>,

  // Map of API error `code` → human Persian message. Extended in later phases (the full
  // error-mapping table is formalized in Phase 7).
  errors: {
    NO_ACTIVE_ACCOUNT: "شماره موبایل یا گذرواژه اشتباه است.",
    NOT_AUTHENTICATED: "برای ادامه باید وارد شوید.",
    TOKEN_NOT_VALID: "نشست شما منقضی شده است. دوباره وارد شوید.",
    PERMISSION_DENIED: "به این بخش دسترسی ندارید.",
    NOT_FOUND: "موردی یافت نشد.",
    NETWORK_ERROR: "خطای ارتباط با سرور. اتصال را بررسی کنید.",
    UNKNOWN: "خطای ناشناخته رخ داد.",
  } as Record<string, string>,
} as const;

/** Look up a Persian message for an API error code, falling back to a generic message. */
export function errorMessage(code: string): string {
  return strings.errors[code] ?? strings.errors.UNKNOWN;
}

/** Look up a Persian message for a per-field API error code (FRONTEND_API §2.2). */
export function fieldErrorMessage(code: string): string {
  return strings.fieldErrors[code] ?? strings.errors.UNKNOWN;
}
