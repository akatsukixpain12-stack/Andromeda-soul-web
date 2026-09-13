# Real Web Terminal — Setup

Two pieces:

## 1. Backend (`server/`) — real shell, needs a persistent host

Vercel serverless can't run this. Deploy to Fly.io, Railway, Render, or any VPS.

**Fly.io (fastest path):**
```
cd server
fly launch          # follow prompts, it detects the Dockerfile
fly secrets set AUTH_TOKEN=some-long-random-string
fly deploy
```
Your WebSocket URL will be `wss://<your-app>.fly.dev`.

**Railway / Render:** point either at the `server/` folder — both auto-detect
the Dockerfile and build/deploy it. Set the `AUTH_TOKEN` env var in their
dashboard.

**Plain VPS:**
```
cd server
npm install
AUTH_TOKEN=some-long-random-string PORT=8080 node index.js
```
Put it behind nginx/Caddy with TLS so you can use `wss://`.

## 2. Frontend (`frontend/terminal.html`) — goes on Vercel

Edit two lines at the top of the `<script>` block:
```js
const WS_URL = "wss://YOUR-BACKEND-HOST/";
const AUTH_TOKEN = "...";
```

Then deploy this file (or embed its contents into a page/component) as part
of your normal Vercel site.

## Security — read this before exposing it to anyone

- **Never ship the real AUTH_TOKEN in client-side JS** as in the demo above.
  That's fine for local testing, but in production: put this page behind your
  own login, and have your server (an API route, e.g. on Vercel) mint a
  short-lived token per authenticated user, which the frontend fetches at
  runtime and passes to the WebSocket.
- **Isolate the shell.** As written, `node-pty` spawns a shell as whatever
  user is running your Node process, with access to that whole machine. For
  anything beyond "only I use this," run each backend instance inside its own
  container (Docker-in-Docker, Firecracker, gVisor, etc.) so a compromised or
  malicious session can't reach your other services. This is what Google
  Cloud Shell and services like Replit do under the hood.
- **Rate-limit and cap concurrent sessions** (a basic cap is already in
  `index.js` — `MAX_CONCURRENT_SESSIONS`).
- **Log sessions** if you need an audit trail.
