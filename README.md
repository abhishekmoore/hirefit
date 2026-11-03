# HireFit

HireFit reads a resume and a job description, then says how well they face each other.

It is a small TypeScript MERN app: React, Express, MongoDB, and an OpenAI-compatible model. If you do not set a model key, it still runs. The screen is labeled as an offline skill overlap, not as a model judgment.

This is a hiring **aid**. It does not decide who to interview.

## What you can do

- Paste a resume and a role, or load the built-in sample.
- Get a 0–100 score, shared skills, skills named only in the role, risks, and up to three rewritten bullets.
- Save each screen and reopen it later.
- Delete a screen you do not want to keep.

Rewritten bullets are only allowed to rephrase evidence already in the resume. The model prompt forbids invented employers, tools, and metrics. The offline checker does not add missing skills into bullets at all.

## Stack

| Piece | Choice |
| --- | --- |
| UI | React 19, TypeScript, Vite |
| API | Express 4, TypeScript, Zod |
| Data | MongoDB via Mongoose, or an in-memory store |
| Model | `openai` SDK against any compatible base URL |
| Tests | `node:test` through `tsx` |

## Run it

Node 20 or newer.

```bash
cp .env.example .env
npm install
npm run dev
```

Open the Vite URL printed in the terminal (port 5173). The API is on port 4000. Vite proxies `/api` to it.

Production-style, one process:

```bash
npm run build
npm start
```

Then open port 4000. Express serves the built React app.

## Environment

| Variable | Required | Purpose |
| --- | --- | --- |
| `PORT` | No | API port. Default `4000`. |
| `MONGO_URI` | No | Example: `mongodb://127.0.0.1:27017/hirefit`. If empty, screens live in memory and vanish when the process stops. |
| `OPENAI_API_KEY` | No | If empty, HireFit uses the offline overlap check. |
| `OPENAI_BASE_URL` | No | Use this for xAI, Groq, OpenRouter, or a local server. |
| `OPENAI_MODEL` | No | Default `gpt-4o-mini`. |

Do not commit `.env`.

## API

`GET /api/health` — `{ ok, store: "memory" \| "mongo", ai: "model" \| "heuristic", model }`

`GET /api/screens?limit=20` — newest first, limit 1–50.

`POST /api/screens` — body `{ resumeText, jobText, candidateName? }`. Each text must be 80–20,000 characters. Returns the saved screen.

`GET /api/screens/:id`

`DELETE /api/screens/:id` — `204` when removed.

## Scripts

```bash
npm test
npm run typecheck
npm run build
```

GitHub Actions runs those three on every push.

## Limits

- The offline score is a keyword overlap over a fixed skill list. It misses domain tools it has never heard of, and it cannot judge seniority.
- The model can still be wrong. Read the resume yourself before you trust a bullet.
- There is no login. Anyone who can reach the server can read saved resumes. Do not point this at the public internet with real candidate data.

Design notes for someone changing the code are in [DEVELOPER.md](DEVELOPER.md).
