const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const backupPath = path.join(__dirname, 'temp_hidden_confession.json');

if (!fs.existsSync(backupPath)) {
  console.log('No active temp_hidden_confession.json found to schedule.');
  process.exit(0);
}

const data = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));
const targetTime = new Date(data.restoreAfter).getTime();
const now = Date.now();
const delayMs = Math.max(0, targetTime - now);

console.log(`[Scheduled Restore Runner] Started.`);
console.log(`Current time: ${new Date().toISOString()}`);
console.log(`Target restore time: ${new Date(targetTime).toISOString()}`);
console.log(`Waiting ${(delayMs / 1000 / 60 / 60).toFixed(2)} hours (${Math.round(delayMs / 1000)} seconds)...`);

setTimeout(() => {
  console.log(`[Scheduled Restore Runner] 6 hours elapsed! Running restoration...`);
  const restoreProc = spawn('node', [path.join(__dirname, 'restore_hidden_confession.cjs')], {
    stdio: 'inherit'
  });
  restoreProc.on('exit', (code) => {
    console.log(`[Scheduled Restore Runner] Restore process exited with code ${code}`);
    process.exit(code);
  });
}, delayMs);
