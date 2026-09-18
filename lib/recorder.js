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
  // Build simple, reliable ffmpeg command
  const args = [
    '-nostdin',  // Critical: disable interactive mode for spawn()
    '-f', displayConfig.screenFormat,
    '-framerate', '30'
  ];

  // Screen input
  if (displayConfig.screenFormat === 'gdigrab') {
    args.push('-i', displayConfig.screenInput);
  } else {
    args.push('-i', displayConfig.screenInput);
  }

  // Audio input (if available)
  if (displayConfig.audioFormat && displayConfig.audioInput) {
    args.push('-f', displayConfig.audioFormat);
    args.push('-i', displayConfig.audioInput);
  }

  // Video encoding
  args.push('-c:v', 'mpeg4', '-q:v', '5', '-pix_fmt', 'yuv420p');

  // Audio encoding (if we have audio)
  if (displayConfig.audioFormat && displayConfig.audioInput) {
    args.push('-c:a', 'libmp3lame', '-b:a', '192k');
  }

  // Output
  args.push('-y', filepath);

  let ffmpegCmd = 'ffmpeg';

  if (platform() === 'win32') {
    const ffmpegPath = findFFmpegOnWindows();
    if (ffmpegPath) {
      ffmpegCmd = ffmpegPath;
    }
  }

  console.log(`\n🎬 Starting ffmpeg with command:`);
  console.log(`${ffmpegCmd} ${args.join(' ')}\n`);

  const ffmpeg = spawn(ffmpegCmd, args);

  let stderrData = '';
  ffmpeg.stderr.on('data', (data) => {
    const output = data.toString();
    stderrData += output;
    console.log(`[ffmpeg] ${output}`);
  });

  ffmpeg.on('error', (error) => {
    errorCallback(error);
  });

  ffmpeg.on('close', (code) => {
    if (code !== 0 && code !== null) {
      let errorMsg = `ffmpeg exited with code ${code}`;
      if (stderrData.includes('Unknown encoder')) {
        errorMsg += '\nCodec not available. Try installing ffmpeg with libx264 support.';
      }
      if (stderrData.includes('Device not found')) {
        errorMsg += '\nAudio device not found. Try recording without audio or check audio device settings.';
      }
      errorCallback(new Error(errorMsg));
    }
  });

  return ffmpeg;
}
