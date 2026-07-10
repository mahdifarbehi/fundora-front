import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listMembers, addMember, type AddMemberInput } from "./api";

export const memberKeys = {
  all: (fundId: string) => ["funds", fundId, "members"] as const,
  list: (fundId: string) => [...memberKeys.all(fundId), "list"] as const,
};

/** Members of the active fund (first page). */
export function useMembers(fundId: string) {
  return useQuery({
    queryKey: memberKeys.list(fundId),
    queryFn: () => listMembers(fundId),
  });
}

/**
 * A single member resolved from the fund's members list (there's no name-bearing GET for one
 * member). Used to label a wallet / a matched bank transfer. `undefined` while loading or if
 * the member is beyond the first page.
 */
export function useMember(fundId: string, memberId: string) {
  const { data } = useMembers(fundId);
  return data?.results.find((m) => String(m.id) === String(memberId));
}

/** Add a member to the fund, then invalidate the list so it refetches. */
export function useAddMember(fundId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AddMemberInput) => addMember(fundId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: memberKeys.all(fundId) });
    },
  });
}
