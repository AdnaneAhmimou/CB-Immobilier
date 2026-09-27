// The API is always same-origin: in production the backend runs as a service of the
// same Vercel project (/vercel.json), and in development Vite proxies /api to the
// local backend (vite.config.js). Same-origin means the httpOnly session cookie is
// sent with every request without any code having to know it exists.
export const API_URL = '';
