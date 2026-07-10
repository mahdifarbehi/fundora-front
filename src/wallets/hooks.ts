import { useQuery } from "@tanstack/react-query";
import { getWallet } from "./api";

export const walletKeys = {
  detail: (memberId: string) => ["members", memberId, "wallet"] as const,
};

/** A member's wallet (balance + first page of ledger). */
export function useWallet(memberId: string) {
  return useQuery({
    queryKey: walletKeys.detail(memberId),
    queryFn: () => getWallet(memberId),
  });
}
