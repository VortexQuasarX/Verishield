import { spawn } from 'child_process';
import { writeFileSync } from 'fs';

const PID_FILE = '/home/z/my-project/server.pid';

function startServer() {
  const child = spawn('node', ['node_modules/next/dist/bin/next', 'dev', '-p', '3000'], {
    cwd: '/home/z/my-project',
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true,
  });
  
  writeFileSync(PID_FILE, String(child.pid));
  
  child.stdout.on('data', (data) => {
    process.stdout.write(data);
  });
  
  child.stderr.on('data', (data) => {
    process.stderr.write(data);
  });
  
  child.on('exit', (code) => {
    console.log(`Server exited with code ${code}, restarting in 3s...`);
    setTimeout(startServer, 3000);
  });
}

startServer();
