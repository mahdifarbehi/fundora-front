# The active fund lives in the URL

Fund-scoped screens carry the fund id in the route (`/funds/:fundId/members`,
`/funds/:fundId/loans`, …). Switching funds is a header dropdown that navigates to the
same screen under a different fund id. There is no global "current fund" held in app
state.

This mirrors the backend's own nested routes (`/api/funds/{fund_pk}/...`), so the frontend
structure reads like the API. Keeping the fund in the URL means there is no hidden
context to fall out of sync, links are bookmarkable and shareable, the browser Back
button behaves correctly, and the user can't silently act on the wrong fund because
the fund is always visible in the address.

## Consequences

- Every fund-scoped route, query key, and API call derives its fund id from the URL param
  — the single source of truth for "which fund."
- Non-fund-scoped screens (fund list, account/auth) sit outside the `/funds/:fundId`
  segment.
