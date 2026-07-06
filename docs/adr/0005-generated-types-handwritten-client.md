# API types generated from OpenAPI; call layer hand-written

TypeScript request/response types are generated from the backend's OpenAPI schema
(`/api/schema/`) via `openapi-typescript` and regenerated whenever the API changes. The
network layer on top of those types — the axios instance, the in-memory-access /
cookie-refresh flow, machine-error-code handling, and the TanStack Query hooks — is
hand-written, not generated.

Generating the types kills the usual drift between a frontend's assumptions and the real
API: a backend change that the frontend hasn't accounted for becomes a compile error. We
rejected full client/hook generation because Fundora's documented behaviors — the
pagination envelope, auto-settlement forcing refetches, and the stable domain error codes
— are handled far more cleanly by a small bespoke layer than by fighting generic
generated hooks.

## Consequences

- Type generation is a build/dev step to re-run after backend schema changes (analogous
  to re-running migrations).
- The schema must be kept accurate — acceptable because the same team owns the backend.
