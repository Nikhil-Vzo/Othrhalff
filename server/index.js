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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env variables
dotenv.config({ path: path.resolve(__dirname, '../client/.env') });
dotenv.config({ path: path.resolve(__dirname, './.env') });

const app = express();
const port = parseInt(process.env.PORT || '5000', 10);

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
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Mount modular routers
app.use('/api', agoraRouter);
app.use('/api', matchesRouter);
app.use('/api', confessionsRouter);

app.get('/', (req, res) => {
  res.send('Backend API is running. Use the Vercel Frontend to interact.');
});

const server = http.createServer(app);

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
