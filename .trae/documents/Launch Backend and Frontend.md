## Overview
We will install backend dependencies, start the Express server that also serves the static frontend, and verify the app is reachable locally.

## Key Details
- Backend entry: `backend/server.js` (`process.env.PORT || 3000` at backend/server.js:22)
- Static frontend served from: `../frontend` (backend/server.js:50)
- Default URL: `http://localhost:3000`
- Scripts available:
  - Root `package.json`: `npm start` (node), `npm run dev` (nodemon), `npm run install-backend`
  - Backend `package.json`: `npm start`, `npm run dev`

## Prerequisites
1. Node.js 18+ installed
2. PowerShell terminal in `c:\Users\USER\Desktop\swift-agency11-main`
3. Optional: set `PORT` in `backend/.env` if you want a different port

## Install
- From project root: `npm run install-backend`
  - Equivalent: `cd backend && npm install`

## Start Server
- From project root: `npm run dev`
  - Alternative: `npm start`
- Or from backend: `cd backend && npm run dev`

## Access Frontend
- Open `http://localhost:3000` in a browser
- Pages: `/index.html`, `/booking.html`, `/contact.html` (static files inside `frontend`)

## Verification
- Confirm terminal logs show listening on selected port
- Visit `http://localhost:3000/contact.html` to verify static serving
- If a custom `PORT` is set, use `http://localhost:<PORT>`

If you approve, I will run the install and start commands, then share the live preview URL for you to open.