# Swift Agency

A full-stack web project with a Node.js/Express backend and a static frontend served via Express.

## Directory Structure

- `frontend/` — static site (HTML, CSS, JS, images)
- `backend/` — Node.js Express server, API routes, database
- `backend/database/` — SQLite database and migrations
- `backend/routes/` — API endpoints (appointments, contact, enquiry, newsletter, deepseek)
- `backend/services/` — WhatsApp notification service
- `backend/tests/` — backend test scripts

## Getting Started

1. Install backend dependencies:
   - `npm run install-backend`
2. Start the backend (serves frontend):
   - `npm run start`
   - Server runs on `http://localhost:3000` by default
3. Development mode:
   - `npm run dev`

## Environment

- Create `backend/.env` with required keys (email SMTP, `DEEPSEEK_API_KEY`, etc.)
- SQLite DB file is auto-created at `backend/database/swift_agency.db`

## Testing

- Run backend tests:
   - `npm --workspace backend test`

## Deployment

- The backend serves all static assets from `frontend/`
- See `backend/vercel.json` for serverless deployment routing

## Notes

- Sensitive files and local artifacts are ignored via `.gitignore`
- Do not commit secrets (API keys, SMTP passwords)