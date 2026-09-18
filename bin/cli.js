#!/usr/bin/env node

import open from 'open';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;

function checkServerReady() {
  return new Promise((resolve) => {
    const interval = setInterval(() => {
      const req = http.get(`http://localhost:${PORT}`, (res) => {
        clearInterval(interval);
        resolve();
      }).on('error', () => {
        // Server not ready yet
      });
      req.end();
    }, 500);
  });
}

async function main() {
  console.log('🎬 Starting Screen Recorder...');

  const child = spawn('node', [path.join(__dirname, '..', 'index.js')], {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit'
  });

  process.on('SIGINT', () => {
    console.log('\n👋 Shutting down...');
    child.kill();
    process.exit(0);
  });

  try {
    await checkServerReady();
    console.log(`✅ Server ready! Opening http://localhost:${PORT}`);
    await open(`http://localhost:${PORT}`);
  } catch (error) {
    console.error('Failed to start:', error.message);
    process.exit(1);
  }
}

main();
