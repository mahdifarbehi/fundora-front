import { api } from "../lib/client";
import type { Paginated, PageParams } from "../lib/pagination";
import type { components } from "../lib/api-types";

export type Fund = components["schemas"]["Fund"];

// Writable fields only (creator/id/timestamps are read-only, stamped by the backend —
// FRONTEND_API §5). Amounts are integers (Toman); contribution_day is 1–28.
export interface CreateFundInput {
  name: string;
  monthly_share_amount: number;
  default_loan_amount: number;
  default_installment_count: number;
  contribution_day: number;
}

/** GET /api/funds/ — the funds you own, as a paginated envelope (FRONTEND_API §5.1). */
export async function listFunds(params: PageParams = {}): Promise<Paginated<Fund>> {
  const { data } = await api.get<Paginated<Fund>>("/funds/", { params });
  return data;
}

/** GET /api/funds/{id}/ — one fund; `404 NOT_FOUND` if it isn't yours (FRONTEND_API §5.3). */
export async function getFund(id: string | number): Promise<Fund> {
  const { data } = await api.get<Fund>(`/funds/${id}/`);
  return data;
}

/** POST /api/funds/ — create a fund (FRONTEND_API §5.2). */
export async function createFund(input: CreateFundInput): Promise<Fund> {
  const { data } = await api.post<Fund>("/funds/", input);
  return data;
}
