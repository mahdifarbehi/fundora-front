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
