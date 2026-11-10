# PlaceMe – Smart Placement Management System

MERN application with Student, Company and Admin portals (React + Vite + Tailwind, Node/Express, MongoDB Atlas).
UI theme: **Navy & Gold**. Includes a built-in **PlaceMe Assistant** chat widget.

## Run locally (Windows / PowerShell)

```powershell
# 1) API
cd server
npm install
copy .env.example .env      # then edit .env (MONGO_URI, JWT_SECRET ...)
npm run dev

# 2) Frontend (new terminal)
cd client
npm install --legacy-peer-deps
copy .env.example .env      # points to the deployed API so localhost and Vercel share the same accounts
npm run dev                 # http://localhost:5173
```

## Demo data

```powershell
cd server
npm run seed
```
Safe to run many times. Creates 3 approved companies and 10 jobs (no demo students; any older demo students are removed automatically).
On a deployed server set `SEED_ON_START=true` (Render -> Environment) instead; remove it afterwards if you like.

| Role | Email | Password |
|---|---|---|
| Company | hr@codecraft.demo (also hr@technova.demo, hr@databridge.demo) | Company@123 |
| Admin | admin@placeme.demo (created only if the database has no admin) | Admin@123 |

Students register themselves from the Register page.

These are public demo accounts: delete them before real use.

## Login / register not working?
The login and register pages show a status line ("Server connected" / "Server not reachable") and the API address in use. If it is red: start the backend (`cd server; npm run dev`) and make sure MongoDB is running, or check `VITE_API_URL` in `client/.env`.

## Same login on localhost and Vercel
* The API accepts localhost / 127.0.0.1 on any port, every URL in `CLIENT_URL` (comma separated) and any `*placement*.vercel.app` URL.
* The frontend uses `VITE_API_URL`; without it, localhost uses `http://localhost:5000/api` and falls back to the deployed API if it is not running, every other host uses the deployed API.

## Chat assistant
* Works out of the box in quick-help mode (answers from live platform data: jobs, eligibility, applications, interviews, approvals, stats).
* For real AI answers set one of these on the server:
  * `ANTHROPIC_API_KEY` (optional `ANTHROPIC_MODEL`, default `claude-haiku-5-5`)
  * or any OpenAI-compatible provider: `LLM_API_KEY`, `LLM_BASE_URL`, `LLM_MODEL`
* If the AI call fails the assistant automatically falls back to quick-help mode.

## Environment variables (server)
See `server/.env.example`.
