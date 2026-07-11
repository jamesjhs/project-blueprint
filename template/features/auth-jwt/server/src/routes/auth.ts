import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db';
import { JWT_SECRET, TURNSTILE_SECRET_KEY } from '../config';
import { requireAuth } from '../middleware/auth';
import type { User } from '../types';

const router = Router();
const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

const createUser = db.prepare('INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)');
const findUserByEmail = db.prepare('SELECT * FROM users WHERE email = ?');
const findUserById = db.prepare('SELECT * FROM users WHERE id = ?');

async function enforceTurnstile(token: unknown): Promise<boolean> {
  if (!TURNSTILE_SECRET_KEY) return true;
  if (typeof token !== 'string' || !token) return false;

  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      secret: TURNSTILE_SECRET_KEY,
      response: token,
    }),
  });

  const data = (await response.json()) as { success?: boolean };
  return Boolean(data.success);
}

function issueToken(user: Pick<User, 'id' | 'email' | 'role'>): string {
  return jwt.sign({ sub: String(user.id), email: user.email, role: user.role }, JWT_SECRET, {
    expiresIn: '7d',
  });
}

router.post('/register', async (req, res) => {
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  const password = String(req.body?.password ?? '');
  const turnstileToken = req.body?.['cf-turnstile-response'];

  if (!(await enforceTurnstile(turnstileToken))) {
    res.status(403).json({ error: 'CAPTCHA verification failed' });
    return;
  }

  if (!email || !password || password.length < 8) {
    res.status(400).json({ error: 'Email and password (min 8 chars) are required' });
    return;
  }

  const existing = findUserByEmail.get(email) as User | undefined;
  if (existing) {
    res.status(409).json({ error: 'Email is already registered' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const result = createUser.run(email, passwordHash, 'user');
  const token = issueToken({ id: Number(result.lastInsertRowid), email, role: 'user' });
  res.status(201).json({ token });
});

router.post('/login', loginLimiter, async (req, res) => {
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  const password = String(req.body?.password ?? '');
  const user = findUserByEmail.get(email) as User | undefined;

  const passwordMatches = user ? await bcrypt.compare(password, user.password_hash) : false;
  if (!user || !passwordMatches) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  res.json({
    token: issueToken({ id: user.id, email: user.email, role: user.role }),
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
    },
  });
});

router.get('/me', requireAuth, (req, res) => {
  const userId = Number(req.user?.sub);
  const user = findUserById.get(userId) as User | undefined;
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  res.json({
    id: user.id,
    email: user.email,
    role: user.role,
    created_at: user.created_at,
  });
});

router.post('/logout', (_req, res) => {
  res.status(204).send();
});

export default router;
