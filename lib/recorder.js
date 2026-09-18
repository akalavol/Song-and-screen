import { spawn } from 'child_process';
import { execSync } from 'child_process';
import { platform } from 'os';
import path from 'path';

function checkFFmpeg() {
  try {
    execSync('ffmpeg -version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function findFFmpegOnWindows() {
  const commonPaths = [
    'C:\\ffmpeg\\bin\\ffmpeg.exe',
    'C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe',
    'C:\\Program Files (x86)\\ffmpeg\\bin\\ffmpeg.exe',
    process.env.FFMPEG_PATH
  ].filter(Boolean);

  for (const p of commonPaths) {
    try {
      execSync(`"${p}" -version`, { stdio: 'ignore' });
      return p;
    } catch {
      // continue
    }
  }
  return null;
}

export function ensureFFmpeg() {
  if (checkFFmpeg()) return;

  // Try Windows-specific paths
  if (platform() === 'win32') {
    const ffmpegPath = findFFmpegOnWindows();
    if (ffmpegPath) {
      process.env.PATH = path.dirname(ffmpegPath) + ';' + process.env.PATH;
      if (checkFFmpeg()) return;
    }
  }

  throw new Error(
    'ffmpeg not found. Please install ffmpeg:\n' +
    '  Linux: sudo apt-get install ffmpeg\n' +
    '  macOS: brew install ffmpeg\n' +
    '  Windows: Download from ffmpeg.org or: choco install ffmpeg\n' +
    '\nOr set FFMPEG_PATH environment variable.'
  );
}

export function createFFmpeg(displayConfig, filepath, errorCallback) {
  const args = [
    '-f', displayConfig.screenFormat,
    '-i', displayConfig.screenInput,
    '-f', displayConfig.audioFormat,
    '-i', displayConfig.audioInput,
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-crf', '23',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-pix_fmt', 'yuv420p',
    filepath
  ];

  let ffmpegCmd = 'ffmpeg';

  if (platform() === 'win32') {
    const ffmpegPath = findFFmpegOnWindows();
    if (ffmpegPath) {
      ffmpegCmd = ffmpegPath;
    }
  }

  const ffmpeg = spawn(ffmpegCmd, args);

  ffmpeg.stderr.on('data', (data) => {
    if (process.env.DEBUG) {
      console.error(`ffmpeg: ${data}`);
    }
  });

  ffmpeg.on('error', (error) => {
    errorCallback(error);
  });

  ffmpeg.on('close', (code) => {
    if (code !== 0 && code !== null) {
      errorCallback(new Error(`ffmpeg exited with code ${code}`));
    }
  });

  return ffmpeg;
}
