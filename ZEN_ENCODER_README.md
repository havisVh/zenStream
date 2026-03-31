# ZenStream Multi-Audio HLS Encoder

A high-performance, automated HLS encoding engine built with Deno and FFmpeg. This system is designed to handle complex media files (like WEB-DLs) specifically for seamless streaming in a browser-based media server.

## 🚀 Key Features

### 1. High-Performance "Divide and Conquer" Encoding
Instead of encoding a large movie file sequentially (which can take hours), this engine:
- **Splits** the video into 2-minute chunks nearly instantly (using Stream Copy).
- **Processes** those chunks in parallel using your CPU's available cores.
- **Stitches** the final segments into a unified HLS stream (`.m3u8`).
- **Safe-Mode**: Automatically leaves one CPU core free so your PC stays responsive during the process.

### 2. Intelligent ZenDecoder (The "Brain")
Before encoding, the `ZenDecoder` probes the file to:
- **Detect all audio tracks** and their languages.
- **Determine the best strategy**: It only transcodes audio if necessary (e.g., non-AAC or >2 channels) and downmixes to Stereo for maximum player compatibility.
- **Extract Metadata**: Pulls language tags and titles to correctly label tracks in the HLS player.

### 3. Native Multi-Audio Support
The encoder now supports multiple audio tracks (English, Hindi, Malayalam, etc.) in a single HLS stream:
- Each audio track gets its own dedicated HLS playlist.
- All tracks are synced and selectable in the player's audio menu.
- Standard HLS (TS segments) ensures compatibility across VLC, browsers, and mobile devices.

### 4. Zero Path Dependency
The system proactively looks for static FFmpeg/FFprobe binaries in sibling projects (like `zenplayencoder`) if they aren't installed in the system global Path.

---

## 🛠️ Usage

To process any movie file manually, use the `process_movie.ts` script:

```powershell
deno run --allow-all process_movie.ts "<FULL_PATH_TO_MOVIE>" "<MOVIE_ID>"
```

### Example:
```powershell
deno run --allow-all process_movie.ts "C:\Users\Downloads\BigBuckBunny.mkv" "BigBuckBunny_2024"
```

The output will be generated in `hls_output/<MOVIE_ID>/master.m3u8`.

---

## 🏗️ Architecture

1.  **Probe Phase**: `ZenDecoder` analyzes streams.
2.  **Split Phase**: FFmpeg splits the source into `.mkv` chunks (Copy Mode).
3.  **Parallel Phase**: Chunks are converted to `.ts` segments (Video Copy + Audio Transcode).
4.  **Stitch Phase**: Segments are unified into HLS playlists for video and each audio track.
5.  **Manifest Phase**: A master playlist links all streams together.
