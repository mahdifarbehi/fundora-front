import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createLoan,
  getLoan,
  listLoans,
  reverseDuePayment,
  type CreateLoanInput,
} from "./api";
import { walletKeys } from "../wallets/hooks";

export const loanKeys = {
  all: (fundId: string) => ["funds", fundId, "loans"] as const,
  list: (fundId: string) => [...loanKeys.all(fundId), "list"] as const,
  detail: (loanId: string) => ["loans", loanId] as const,
};

/** Loans in the active fund (first page, newest first). */
export function useLoans(fundId: string) {
  return useQuery({
    queryKey: loanKeys.list(fundId),
    queryFn: () => listLoans(fundId),
  });
}

/** One loan with its installment schedule. */
export function useLoan(loanId: string) {
  return useQuery({
    queryKey: loanKeys.detail(loanId),
    queryFn: () => getLoan(loanId),
  });
}

/**
 * Create a loan. It generates the member's installment dues (which later settle from the wallet),
 * so we refetch the fund's loans and — defensively — that member's wallet.
 */
export function useCreateLoan(fundId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateLoanInput) => createLoan(fundId, input),
    onSuccess: (loan) => {
      qc.invalidateQueries({ queryKey: loanKeys.all(fundId) });
      qc.invalidateQueries({ queryKey: walletKeys.detail(String(loan.member)) });
    },
  });
}

/**
 * Reverse a paid installment (FRONTEND_API §8.1). It credits the member's wallet and can revert
 * the loan's status, so we refetch this loan (detail + fund list) and the member's wallet. Caller
 * passes the fund/member ids since the reversal response carries neither.
 */
export function useReverseDue(fundId: string, loanId: string, memberId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ dueId, description }: { dueId: number; description?: string }) =>
      reverseDuePayment(dueId, description),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: loanKeys.detail(loanId) });
      qc.invalidateQueries({ queryKey: loanKeys.list(fundId) });
      qc.invalidateQueries({ queryKey: walletKeys.detail(String(memberId)) });
    },
  });
}
