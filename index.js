#!/usr/bin/env node

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { createFFmpeg, ensureFFmpeg } from './lib/recorder.js';
import { getDisplayConfig } from './lib/platform.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

let ffmpegProcess = null;
let isRecording = false;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

const outputDir = path.join(__dirname, 'output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

app.get('/api/status', (req, res) => {
  res.json({ recording: isRecording });
});

app.post('/api/start', (req, res) => {
  if (isRecording) {
    return res.status(400).json({ error: 'Already recording' });
  }

  try {
    ensureFFmpeg();

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `screen-${timestamp}.mp4`;
    const filepath = path.join(outputDir, filename);

    const displayConfig = getDisplayConfig();

    // If screen only requested, remove audio from config
    const recordingConfig = req.body?.screenOnly ? {
      ...displayConfig,
      audioFormat: null,
      audioInput: null,
      audioDevice: null
    } : displayConfig;

    ffmpegProcess = createFFmpeg(recordingConfig, filepath, (error) => {
      if (error && isRecording) {
        console.error('Recording error:', error);
        isRecording = false;
        ffmpegProcess = null;
      }
    });

    isRecording = true;
    res.json({ recording: true, filename, screenOnly: req.body?.screenOnly });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/stop', (req, res) => {
  if (!isRecording || !ffmpegProcess) {
    return res.status(400).json({ error: 'Not recording' });
  }

  isRecording = false;

  // Send 'q' to stdin to gracefully stop ffmpeg
  if (ffmpegProcess.stdin) {
    ffmpegProcess.stdin.write('q');
  } else {
    // Fallback to SIGTERM
    ffmpegProcess.kill('SIGTERM');
  }

  // Wait for process to finish (max 5 seconds)
  const timeout = setTimeout(() => {
    if (ffmpegProcess) {
      console.warn('Force killing ffmpeg (timeout)');
      ffmpegProcess.kill('SIGKILL');
    }
  }, 5000);

  ffmpegProcess.on('close', () => {
    clearTimeout(timeout);
    ffmpegProcess = null;
  });

  res.json({ recording: false });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const server = app.listen(PORT, () => {
  try {
    ensureFFmpeg();
    console.log(`✅ Screen Recorder running at http://localhost:${PORT}`);
    console.log(`📁 Recordings will be saved to: ${outputDir}`);
  } catch (error) {
    console.error(`\n⚠️  ${error.message}\n`);
  }
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.warn(`⚠️  Port ${PORT} is already in use, trying next port...`);
    const newPort = PORT + 1;
    process.env.PORT = newPort;
    app.listen(newPort, () => {
      console.log(`✅ Screen Recorder running at http://localhost:${newPort}`);
      console.log(`📁 Recordings will be saved to: ${outputDir}`);
    });
  } else {
    throw error;
  }
});
