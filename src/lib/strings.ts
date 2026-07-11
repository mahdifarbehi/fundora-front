// Single home for all user-facing Persian strings (ADR 0003 — Persian-only, no i18n
// runtime). Import from here instead of hardcoding Persian in components, so every
// string is in one place and easy to review/change.

export const strings = {
  appName: "فاندورا",
  tagline: "پنل مدیریت صندوق خانوادگی",

  jalaliMonths: [
    "فروردین",
    "اردیبهشت",
    "خرداد",
    "تیر",
    "مرداد",
    "شهریور",
    "مهر",
    "آبان",
    "آذر",
    "دی",
    "بهمن",
    "اسفند",
  ],

  dateInput: { day: "روز", month: "ماه", year: "سال", hour: "ساعت", minute: "دقیقه", second: "ثانیه" },

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
    sessionExpired: "نشست شما منقضی شد. لطفاً دوباره وارد شوید.",
  },

  // Global crash fallback (React error boundary — non-API render errors).
  errorBoundary: {
    title: "خطایی رخ داد",
    body: "مشکلی پیش‌بینی‌نشده پیش آمد. صفحه را دوباره بارگذاری کنید.",
    reload: "بارگذاری مجدد",
    home: "بازگشت به خانه",
  },

  funds: {
    title: "صندوق‌ها",
    create: "ایجاد صندوق",
    createTitle: "ایجاد صندوق جدید",
    empty: "هنوز صندوقی نساخته‌اید.",
    colName: "نام صندوق",
    colMonthlyShare: "سهم ماهانه",
    colDefaultLoan: "وام پیش‌فرض",
    colInstallmentCount: "اقساط پیش‌فرض",
    colContributionDay: "روز واریز (میلادی)",
    tableJalaliLands: (listFa: string) => `شمسی: ${listFa}`,
    dayHintTooltip:
      "این روز بر اساس تقویم میلادی است و در طول سال روی این روزهای ماه شمسی می‌افتد.",
    nameLabel: "نام صندوق",
    monthlyShareLabel: "مبلغ سهم ماهانه (تومان)",
    defaultLoanLabel: "مبلغ وام پیش‌فرض (تومان)",
    installmentCountLabel: "تعداد اقساط پیش‌فرض",
    contributionDayLabel: "روز واریز ماهانه (میلادی، ۱ تا ۲۸)",
    contributionDayGregorianNote:
      "این روز بر اساس تقویم میلادی است، چون محاسبات سیستم میلادی انجام می‌شود.",
    contributionDayRecommend: (dayFa: string) =>
      `پیشنهاد ما: روز ${dayFa} — تا واریز تقریباً ابتدای ماه شمسی بیفتد.`,
    contributionDayPossibilities: (dayFa: string, listFa: string) =>
      `روز ${dayFa} میلادی در طول سال روی این روزهای ماه شمسی می‌افتد: ${listFa}`,
    contributionDayWrapWarning:
      "توجه: این روز نزدیک مرز ماه شمسی است و در برخی ماه‌ها به روزهای پایانی ماه شمسی (۲۹/۳۰/۳۱) می‌افتد.",
    submit: "ایجاد",
    cancel: "انصراف",
    createSuccess: "صندوق با موفقیت ایجاد شد.",
    switcherPlaceholder: "انتخاب صندوق",
    open: "باز کردن",
    // Edit settings (§5.4)
    editTitle: "ویرایش تنظیمات صندوق",
    editSubmit: "ذخیره",
    editSuccess: "تنظیمات صندوق به‌روزرسانی شد.",
    settingsFutureNote:
      "تغییر تنظیمات فقط روی عملیات آینده اثر دارد؛ وام‌ها و بدهی‌های موجود تغییر نمی‌کنند.",
  },

  overview: {
    title: "مشخصات صندوق",
    createdAt: "تاریخ ایجاد",
    notFound: "صندوق یافت نشد یا به شما تعلق ندارد.",
    back: "بازگشت به فهرست صندوق‌ها",
    editSettings: "ویرایش تنظیمات",
  },

  reports: {
    title: "گزارش ماهانه",
    periodLabel: "شروع دوره",
    periodHelp: "تاریخ شروع دوره‌ی صورت‌حساب را انتخاب کنید (روز واریز صندوق).",
    periodRequired: "شروع دوره را انتخاب کنید.",
    generate: "نمایش گزارش",
    emptyPrompt: "برای مشاهده‌ی گزارش، شروع دوره را انتخاب و «نمایش گزارش» را بزنید.",
    expectedContributions: "سهم‌های مورد انتظار",
    receivedContributions: "سهم‌های دریافت‌شده",
    activeLoanTotal: "مجموع وام‌های فعال",
    activeLoanCount: "تعداد وام‌های فعال",
    memberBalancesTitle: "موجودی اعضا",
    colMember: "عضو",
    colBalance: "موجودی",
    emptyBalances: "عضوی برای نمایش وجود ندارد.",
  },

  fundNav: {
    overview: "مشخصات",
    members: "اعضا",
    loans: "وام‌ها",
    bank: "بانک",
    reports: "گزارش",
  },

  bank: {
    title: "تراکنش‌های بانکی",
    record: "ثبت واریز",
    recordTitle: "ثبت واریز بانکی",
    amountLabel: "مبلغ (تومان)",
    datetimeLabel: "تاریخ و زمان واریز",
    fromCardLabel: "شماره کارت مبدأ",
    trackingLabel: "کد پیگیری (اختیاری)",
    noteLabel: "توضیح (اختیاری)",
    submit: "ثبت",
    cancel: "انصراف",
    matched: "به عضو تطبیق داده شد و کیف پول شارژ شد.",
    unmatched: "کارت با هیچ عضوی تطبیق نشد؛ در صف تطبیق دستی قرار گرفت.",
    empty: "هنوز تراکنشی ثبت نشده است.",
    colAmount: "مبلغ",
    colDate: "تاریخ واریز",
    colCard: "کارت مبدأ",
    colTracking: "کد پیگیری",
    colMember: "عضو",
    colStatus: "وضعیت",
    statusCharged: "تطبیق و شارژ شد",
    statusUnmatched: "بدون تطبیق",
    matchedTo: (name: string) => `به کیف پول «${name}» واریز و تطبیق شد.`,

    // Tabs + unmatched queue (Phase 9)
    tabAll: "همه تراکنش‌ها",
    tabUnmatched: "بدون تطبیق",
    unmatchedEmpty: "تراکنش بدون تطبیقی وجود ندارد.",
    unmatchedHint:
      "این واریزی‌ها با هیچ عضوی تطبیق نشدند. یک عضو را دستی تخصیص دهید، یا پس از افزودن کارت عضو، تطبیق را دوباره اجرا کنید.",
    colActions: "عملیات",
    assign: "تخصیص عضو",
    rematch: "تطبیق مجدد",
    assignTitle: "تخصیص عضو به واریزی",
    assignMemberLabel: "عضو",
    assignMemberPlaceholder: "یک عضو را انتخاب کنید",
    assignSubmit: "تخصیص و شارژ",
    assignSuccess: (name: string) => `واریزی به «${name}» تخصیص و کیف پولش شارژ شد.`,
    rematchMatched: (name: string) => `تطبیق داده شد: به «${name}» شارژ شد.`,
    rematchStillUnmatched: "هنوز کارتی برای این واریزی پیدا نشد؛ بدون تطبیق ماند.",
    assignMemberRequired: "انتخاب عضو الزامی است.",
  },

  wallet: {
    title: "کیف پول",
    of: (name: string) => `کیف پول ${name}`,
    unknownMember: (idFa: string) => `عضو #${idFa}`,
    balance: "موجودی",
    empty: "تراکنشی ثبت نشده است.",
    colAmount: "مبلغ",
    colType: "نوع",
    colDescription: "توضیحات",
    colDate: "تاریخ",
    back: "بازگشت به اعضا",
    direction: { CREDIT: "بستانکار", DEBIT: "بدهکار" } as Record<string, string>,
    txnType: {
      DEPOSIT: "واریز بانکی",
      CONTRIBUTION_PAYMENT: "پرداخت سهم",
      INSTALLMENT_PAYMENT: "پرداخت قسط",
      ADJUSTMENT: "اصلاح دستی",
      PAYMENT_REVERSAL: "برگشت پرداخت",
    } as Record<string, string>,

    // Manual adjustment (§6.6)
    adjust: "اصلاح دستی",
    adjustTitle: "اصلاح دستی کیف پول",
    adjustAmountLabel: "مبلغ",
    adjustDirectionLabel: "نوع اصلاح",
    adjustCredit: "افزایش موجودی (بستانکار)",
    adjustDebit: "کاهش موجودی (بدهکار)",
    adjustDescriptionLabel: "توضیحات",
    adjustDescriptionPlaceholder: "علت اصلاح را بنویسید (الزامی).",
    adjustSubmit: "ثبت اصلاح",
    adjustSuccessCredit: "موجودی افزایش یافت.",
    adjustSuccessDebit: "موجودی کاهش یافت.",
    cancel: "انصراف",

    // Manual settle (§6.7)
    settle: "تسویه دستی",
    settleConfirmTitle: "اجرای تسویه دستی؟",
    settleConfirmBody: "بدهی‌های در انتظار از قدیمی‌ترین تا جایی که موجودی اجازه دهد پرداخت می‌شود.",
    settleConfirmOk: "اجرای تسویه",
    settlePaid: (countFa: string) => `${countFa} بدهی تسویه شد.`,
    settleNothing: "بدهی قابل تسویه‌ای نبود (موجودی کافی نیست یا بدهی در انتظاری وجود ندارد).",
  },

  loans: {
    title: "وام‌ها",
    add: "ثبت وام",
    addTitle: "ثبت وام جدید",
    empty: "هنوز وامی ثبت نشده است.",
    colMember: "عضو",
    colAmount: "مبلغ وام",
    colInstallments: "اقساط",
    // "paid / total", e.g. ۳ / ۱۰
    installmentsProgress: (paidFa: string, totalFa: string) => `${paidFa} / ${totalFa}`,
    colIssueDate: "تاریخ پرداخت",
    colStatus: "وضعیت",
    status: { ACTIVE: "فعال", COMPLETED: "تسویه‌شده" } as Record<string, string>,
    cancel: "انصراف",

    // Create-loan form
    memberLabel: "عضو",
    memberPlaceholder: "انتخاب عضو",
    memberRequired: "انتخاب عضو الزامی است.",
    amountLabel: "مبلغ وام",
    installmentCountLabel: "تعداد کل اقساط",
    installmentsToGenerateLabel: "تعداد اقساط قابل ایجاد",
    installmentsToGenerateHelp:
      "برای وامی که از قبل شروع شده؛ خالی بگذارید تا برابر تعداد کل اقساط شود.",
    issueDateLabel: "تاریخ پرداخت وام",
    optionalDefaultHelp: (valueFa: string) => `خالی بگذارید تا از پیش‌فرض صندوق (${valueFa}) استفاده شود.`,
    submit: "ثبت وام",
    createSuccess: "وام ثبت شد.",

    // Loan detail
    detailTitle: (idFa: string) => `وام #${idFa}`,
    back: "بازگشت به وام‌ها",
    infoMember: "عضو",
    infoAmount: "مبلغ وام",
    infoInstallmentCount: "تعداد کل اقساط",
    infoGenerated: "اقساط ایجادشده",
    infoIssueDate: "تاریخ پرداخت",
    infoStatus: "وضعیت",
    infoCreatedAt: "تاریخ ثبت",
    scheduleTitle: "برنامه اقساط",
    colNumber: "قسط",
    colDueDate: "سررسید",
    colInstAmount: "مبلغ",
    colInstStatus: "وضعیت",
    colPaidAt: "تاریخ پرداخت",
    instStatus: { PENDING: "در انتظار", PAID: "پرداخت‌شده" } as Record<string, string>,

    // Reverse a paid installment (§8.1)
    reverse: "برگشت پرداخت",
    reverseTitle: "برگشت پرداخت این قسط؟",
    reverseBody:
      "قسط به حالت «در انتظار» برمی‌گردد و مبلغ به کیف پول عضو بازگردانده می‌شود. تسویه دوباره اجرا نمی‌شود.",
    reverseDescLabel: "توضیحات (اختیاری)",
    reverseConfirm: "برگشت پرداخت",
    reverseSuccess: "پرداخت قسط برگشت خورد.",
  },

  members: {
    title: "اعضا",
    add: "افزودن عضو",
    addTitle: "افزودن عضو جدید",
    empty: "هنوز عضوی اضافه نشده است.",
    colName: "نام",
    colPhone: "شماره موبایل",
    colShareCount: "تعداد سهم",
    colCreatedAt: "تاریخ عضویت",
    noName: "—",
    shareCountLabel: "تعداد سهم",
    cardsLabel: "شماره کارت‌ها (اختیاری)",
    cardsHelp: "برای تطبیق خودکار واریزی‌های بانکی. هر شماره را وارد کنید و Enter بزنید.",
    submit: "افزودن",
    cancel: "انصراف",
    addSuccess: "عضو با موفقیت اضافه شد.",
  },

  // Field-level validation messages (used by Zod schemas).
  validation: {
    phoneRequired: "شماره موبایل الزامی است.",
    phoneInvalid: "شماره موبایل معتبر نیست (مثال: ۰۹۱۲۰۰۰۰۰۰۰).",
    passwordRequired: "گذرواژه الزامی است.",
    passwordTooShort: "گذرواژه باید حداقل ۸ نویسه باشد.",
    nameRequired: "نام صندوق الزامی است.",
    amountRequired: "مبلغ را وارد کنید.",
    amountMin: "مبلغ باید حداقل ۱ باشد.",
    integerRequired: "یک عدد صحیح وارد کنید.",
    countMin: "مقدار باید حداقل ۱ باشد.",
    contributionDayRange: "روز واریز باید بین ۱ تا ۲۸ باشد.",
    shareCountMin: "تعداد سهم باید حداقل ۱ باشد.",
    fromCardRequired: "شماره کارت مبدأ الزامی است.",
    datetimeRequired: "تاریخ و زمان واریز الزامی است.",
  },

  // Per-field API error codes → Persian (FRONTEND_API §2.2 / §4.1). Shown under the field.
  fieldErrors: {
    required: "این فیلد الزامی است.",
    blank: "این فیلد نمی‌تواند خالی باشد.",
    null: "این فیلد الزامی است.",
    invalid: "مقدار نامعتبر است.",
    max_length: "طول مقدار بیش از حد مجاز است.",
    min_value: "مقدار کمتر از حد مجاز است.",
    max_value: "مقدار بیشتر از حد مجاز است.",
    does_not_exist: "مورد انتخاب‌شده وجود ندارد.",
    already_registered: "این شماره قبلاً ثبت شده است. وارد شوید.",
    password_too_short: "گذرواژه بیش از حد کوتاه است.",
    password_too_common: "گذرواژه بیش از حد ساده و رایج است.",
    password_too_similar: "گذرواژه به اطلاعات شخصی شما شبیه است.",
    password_entirely_numeric: "گذرواژه نمی‌تواند فقط عدد باشد.",
  } as Record<string, string>,

  // Map of API error `code` → human Persian message. Extended in later phases (the full
  // error-mapping table is formalized in Phase 7).
  errors: {
    VALIDATION_ERROR: "برخی مقادیر واردشده نامعتبر است.",
    NO_ACTIVE_ACCOUNT: "شماره موبایل یا گذرواژه اشتباه است.",
    NOT_AUTHENTICATED: "برای ادامه باید وارد شوید.",
    TOKEN_NOT_VALID: "نشست شما منقضی شده است. دوباره وارد شوید.",
    PERMISSION_DENIED: "به این بخش دسترسی ندارید.",
    NOT_FOUND: "موردی یافت نشد.",
    MEMBER_ALREADY_EXISTS: "این شماره از قبل عضو این صندوق است.",
    CARD_ALREADY_REGISTERED: "این شماره کارت قبلاً برای شخص دیگری ثبت شده است.",
    BANK_TRANSACTION_ALREADY_CHARGED: "این واریزی قبلاً شارژ شده است.",
    WALLET_OVERDRAFT: "برداشت بیش از موجودی مجاز نیست؛ کیف پول نمی‌تواند منفی شود.",
    ADJUSTMENT_DESCRIPTION_REQUIRED: "نوشتن توضیحات الزامی است.",
    INSTALLMENTS_TO_GENERATE_EXCEEDS_COUNT: "تعداد اقساط قابل ایجاد نمی‌تواند از تعداد کل اقساط بیشتر باشد.",
    LOAN_AMOUNT_TOO_SMALL: "مبلغ وام باید از تعداد اقساط بیشتر باشد؛ در غیر این صورت قسط صفر ایجاد می‌شود.",
    DUE_NOT_PAID: "این قسط پرداخت نشده است؛ چیزی برای برگشت وجود ندارد.",
    NETWORK_ERROR: "خطای ارتباط با سرور. اتصال را بررسی کنید.",
    UNKNOWN: "خطای ناشناخته رخ داد.",
  } as Record<string, string>,

  // A WALLET_OVERDRAFT carries the attempted `requested` and current `balance` (both Toman) so we
  // can spell out why the debit was rejected.
  overdraftDetail: (requested: string, balance: string) =>
    `برداشت ${requested} بیش از موجودی فعلی (${balance}) است.`,
} as const;

/** Look up a Persian message for an API error code, falling back to a generic message. */
export function errorMessage(code: string): string {
  return strings.errors[code] ?? strings.errors.UNKNOWN;
}

/** Look up a Persian message for a per-field API error code (FRONTEND_API §2.2). */
export function fieldErrorMessage(code: string): string {
  return strings.fieldErrors[code] ?? strings.errors.UNKNOWN;
}
