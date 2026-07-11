import { api } from "../lib/client";
import type { components } from "../lib/api-types";
import type { Paginated, PageParams } from "../lib/pagination";
import type { WalletTransaction } from "../wallets/api";

// Read models come straight from the generated schema (they're accurate for GET).
export type Loan = components["schemas"]["Loan"];
export type Installment = components["schemas"]["Installment"];
export type LoanStatus = components["schemas"]["LoanStatusEnum"];
export type InstallmentStatus = components["schemas"]["InstallmentStatusEnum"];

// The create body is hand-written: drf-spectacular reuses the read-only `Loan` schema for POST,
// which has `member` (read-only) instead of the writable `member_id` and doesn't mark the
// default-backed fields optional (FRONTEND_API §7.2). Same generated-schema mismatch as members.
export interface CreateLoanInput {
  member_id: number;
  loan_amount?: number;
  installment_count?: number;
  installments_to_generate?: number;
  issue_date?: string; // YYYY-MM-DD
}

/** GET /api/funds/{fundId}/loans/ — loans in a fund (paginated, newest first, installments inlined). */
export async function listLoans(
  fundId: string,
  params: PageParams = {},
): Promise<Paginated<Loan>> {
  const { data } = await api.get<Paginated<Loan>>(`/funds/${fundId}/loans/`, { params });
  return data;
}

/** POST /api/funds/{fundId}/loans/ — create a loan; the backend generates its installment dues. */
export async function createLoan(fundId: string, input: CreateLoanInput): Promise<Loan> {
  const { data } = await api.post<Loan>(`/funds/${fundId}/loans/`, input);
  return data;
}

/** GET /api/loans/{id}/ — one loan with its ordered installments. */
export async function getLoan(loanId: string): Promise<Loan> {
  const { data } = await api.get<Loan>(`/loans/${loanId}/`);
  return data;
}

/**
 * POST /api/dues/{id}/reverse-payment/ — undo a paid installment (FRONTEND_API §8.1). Credits the
 * member's wallet with a PAYMENT_REVERSAL and can flip a COMPLETED loan back to ACTIVE. Does NOT
 * re-run settlement.
 */
export async function reverseDuePayment(
  dueId: number,
  description?: string,
): Promise<WalletTransaction> {
  const { data } = await api.post<WalletTransaction>(`/dues/${dueId}/reverse-payment/`, {
    description: description ?? "",
  });
  return data;
}
