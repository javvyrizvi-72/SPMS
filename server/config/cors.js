// Allowed browser origins for the API.
//  - localhost / 127.0.0.1 (Vite dev + preview)
//  - every origin listed (comma separated) in CLIENT_URL  -> e.g. your Vercel production URL
//  - Vercel project URLs that contain the word "placement" (production + preview deployments)
const DEFAULT_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
  'http://localhost:3000',
];
// localhost / 127.0.0.1 on ANY port (Vite switches to 5174, 5175... when 5173 is busy) and private LAN addresses (phone testing)
const LOCAL_PATTERN = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\]|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$/i;
const VERCEL_PATTERN = /^https:\/\/[a-z0-9-]*placement[a-z0-9-]*\.vercel\.app$/i;

const clean = (o) => String(o || '').trim().replace(/\/+$/, '');

const configuredOrigins = () =>
  String(process.env.CLIENT_URL || '')
    .split(',')
    .map(clean)
    .filter(Boolean);

const isAllowedOrigin = (origin) => {
  if (!origin) return true; // curl, Postman, server-to-server
  const o = clean(origin);
  return DEFAULT_ORIGINS.includes(o) || LOCAL_PATTERN.test(o) || configuredOrigins().includes(o) || VERCEL_PATTERN.test(o);
};

const corsOptions = {
  origin(origin, cb) {
    if (isAllowedOrigin(origin)) return cb(null, true);
    console.warn(`CORS blocked origin: ${origin}  (add it to CLIENT_URL on the server)`);
    return cb(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
};

module.exports = { corsOptions, isAllowedOrigin, configuredOrigins };
