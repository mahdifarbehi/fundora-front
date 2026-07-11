import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getWallet, postAdjustment, settleWallet, type AdjustmentInput } from "./api";
import type { PageParams } from "../lib/pagination";
import { loanKeys } from "../loans/hooks";

export const walletKeys = {
  // Base key for a member's wallet; used as an invalidation prefix so every cached page refetches.
  detail: (memberId: string) => ["members", memberId, "wallet"] as const,
  // One cached page of the ledger (balance rides along on each page response).
  page: (memberId: string, params: PageParams) =>
    [...walletKeys.detail(memberId), params] as const,
};

/**
 * A member's wallet: full-history `balance` plus one page of the ledger. `params` (limit/offset)
 * pick the page; `keepPreviousData` keeps the old page visible while the next one loads so the
 * table doesn't flash empty when paging.
 */
export function useWallet(memberId: string, params: PageParams = {}) {
  return useQuery({
    queryKey: walletKeys.page(memberId, params),
    queryFn: () => getWallet(memberId, params),
    placeholderData: keepPreviousData,
  });
}

/**
 * Manual wallet adjustment (FRONTEND_API §6.6). A CREDIT auto-settles pending dues, so we
 * invalidate the whole wallet (balance + every ledger page) AND the fund's loans — a settled
 * installment changes a loan's status/schedule.
 */
export function useAdjustWallet(memberId: string, fundId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AdjustmentInput) => postAdjustment(memberId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: walletKeys.detail(memberId) });
      qc.invalidateQueries({ queryKey: loanKeys.all(fundId) });
    },
  });
}

/**
 * Force a settlement run (FRONTEND_API §6.7). Any payments it makes change the balance and add
 * ledger rows, and can pay loan installments — so invalidate the whole wallet AND the fund's loans.
 */
export function useSettleWallet(memberId: string, fundId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => settleWallet(memberId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: walletKeys.detail(memberId) });
      qc.invalidateQueries({ queryKey: loanKeys.all(fundId) });
    },
  });
}
