/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Express + better-sqlite3 backend for the Keiailab business card generator.
 * Persists cards and serves a public, shareable digital business card page.
 * Run with: tsx src/server.ts
 */

import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import express, { type Request, type Response } from 'express';
import Database from 'better-sqlite3';
import 'dotenv/config';

const PORT = Number(process.env.PORT) || 3001;
const APP_URL = process.env.APP_URL || `http://localhost:${PORT}`;

// Keep cards.db in the repo root regardless of where the process is launched.
const DB_PATH = fileURLToPath(new URL('../cards.db', import.meta.url));
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.exec(`
  CREATE TABLE IF NOT EXISTS cards (
    id TEXT PRIMARY KEY,
    name TEXT,
    title TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    created_at TEXT
  )
`);

interface CardInput {
  name?: unknown;
  title?: unknown;
  phone?: unknown;
  email?: unknown;
  website?: unknown;
}

interface CardRow {
  id: string;
  name: string;
  title: string;
  phone: string;
  email: string;
  website: string;
  created_at: string;
}

const insertCard = db.prepare(
  `INSERT INTO cards (id, name, title, phone, email, website, created_at)
   VALUES (?, ?, ?, ?, ?, ?, ?)`,
);
const selectCard = db.prepare(`SELECT * FROM cards WHERE id = ?`);

function newId(): string {
  return randomBytes(6).toString('hex');
}

function str(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeUrl(website: string): string {
  if (!website) return '';
  return /^https?:\/\//i.test(website) ? website : `https://${website}`;
}

const app = express();
app.use(express.json());

// Create a card and return its share URL.
app.post('/api/cards', (req: Request, res: Response) => {
  try {
    const body = (req.body ?? {}) as CardInput;
    const card = {
      name: str(body.name),
      title: str(body.title),
      phone: str(body.phone),
      email: str(body.email),
      website: str(body.website),
    };

    // Reject completely empty submissions.
    const hasContent = Object.values(card).some((v) => v.length > 0);
    if (!hasContent) {
      return res.status(400).json({ error: 'Card data is required.' });
    }

    const id = newId();
    insertCard.run(
      id,
      card.name,
      card.title,
      card.phone,
      card.email,
      card.website,
      new Date().toISOString(),
    );

    return res.status(201).json({ id, url: `${APP_URL}/c/${id}` });
  } catch (error) {
    console.error('POST /api/cards failed', error);
    return res.status(500).json({ error: 'Failed to create card.' });
  }
});

// Return card JSON.
app.get('/api/cards/:id', (req: Request, res: Response) => {
  try {
    const row = selectCard.get(req.params.id) as CardRow | undefined;
    if (!row) {
      return res.status(404).json({ error: 'Card not found.' });
    }
    return res.json(row);
  } catch (error) {
    console.error('GET /api/cards/:id failed', error);
    return res.status(500).json({ error: 'Failed to fetch card.' });
  }
});

// Serve the public, shareable digital business card page.
app.get('/c/:id', (req: Request, res: Response) => {
  try {
    const row = selectCard.get(req.params.id) as CardRow | undefined;
    if (!row) {
      res.status(404).type('html').send(notFoundPage());
      return;
    }
    res.type('html').send(cardPage(row));
  } catch (error) {
    console.error('GET /c/:id failed', error);
    res.status(500).type('html').send('<h1>500 — Server error</h1>');
  }
});

function cardPage(card: CardRow): string {
  const name = escapeHtml(card.name);
  const title = escapeHtml(card.title);
  const phone = escapeHtml(card.phone);
  const email = escapeHtml(card.email);
  const website = escapeHtml(card.website);
  const websiteHref = escapeHtml(normalizeUrl(card.website));
  const telHref = escapeHtml(card.phone.replace(/[^+\d]/g, ''));

  const rows: string[] = [];
  if (card.phone) {
    rows.push(
      `<a class="row" href="tel:${telHref}"><span class="label">전화</span><span class="value">${phone}</span></a>`,
    );
  }
  if (card.email) {
    rows.push(
      `<a class="row" href="mailto:${email}"><span class="label">이메일</span><span class="value">${email}</span></a>`,
    );
  }
  if (card.website) {
    rows.push(
      `<a class="row" href="${websiteHref}" target="_blank" rel="noopener"><span class="label">홈페이지</span><span class="value">${website}</span></a>`,
    );
  }

  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${name || 'KEIAILAB'} — 디지털 명함</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans KR", sans-serif;
    background: #0f172a;
    color: #e2e8f0;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
  }
  .card {
    width: 100%;
    max-width: 420px;
    background: linear-gradient(140deg, #1e293b 0%, #0f172a 100%);
    border: 1px solid rgba(148, 163, 184, 0.18);
    border-radius: 20px;
    padding: 36px 32px;
    box-shadow: 0 24px 60px -20px rgba(0, 0, 0, 0.6);
  }
  .brand {
    font-size: 14px;
    font-weight: 800;
    letter-spacing: 0.18em;
    color: #f8fafc;
    margin-bottom: 28px;
  }
  .name { font-size: 30px; font-weight: 700; color: #f8fafc; letter-spacing: -0.01em; }
  .title {
    margin-top: 8px;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #94a3b8;
  }
  .rows { margin-top: 28px; display: flex; flex-direction: column; gap: 2px; }
  .row {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 14px 8px;
    border-top: 1px solid rgba(148, 163, 184, 0.12);
    color: #e2e8f0;
    text-decoration: none;
    transition: background 0.15s ease;
  }
  .row:hover { background: rgba(148, 163, 184, 0.08); }
  .label {
    flex: 0 0 56px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #64748b;
  }
  .value { font-size: 15px; font-weight: 500; color: #f1f5f9; word-break: break-all; }
  .footer { margin-top: 28px; font-size: 11px; color: #475569; text-align: right; }
</style>
</head>
<body>
  <main class="card">
    <div class="brand">KEIAILAB</div>
    <h1 class="name">${name || ' '}</h1>
    ${title ? `<p class="title">${title}</p>` : ''}
    <div class="rows">
      ${rows.join('\n      ')}
    </div>
    <div class="footer">Keiailab 디지털 명함</div>
  </main>
</body>
</html>`;
}

function notFoundPage(): string {
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>명함을 찾을 수 없습니다</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans KR", sans-serif;
    background: #0f172a;
    color: #e2e8f0;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 24px;
  }
  h1 { font-size: 22px; color: #f8fafc; }
  p { font-size: 14px; color: #94a3b8; }
</style>
</head>
<body>
  <h1>404</h1>
  <p>존재하지 않는 명함입니다.</p>
</body>
</html>`;
}

app.listen(PORT, () => {
  console.log(`Card server listening on ${APP_URL} (port ${PORT})`);
});
