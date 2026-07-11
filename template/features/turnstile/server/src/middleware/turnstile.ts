import type { NextFunction, Request, Response } from 'express';
import { TURNSTILE_SECRET_KEY } from '../config';

export async function verifyTurnstile(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = req.body?.['cf-turnstile-response'];

  if (!TURNSTILE_SECRET_KEY) {
    next();
    return;
  }

  if (!token || typeof token !== 'string') {
    res.status(400).json({ error: 'CAPTCHA token is required' });
    return;
  }

  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      secret: TURNSTILE_SECRET_KEY,
      response: token,
    }),
  });

  const result = (await response.json()) as { success?: boolean };
  if (!result.success) {
    res.status(403).json({ error: 'CAPTCHA verification failed' });
    return;
  }

  next();
}
