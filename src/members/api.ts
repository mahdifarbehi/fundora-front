import { api } from "../lib/client";
import type { Paginated, PageParams } from "../lib/pagination";
import type { components } from "../lib/api-types";

export type Member = components["schemas"]["Member"];

// The add-member REQUEST body ({phone, full_name, share_count, cards}, FRONTEND_API §6.2) is
// hand-written: the generated OpenAPI schema wrongly reuses the read-only Member model here
// (it exposes only share_count as writable), so the doc + this type are the source of truth.
export interface AddMemberInput {
  phone: string;
  share_count: number;
  full_name?: string;
  cards?: string[];
}

/** GET /api/funds/{fundId}/members/ — paginated Members (FRONTEND_API §6.1). */
export async function listMembers(
  fundId: string,
  params: PageParams = {},
): Promise<Paginated<Member>> {
  const { data } = await api.get<Paginated<Member>>(`/funds/${fundId}/members/`, { params });
  return data;
}

/** POST /api/funds/{fundId}/members/ — add (or link) a member by phone (FRONTEND_API §6.2). */
export async function addMember(fundId: string, input: AddMemberInput): Promise<Member> {
  const { data } = await api.post<Member>(`/funds/${fundId}/members/`, input);
  return data;
}
