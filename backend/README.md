# Swift Agency Backend (Railway Deployment)

This repository contains the Node/Express backend for Swift Agency. It supports enquiry forms, appointments, newsletter APIs, WhatsApp notifications, and DeepSeek integration.

## Prerequisites

- Node.js 18+
- Railway account and project
- SMTP credentials for email notifications
- DeepSeek API key

## Environment Variables

Set these in Railway → Variables:

- `NODE_ENV=production`
- `PORT` (Railway provides automatically; keep using `process.env.PORT`)
- `DEEPSEEK_API_KEY`
- `ALLOWED_ORIGINS` — comma-separated allowlist for CORS (e.g. `https://yourdomain.com,https://www.yourdomain.com,https://your-frontend.vercel.app`)
- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_SECURE`, `EMAIL_USER`, `EMAIL_PASS`, `ADMIN_EMAIL`
- `DB_PATH` or `DATABASE_URL` — use a Railway Volume with SQLite or switch to a managed Postgres (recommended)

## Start Commands

Defined in `package.json`:

- `npm run start` — launches `server.js` (production)
- `npm run dev` — nodemon for local development

## Health Check

- `GET /api/health` returns status JSON

## CORS

The backend reads `ALLOWED_ORIGINS` and strictly matches origins. Update this when you change frontend domains.

## Deploy to Railway

1. Create a new Railway project
2. Connect this GitHub repository
3. Set Variables as above
4. Deploy — Railway will build and start using `npm run start`
5. Optional: Add a custom domain (e.g., `api.yourdomain.com`) and configure DNS

### Production Backend URL

- Public endpoint: `https://backend-y4oa.onrender.com`
- Use this base URL for production API calls: `https://backend-y4oa.onrender.com/api/...`
- Ensure it is included in `ALLOWED_ORIGINS` and documented in client apps.

### Storage & Database

- SQLite: configure a Railway Volume and set `DB_PATH` to the mounted path
- Postgres: add the Postgres plugin; set `DATABASE_URL`; update code to use Postgres if migrating

### WhatsApp Service

`whatsapp-web.js` requires a persistent process and writable filesystem. Ensure the auth directory `.wwebjs_auth/` is writable on Railway (use a volume).

## Local Test

```bash
npm ci
npm run dev
curl http://localhost:3000/api/health
```

## Monitoring

- Enable Railway metrics and logs for uptime and performance
- Optionally configure external uptime monitors (e.g., UptimeRobot) to probe `GET /api/health`

## Security

- `.env` and auth/session files are excluded via `.gitignore`
- Do not commit secrets

## Notes

- If your frontend is hosted separately (Vercel/Pages), point API calls to your Railway domain (e.g., `https://api.yourdomain.com/api/...`).
