import nodemailer, { type Transporter } from 'nodemailer';
import {
  SMTP_FROM,
  SMTP_HOST,
  SMTP_PASS,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_USER,
} from '../config';

interface MailJob {
  to: string;
  subject: string;
  html: string;
  attempts: number;
}

const transporter: Transporter | null = SMTP_HOST
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
    })
  : null;

const queue: MailJob[] = [];
let draining = false;
const MAX_ATTEMPTS = 3;

async function flushQueue(): Promise<void> {
  if (draining || !transporter || !SMTP_FROM) return;
  draining = true;

  while (queue.length > 0) {
    const job = queue.shift();
    if (!job) continue;

    try {
      await transporter.sendMail({
        from: SMTP_FROM,
        to: job.to,
        subject: job.subject,
        html: job.html,
      });
    } catch (error) {
      if (job.attempts + 1 < MAX_ATTEMPTS) {
        queue.push({ ...job, attempts: job.attempts + 1 });
      } else {
        console.error('Unable to send email after retries', error);
      }
    }
  }

  draining = false;
}

export async function sendMail(to: string, subject: string, html: string): Promise<void> {
  if (!transporter || !SMTP_FROM) {
    console.warn('SMTP is not configured; email skipped.');
    return;
  }

  queue.push({ to, subject, html, attempts: 0 });
  await flushQueue();
}
