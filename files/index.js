// Real terminal backend: WebSocket <-> real shell process (via node-pty)
// Deploy this on Fly.io / Railway / Render / a VPS — NOT Vercel serverless.
//
// Install deps:
//   npm init -y
//   npm install ws node-pty
//
// Run:
//   node index.js
//
// Env vars:
//   PORT            - port to listen on (default 8080)
//   AUTH_TOKEN       - shared secret clients must send to connect (set your own!)
//   SHELL_CMD        - shell to spawn (default: bash on linux, or "cmd.exe" on windows)

const http = require('http');
const WebSocket = require('ws');
const pty = require('node-pty');

const PORT = process.env.PORT || 8080;
const AUTH_TOKEN = process.env.AUTH_TOKEN || null;
const SHELL_CMD = process.env.SHELL_CMD || (process.platform === 'win32' ? 'cmd.exe' : 'bash');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('web-terminal backend is running\n');
});

const wss = new WebSocket.Server({ server });

// Basic connection limits — tune for your use case
const MAX_CONCURRENT_SESSIONS = 20;
let activeSessions = 0;

wss.on('connection', (ws, req) => {
  if (!AUTH_TOKEN) {
    ws.send(JSON.stringify({ type: 'error', data: 'Terminal authentication is not configured.\r\n' }));
    ws.close();
    return;
  }

  // ---- Auth check ----
  // Client must send: { type: "auth", token: "..." } as the FIRST message.
  let authenticated = false;
  let ptyProcess = null;

  if (activeSessions >= MAX_CONCURRENT_SESSIONS) {
    ws.send(JSON.stringify({ type: 'error', data: 'Server busy. Try again shortly.\r\n' }));
    ws.close();
    return;
  }

  const authTimeout = setTimeout(() => {
    if (!authenticated) {
      ws.send(JSON.stringify({ type: 'error', data: 'Auth timeout.\r\n' }));
      ws.close();
    }
  }, 5000);

  function startShell() {
    activeSessions++;
    ptyProcess = pty.spawn(SHELL_CMD, [], {
      name: 'xterm-256color',
      cols: 80,
      rows: 24,
      cwd: process.env.HOME || process.cwd(),
      env: process.env
    });

    ptyProcess.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'output', data }));
      }
    });

    ptyProcess.onExit(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'exit' }));
        ws.close();
      }
    });
  }

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    if (msg.type === 'auth') {
      if (!AUTH_TOKEN || msg.token === AUTH_TOKEN) {
        authenticated = true;
        clearTimeout(authTimeout);
        ws.send(JSON.stringify({ type: 'ready' }));
        startShell();
      } else {
        ws.send(JSON.stringify({ type: 'error', data: 'Auth failed.\r\n' }));
        ws.close();
      }
      return;
    }

    if (!authenticated || !ptyProcess) return; // ignore everything until authed

    if (msg.type === 'input') {
      ptyProcess.write(msg.data);
    } else if (msg.type === 'resize') {
      const { cols, rows } = msg;
      if (cols > 0 && rows > 0) ptyProcess.resize(cols, rows);
    }
  });

  ws.on('close', () => {
    clearTimeout(authTimeout);
    if (ptyProcess) {
      ptyProcess.kill();
      activeSessions--;
    }
  });
});

server.listen(PORT, () => {
  console.log(`web-terminal backend listening on :${PORT}`);
  if (!AUTH_TOKEN) {
    console.error('ERROR: AUTH_TOKEN not set — terminal connections are disabled until authentication is configured.');
  }
});
