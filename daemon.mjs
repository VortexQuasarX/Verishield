import { spawn } from 'child_process';
import { writeFileSync, readFileSync, existsSync, openSync } from 'fs';

const PID_FILE = '/home/z/my-project/server.pid';
const LOG_FILE = '/home/z/my-project/dev.log';

// Kill old server
if (existsSync(PID_FILE)) {
  try {
    const oldPid = parseInt(readFileSync(PID_FILE, 'utf-8').trim());
    process.kill(oldPid, 'SIGKILL');
  } catch {}
}

const logFd = openSync(LOG_FILE, 'a');

const child = spawn('node', ['node_modules/next/dist/bin/next', 'dev', '-p', '3000'], {
  cwd: '/home/z/my-project',
  stdio: ['ignore', logFd, logFd],
  detached: true,
  env: { ...process.env }
});

child.unref();
writeFileSync(PID_FILE, String(child.pid));
console.log(`Started Next.js server with PID ${child.pid}`);
