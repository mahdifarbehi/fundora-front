import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listBankTransactions,
  listUnmatchedBankTransactions,
  postBankTransaction,
  assignBankTransaction,
  rematchBankTransaction,
  type PostBankTransactionInput,
} from "./api";
import { walletKeys } from "../wallets/hooks";

export const bankKeys = {
  all: (fundId: string) => ["funds", fundId, "bank-transactions"] as const,
  list: (fundId: string) => [...bankKeys.all(fundId), "list"] as const,
  unmatched: (fundId: string) => [...bankKeys.all(fundId), "unmatched"] as const,
};

/** Bank transactions for the fund (first page, newest first). */
export function useBankTransactions(fundId: string) {
  return useQuery({
    queryKey: bankKeys.list(fundId),
    queryFn: () => listBankTransactions(fundId),
  });
}

/** The unmatched queue for the fund (transactions awaiting manual assignment). */
export function useUnmatchedBankTransactions(fundId: string) {
  return useQuery({
    queryKey: bankKeys.unmatched(fundId),
    queryFn: () => listUnmatchedBankTransactions(fundId),
  });
}

/**
 * Record a transfer. On success the backend may have auto-matched it to a member and charged
 * their wallet (which then settles dues) — so we invalidate the bank list AND the matched
 * member's wallet, forcing a refetch that shows the new balance/payments (FRONTEND_API §12).
 */
export function usePostBankTransaction(fundId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PostBankTransactionInput) => postBankTransaction(fundId, input),
    onSuccess: (txn) => {
      qc.invalidateQueries({ queryKey: bankKeys.all(fundId) });
      if (txn.matched_member != null) {
        qc.invalidateQueries({ queryKey: walletKeys.detail(String(txn.matched_member)) });
      }
    },
  });
}

/**
 * Manually assign an unmatched transaction to a member (FRONTEND_API §9.5). Charges that
 * member's wallet, so we invalidate the bank queries (the row leaves the unmatched queue) AND
 * the assigned member's wallet (balance + newly-settled dues refetch).
 */
export function useAssignBankTransaction(fundId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, memberId }: { id: number; memberId: number }) =>
      assignBankTransaction(id, memberId),
    onSuccess: (_txn, { memberId }) => {
      qc.invalidateQueries({ queryKey: bankKeys.all(fundId) });
      qc.invalidateQueries({ queryKey: walletKeys.detail(String(memberId)) });
    },
  });
}

/**
 * Re-run auto-matching on an uncharged transaction (FRONTEND_API §9.6). If it now matches, the
 * wallet was charged — invalidate the bank queries and (when matched) that member's wallet.
 */
export function useRematchBankTransaction(fundId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => rematchBankTransaction(id),
    onSuccess: (txn) => {
      qc.invalidateQueries({ queryKey: bankKeys.all(fundId) });
      if (txn.matched_member != null) {
        qc.invalidateQueries({ queryKey: walletKeys.detail(String(txn.matched_member)) });
      }
    },
  });
}
