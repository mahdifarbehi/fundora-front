import { z } from "zod";
import { strings } from "../lib/strings";

// Shared by create (§5.2) and edit (§5.4). Money + counts are typed as text (Persian digits
// normalize to ASCII, ADR 0007) and coerced to integers; contribution_day is 1–28 (§5).
export const fundSchema = z.object({
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

export type FundFormValues = z.infer<typeof fundSchema>;
