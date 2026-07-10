import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listBankTransactions, postBankTransaction, type PostBankTransactionInput } from "./api";
import { walletKeys } from "../wallets/hooks";

export const bankKeys = {
  all: (fundId: string) => ["funds", fundId, "bank-transactions"] as const,
  list: (fundId: string) => [...bankKeys.all(fundId), "list"] as const,
};

/** Bank transactions for the fund (first page, newest first). */
export function useBankTransactions(fundId: string) {
  return useQuery({
    queryKey: bankKeys.list(fundId),
    queryFn: () => listBankTransactions(fundId),
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
