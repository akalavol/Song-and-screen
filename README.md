# 🎬 Screen Recorder MP4

A simple desktop screen recorder that captures your screen and audio directly to MP4 format with a minimal UI.

## Features

- 🎥 Screen capture in MP4 format
- 🔊 Audio recording (system audio + microphone)
- 🖥️ Cross-platform support (Linux, macOS, Windows)
- 🎨 Minimal web-based UI
- 💾 Output saved to `output/` folder
- ⌨️ Command-line interface

## Requirements

- **Node.js** (v16+)
- **ffmpeg** (must be installed and in PATH, or set `FFMPEG_PATH` environment variable)

### Install ffmpeg

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install ffmpeg
```

**macOS:**
```bash
brew install ffmpeg
```

**Windows:**
The app will automatically search common locations. Otherwise:
- Download from [ffmpeg.org](https://ffmpeg.org/download.html)
- Or install via: `choco install ffmpeg`
- Or set `FFMPEG_PATH` environment variable to your ffmpeg.exe location

**Manual Path (Windows):**
```cmd
set FFMPEG_PATH=C:\path\to\ffmpeg\bin\ffmpeg.exe
npm start
```

## Installation

```bash
npm install
```

## Usage

### Via Command Line

```bash
npm run cli
```

This will start the server and automatically open the UI in your default browser.

### Via Node

```bash
npm start
```

Then open your browser to `http://localhost:3000`

## API Endpoints

- `GET /` - Serve the UI
- `GET /api/status` - Get current recording status
- `POST /api/start` - Start recording
- `POST /api/stop` - Stop recording

## Output

Recordings are saved to the `output/` folder with timestamps:
```
output/screen-2026-09-18T123045.mp4
```

## License

MIT
