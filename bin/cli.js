#!/usr/bin/env node

import open from 'open';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import { ensureFFmpeg } from '../lib/recorder.js';

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
  try {
    ensureFFmpeg();
  } catch (error) {
    console.error(`\n${error.message}\n`);
    process.exit(1);
  }

  console.log('🎬 Starting Screen Recorder...');

  let actualPort = PORT;
  let serverReady = false;

  const child = spawn('node', [path.join(__dirname, '..', 'index.js')], {
    cwd: path.join(__dirname, '..'),
    stdio: ['inherit', 'pipe', 'pipe']
  });

  child.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(output);

    if (output.includes('running at http://localhost:')) {
      const match = output.match(/localhost:(\d+)/);
      if (match) {
        actualPort = parseInt(match[1]);
        serverReady = true;
      }
    }
  });

  child.stderr.on('data', (data) => {
    console.error(data.toString());
  });

  process.on('SIGINT', () => {
    console.log('\n👋 Shutting down...');
    child.kill();
    process.exit(0);
  });

  try {
    await new Promise((resolve) => {
      const check = setInterval(() => {
        if (serverReady) {
          clearInterval(check);
          resolve();
        }
      }, 100);
    });

    console.log(`✅ Opening http://localhost:${actualPort}`);
    await open(`http://localhost:${actualPort}`);
  } catch (error) {
    console.error('Failed to start:', error.message);
    process.exit(1);
  }
}

main();
