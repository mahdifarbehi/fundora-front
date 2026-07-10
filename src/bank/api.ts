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
