import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

// Import modular routers
import agoraRouter from './routes/agora.js';
import matchesRouter from './routes/matches.js';
import confessionsRouter from './routes/confessions.js';
import pushRouter from './routes/push.js';
import matchmakingRouter from './routes/matchmaking.js';
import { rateLimiter } from './middleware/rateLimiter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env variables
dotenv.config({ path: path.resolve(__dirname, '../client/.env') });
dotenv.config({ path: path.resolve(__dirname, '../client/.env.local') });
dotenv.config({ path: path.resolve(__dirname, './.env') });

const app = express();
const port = parseInt(process.env.PORT || '5000', 10);

// SCALING: Render terminates TLS at a reverse proxy. Trust the first proxy hop
// so req.ip is the REAL client IP — without this, every request shares one
// rate-limit bucket (platform-wide 429s) and per-IP abuse controls are useless.
app.set('trust proxy', 1);

// CORS Configuration - Allow both production and development origins
const corsOptions = {
  origin: [
    'http://localhost:5173', // Local Vite dev server
    'http://localhost:3000', // Alternative local port
    'https://testing-of-client.vercel.app', // Old Production frontend
    'https://othrhalff.in', // New Domain
    'https://www.othrhalff.in', // New Domain (www)
    'https://othrhalff.vercel.app', // New Vercel Domain
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-secret', 'X-Admin-Secret']
};

app.use(cors(corsOptions));
app.use(express.json());

// Process-level guards: an unhandled rejection must log loudly, not silently
// kill the single-process server between health checks.
process.on('unhandledRejection', (reason) => {
  console.error('[FATAL] Unhandled promise rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught exception:', err);
  // Let Render restart the service on a truly broken state.
  process.exit(1);
});

// Global API Rate Limiting (Redis powered with in-memory fallback)
// NOTE: matchmaking/queue is EXEMPT — it's a lightweight authenticated poll
// that must run every few hundred ms while searching; counting it against the
// same 60/min budget as real API calls throttled the radar into multi-second
// stalls even when only 2 users were online.
app.use('/api', (req, res, next) => {
  if (req.path === '/matchmaking/queue' || req.path === '/matchmaking/leave') return next();
  return rateLimiter({ limit: 60, windowSeconds: 60 })(req, res, next);
});
app.use('/api/matchmaking', rateLimiter({ limit: 240, windowSeconds: 60, keyPrefix: 'mm' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Mount modular routers
app.use('/api', agoraRouter);
app.use('/api', matchesRouter);
app.use('/api', confessionsRouter);
app.use('/api', pushRouter);
app.use('/api', matchmakingRouter);

app.get('/', (req, res) => {
  res.send('Backend API is running. Use the Vercel Frontend to interact.');
});

const server = http.createServer(app);

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
