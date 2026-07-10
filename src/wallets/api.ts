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
