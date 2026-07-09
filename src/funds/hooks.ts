import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listFunds, createFund, type CreateFundInput } from "./api";

// Query keys live in one place so invalidation and reads can't drift apart.
export const fundKeys = {
  all: ["funds"] as const,
  list: () => [...fundKeys.all, "list"] as const,
};

/** The funds you own (first page). */
export function useFunds() {
  return useQuery({
    queryKey: fundKeys.list(),
    queryFn: () => listFunds(),
  });
}

/** Create a fund, then invalidate the list so it refetches with the new row. */
export function useCreateFund() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateFundInput) => createFund(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: fundKeys.all });
    },
  });
}
