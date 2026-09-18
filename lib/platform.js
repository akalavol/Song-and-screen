import { platform } from 'os';
import { execSync } from 'child_process';

export function getDisplayConfig() {
  const os = platform();

  if (os === 'linux') {
    return getLinuxConfig();
  } else if (os === 'darwin') {
    return getMacConfig();
  } else if (os === 'win32') {
    return getWindowsConfig();
  }

  throw new Error(`Unsupported platform: ${os}`);
}

function getLinuxConfig() {
  let display = process.env.DISPLAY || ':0';

  try {
    const displays = execSync('ps e | grep -oP "DISPLAY=:[^ ]*" | head -1')
      .toString()
      .trim()
      .replace('DISPLAY=', '');
    if (displays) display = displays;
  } catch (e) {
    // Fall back to default
  }

  return {
    screenFormat: 'x11grab',
    screenInput: `${display}`,
    audioFormat: 'pulse',
    audioInput: 'default'
  };
}

function getMacConfig() {
  return {
    screenFormat: 'avfoundation',
    screenInput: '1:',
    audioFormat: 'avfoundation',
    audioInput: ':0'
  };
}

function getWindowsConfig() {
  let audioInput = null;

  try {
    // List available audio devices
    const output = execSync('ffmpeg -list_devices true -f dshow -i dummy 2>&1', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    }).toLowerCase();

    // Try to find a microphone or audio input device
    if (output.includes('microphone')) {
      audioInput = 'Microphone';
    } else if (output.includes('stereo mix')) {
      audioInput = 'Stereo Mix';
    } else if (output.includes('audio')) {
      const match = output.match(/"([^"]*audio[^"]*)"/i);
      if (match) {
        audioInput = match[1];
      }
    }
  } catch (e) {
    // Fall back to default
  }

  // If no audio device found, use default or disable audio capture
  if (!audioInput) {
    audioInput = 'Microphone';
  }

  return {
    screenFormat: 'gdigrab',
    screenInput: 'desktop',
    audioFormat: 'dshow',
    audioInput: audioInput,
    audioDevice: `audio="${audioInput}"`
  };
}
