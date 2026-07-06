# Refresh token in an httpOnly cookie, access token in memory

The backend issues the ~1-day refresh token as an httpOnly, Secure, SameSite cookie; the
SPA holds the ~5-min access token only in memory (a JS variable) and sends it as a
bearer header. On app load and on any `401`, the client calls the refresh endpoint — the
cookie rides along automatically — to mint a fresh access token, with a request queue so
concurrent 401s don't stampede the refresh endpoint.

We picked this over localStorage-stored tokens because this is a money application and an
httpOnly cookie keeps the long-lived credential unreachable from JavaScript, so an XSS
bug cannot exfiltrate a session for offline/after-tab-close use. It does not stop an
*active* XSS script from riding the session, but that is a strictly smaller exposure. We
picked it over a fully cookie-only scheme because keeping only the refresh endpoint
cookie-authenticated confines the CSRF surface to a single endpoint (covered by
SameSite=Strict) instead of every mutating request.

## Consequences

- Required a **backend change** — **now implemented** in the `fundora` backend: cookie-
  setting login (`/api/auth/token/`), cookie-reading refresh (`/api/auth/token/refresh/`),
  and cookie-clearing, blacklisting logout (`/api/auth/logout/`). The cookie is
  `refresh_token`, httpOnly, `SameSite=Strict`, `Path=/api/auth/`, `Secure` in prod. The
  live contract is documented in `FRONTEND_API.md` §1 and §4.
- Requires a **same-site deployment**: the SPA and API must share a registrable domain
  (e.g. `app.fundora.ir` + `api.fundora.ir`, SameSite=Lax) or the API is reverse-proxied
  under the SPA origin at `/api`. This avoids `SameSite=None; Secure` + CORS-credentials
  fragility. In dev, the Vite dev-server proxies `/api` to Django so the browser sees one
  origin. Auth requests must be sent **with credentials** (`withCredentials`/
  `credentials: "include"`).
