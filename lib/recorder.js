import { spawn } from 'child_process';

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

  const ffmpeg = spawn('ffmpeg', args);

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
