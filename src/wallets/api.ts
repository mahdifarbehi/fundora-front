import { api } from "../lib/client";
import type { Paginated, PageParams } from "../lib/pagination";

// The wallet ledger endpoint is a custom action; drf-spectacular doesn't capture its response,
// so these types are hand-written from FRONTEND_API §3 (enums) and §6.5.
export type Direction = "CREDIT" | "DEBIT";
export type WalletTxnType =
  | "DEPOSIT"
  | "CONTRIBUTION_PAYMENT"
  | "INSTALLMENT_PAYMENT"
  | "ADJUSTMENT"
  | "PAYMENT_REVERSAL";

export interface WalletTransaction {
  id: number;
  amount: number;
  direction: Direction;
  type: WalletTxnType;
  description: string;
  bank_transaction: number | null;
  created_at: string;
}

// The paginated ledger envelope plus a top-level full-history balance (FRONTEND_API §6.5).
export interface WalletResponse extends Paginated<WalletTransaction> {
  balance: number;
}

/** GET /api/members/{id}/wallet/ — balance + paginated ledger (oldest first). */
export async function getWallet(
  memberId: string,
  params: PageParams = {},
): Promise<WalletResponse> {
  const { data } = await api.get<WalletResponse>(`/members/${memberId}/wallet/`, { params });
  return data;
}

// A manual wallet correction (FRONTEND_API §6.6). A CREDIT auto-settles pending dues; a DEBIT
// does not and is capped at the current balance (the wallet can never go negative).
export interface AdjustmentInput {
  amount: number;
  direction: Direction;
  description: string;
}

/** POST /api/members/{id}/adjustments/ — credit/debit the wallet directly. */
export async function postAdjustment(
  memberId: string,
  input: AdjustmentInput,
): Promise<WalletTransaction> {
  const { data } = await api.post<WalletTransaction>(`/members/${memberId}/adjustments/`, input);
  return data;
}

/**
 * POST /api/members/{id}/settle/ — force a settlement run (empty body). Pays pending dues
 * oldest-first while the balance allows, returning the payment rows it created (may be empty).
 */
export async function settleWallet(memberId: string): Promise<WalletTransaction[]> {
  const { data } = await api.post<WalletTransaction[]>(`/members/${memberId}/settle/`, {});
  return data;
}
