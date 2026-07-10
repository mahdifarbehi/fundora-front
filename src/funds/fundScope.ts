import { useMatch, useParams } from "react-router-dom";

// The active fund lives in the URL — there is no global "current fund" state (ADR 0006).
// Every fund-scoped query key and API call derives its id from here.

/** The fund id for a screen rendered *inside* a `/funds/:fundId` route. Asserts presence. */
export function useFundId(): string {
  const { fundId } = useParams<{ fundId: string }>();
  if (!fundId) throw new Error("useFundId() used outside a /funds/:fundId route");
  return fundId;
}

/**
 * The active fund id read from anywhere (e.g. the header switcher, which is an ancestor of the
 * fund routes and so can't use useParams). Undefined when not inside a fund. Also returns the
 * trailing sub-path so the switcher can keep you on the same screen across funds.
 */
export function useCurrentFundScope(): { fundId?: string; subPath: string } {
  const match = useMatch("/funds/:fundId/*");
  return { fundId: match?.params.fundId, subPath: match?.params["*"] ?? "" };
}
