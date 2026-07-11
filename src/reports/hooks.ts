import { useQuery } from "@tanstack/react-query";
import { getMonthlyReport } from "./api";

export const reportKeys = {
  monthly: (fundId: string, periodStart: string) =>
    ["funds", fundId, "reports", "monthly", periodStart] as const,
};

/** The monthly report for a chosen period. Disabled until a period is picked. */
export function useMonthlyReport(fundId: string, periodStart: string | undefined) {
  return useQuery({
    queryKey: reportKeys.monthly(fundId, periodStart ?? ""),
    queryFn: () => getMonthlyReport(fundId, periodStart!),
    enabled: !!periodStart,
  });
}
