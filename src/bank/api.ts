import { api } from "../lib/client";
import type { Paginated, PageParams } from "../lib/pagination";
import type { components } from "../lib/api-types";

export type BankTransaction = components["schemas"]["BankTransaction"];

/** GET /api/funds/{fundId}/bank-transactions/ — newest first, paginated (FRONTEND_API §9.1). */
export async function listBankTransactions(
  fundId: string,
  params: PageParams = {},
): Promise<Paginated<BankTransaction>> {
  const { data } = await api.get<Paginated<BankTransaction>>(
    `/funds/${fundId}/bank-transactions/`,
    { params },
  );
  return data;
}

// Writable fields for recording an incoming transfer (FRONTEND_API §9.2). The rest
// (matched_member, wallet_charged, id, created_at) are stamped by the backend.
export interface PostBankTransactionInput {
  amount: number;
  transfer_datetime: string; // ISO-8601 UTC (Gregorian on the wire — ADR 0004)
  from_card: string;
  tracking_code?: string;
  note?: string;
}

/** POST /api/funds/{fundId}/bank-transactions/ — record a transfer (auto-matches by card). */
export async function postBankTransaction(
  fundId: string,
  input: PostBankTransactionInput,
): Promise<BankTransaction> {
  const { data } = await api.post<BankTransaction>(`/funds/${fundId}/bank-transactions/`, input);
  return data;
}

/**
 * GET /api/funds/{fundId}/bank-transactions/unmatched/ — the manual-assignment queue
 * (transactions with `matched_member == null`), newest first, paginated (FRONTEND_API §9.3).
 */
export async function listUnmatchedBankTransactions(
  fundId: string,
  params: PageParams = {},
): Promise<Paginated<BankTransaction>> {
  const { data } = await api.get<Paginated<BankTransaction>>(
    `/funds/${fundId}/bank-transactions/unmatched/`,
    { params },
  );
  return data;
}

/**
 * POST /api/bank-transactions/{id}/assign/ — manually assign a member and charge their wallet
 * (FRONTEND_API §9.5). Not fund-scoped in the URL. `400 BANK_TRANSACTION_ALREADY_CHARGED` if
 * the transaction was already charged.
 */
export async function assignBankTransaction(
  id: number,
  memberId: number,
): Promise<BankTransaction> {
  const { data } = await api.post<BankTransaction>(`/bank-transactions/${id}/assign/`, {
    member_id: memberId,
  });
  return data;
}

/**
 * POST /api/bank-transactions/{id}/rematch/ — re-run card-based auto-matching on an uncharged
 * transaction (FRONTEND_API §9.6). Useful after the person's card was added. Empty body; a
 * no-op if already charged.
 */
export async function rematchBankTransaction(id: number): Promise<BankTransaction> {
  const { data } = await api.post<BankTransaction>(`/bank-transactions/${id}/rematch/`, {});
  return data;
}
