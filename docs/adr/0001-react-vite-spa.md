# Frontend is a React + Vite SPA in TypeScript

The Fundora frontend is a client-rendered single-page app built with React, Vite, and
TypeScript, talking to the separate Django/DRF backend over JSON.

We chose an SPA over a meta-framework (Next.js) because the app is an authenticated,
single-operator admin tool: there is no public surface, no SEO requirement, and no
member portal at launch, so server-side rendering would be dead weight and would
complicate purely client-side JWT handling. React (over Vue) wins on ecosystem depth for
this app's two hardest parts — a mature Jalali date picker and a robust server-state
library — and TypeScript is mandatory against an API with a typed schema and a fixed set
of machine-readable error codes.
