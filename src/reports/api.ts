import { api } from "../lib/client";

// The monthly report is a custom action; drf-spectacular mistypes its response as `Fund` and
// drops the query param, so these are hand-written from FRONTEND_API §5.6.
export interface MemberBalance {
  member_id: number;
  balance: number;
}

export interface MonthlyReport {
  period_start: string; // YYYY-MM-DD
  expected_contributions: number;
  received_contributions: number;
  active_loan_total: number;
  active_loan_count: number;
  member_balances: MemberBalance[];
}

/** GET /api/funds/{id}/reports/monthly/?period_start=YYYY-MM-DD — one billing period's summary. */
export async function getMonthlyReport(
  fundId: string,
  periodStart: string,
): Promise<MonthlyReport> {
  const { data } = await api.get<MonthlyReport>(`/funds/${fundId}/reports/monthly/`, {
    params: { period_start: periodStart },
  });
  return data;
}
