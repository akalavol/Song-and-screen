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
  // Windows: screen only by default (audio causes issues)
  return {
    screenFormat: 'gdigrab',
    screenInput: 'desktop',
    audioFormat: null,
    audioInput: null,
    audioDevice: null
  };
}
