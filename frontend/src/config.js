// In production this app is deployed as a Vercel microfrontend alongside the backend
// (see /vercel.json at the repo root) — /api/* is same-origin, so no host prefix is
// needed. VITE_API_URL still works as an explicit override if ever deployed standalone.
export const API_URL = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? 'http://localhost:3001' : '');
