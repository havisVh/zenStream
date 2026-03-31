import { Semaphore } from "https://deno.land/x/semaphore@v1.1.2/mod.ts";
import { probeMedia } from "./zenDecoder.ts";

const convert2HLS = async (inputPath: string, outputDir: string) => {
  // Safe-Mode: Use all but one CPU core to keep the PC responsive
  const hardwareCores = (navigator as any).hardwareConcurrency || 4;
  const concurrency = Math.max(1, hardwareCores - 1);
  const sem = new Semaphore(concurrency);

  // Try to find ffmpeg in standard path or related project
  const ffmpegPath = "ffmpeg";
  const staticFfmpeg = "C:\\Users\\USER\\Documents\\PROJECTS\\zenplayencoder\\node_modules\\ffmpeg-static\\ffmpeg.exe";
  
  let targetBinary = ffmpegPath;
  try {
     const checkCmd = new Deno.Command("where.exe", { args: ["ffmpeg.exe"] });
     const { code } = await checkCmd.output();
     if (code !== 0) {
        targetBinary = staticFfmpeg;
     }
  } catch (_) {
     targetBinary = staticFfmpeg;
  }

  try {
    await Deno.mkdir(outputDir, { recursive: true });

    // --- 1. PROBE: Find Best Streams and Strategy ---
    console.log(`Probing: ${inputPath}...`);
    const strategy = await probeMedia(inputPath);
    console.log(`Strategy: ${JSON.stringify(strategy)}`);

    const videoIdx = strategy.video.index;
    const audioTracks = strategy.audio;

    // --- 2. FAST SPLIT (Map video + all audio) ---
    console.log(`Splitting movie (Copy-Phase) with ${audioTracks.length} audio tracks...`);
    const mapArgs = ["-map", `0:${videoIdx}`];
    audioTracks.forEach((_, i) => mapArgs.push("-map", `0:${audioTracks[i].index}`));

    const splitCmd = new Deno.Command(targetBinary, {
      args: [
        "-i",
        inputPath,
        ...mapArgs,
        "-f",
        "segment",
        "-segment_time",
        "120", 
        "-c",
        "copy",
        "-reset_timestamps",
        "1",
        `${outputDir}/chunk_%03d.mkv`,
      ],
    });
    await splitCmd.output();

    const chunks: string[] = [];
    for await (const entry of Deno.readDir(outputDir)) {
      if (entry.name.startsWith("chunk_") && entry.name.endsWith(".mkv"))
        chunks.push(entry.name);
    }
    chunks.sort();

    // --- 3. PARALLEL CONVERSION (Extract Video and Audio separately for HLS) ---
    console.log(`Processing ${chunks.length} chunks with ${concurrency} workers...`);
    const tasks = chunks.map(async (chunk, index) => {
      const release = await sem.acquire();
      try {
        // 3a. Extract Video TS
        const videoCmd = new Deno.Command(targetBinary, {
          args: ["-i", `${outputDir}/${chunk}`, "-map", "0:v:0", "-c", "copy", "-f", "mpegts", `${outputDir}/video_${index}.ts`],
        });
        await videoCmd.output();

        // 3b. Extract Audio TS for each track (Transcode if needed)
        for (let a = 0; a < audioTracks.length; a++) {
            const track = audioTracks[a];
            const audioArgs = track.shouldCopy 
                ? ["-c:a", "copy"] 
                : ["-c:a", "aac", "-b:a", "192k", "-ac", "2"];
            
            const audioCmd = new Deno.Command(targetBinary, {
                args: ["-i", `${outputDir}/${chunk}`, "-map", `0:a:${a}`, ...audioArgs, "-f", "mpegts", `${outputDir}/audio_${a}_${index}.ts`],
            });
            await audioCmd.output();
        }

        await Deno.remove(`${outputDir}/${chunk}`);
      } finally {
        release();
      }
    });
    await Promise.all(tasks);

    // 4a. Process Video
    console.log("Stitching video segments...");
    const videoList = chunks.map((_, i) => `file 'video_${i}.ts'`).join("\n");
    await Deno.writeTextFile(`${outputDir}/video_list.txt`, videoList);
    const videoArgs = [
      "-f", "concat", "-safe", "0", "-i", `${outputDir}/video_list.txt`,
      "-c", "copy",
      "-f", "hls",
      "-hls_time", "10",
      "-hls_playlist_type", "vod",
      "-hls_segment_filename", `${outputDir}/video_seg_%03d.ts`,
      `${outputDir}/video.m3u8`
    ];
    await (new Deno.Command(targetBinary, { args: videoArgs })).output();

    // 4b. Process each Audio Track
    console.log("Stitching audio segments...");
    for (let a = 0; a < audioTracks.length; a++) {
        const audioList = chunks.map((_, i) => `file 'audio_${a}_${i}.ts'`).join("\n");
        await Deno.writeTextFile(`${outputDir}/audio_${a}_list.txt`, audioList);
        const audioArgs = [
          "-f", "concat", "-safe", "0", "-i", `${outputDir}/audio_${a}_list.txt`,
          "-c", "copy",
          "-f", "hls",
          "-hls_time", "10",
          "-hls_playlist_type", "vod",
          "-hls_segment_filename", `${outputDir}/audio_${a}_seg_%03d.ts`,
          `${outputDir}/audio_${a}.m3u8`
        ];
        await (new Deno.Command(targetBinary, { args: audioArgs })).output();
    }

    // 4c. Generate Master Playlist
    console.log("Creating master playlist...");
    const vCodec = strategy.video.codec;
    const isHevc = vCodec === "hevc" || vCodec === "hvc1";
    // For TS, many players don't need the complex codec string, but we provide a solid default
    const codecStr = isHevc ? 'hvc1.1.6.L120.90,mp4a.40.2' : 'avc1.640028,mp4a.40.2';

    let masterContent = "#EXTM3U\n#EXT-X-VERSION:3\n\n";
    audioTracks.forEach((track, a) => {
        const isDefault = a === 0 ? "YES" : "NO";
        masterContent += `#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="audio",LANGUAGE="${track.language}",NAME="${track.title}",DEFAULT=${isDefault},AUTOSELECT=YES,URI="audio_${a}.m3u8"\n`;
    });
    masterContent += `\n#EXT-X-STREAM-INF:BANDWIDTH=5000000,CODECS="${codecStr}",AUDIO="audio"\nvideo.m3u8\n`;
    await Deno.writeTextFile(`${outputDir}/master.m3u8`, masterContent);

    // Cleanup
    console.log("Cleaning up temporary files...");
    const filesToCleanup = [
        `${outputDir}/video_list.txt`,
        ...audioTracks.map((_, a) => `${outputDir}/audio_${a}_list.txt`),
        ...chunks.flatMap((_, i) => [`${outputDir}/video_${i}.ts`, ...audioTracks.map((_, a) => `${outputDir}/audio_${a}_${i}.ts`)])
    ];

    for (const f of filesToCleanup) {
        try { await Deno.remove(f); } catch (_) {}
    }

    return { status: true, message: "Success" };
  } catch (error: any) {
    console.error(`Conversion failed: ${error.message}`);
    return { status: false, message: error.message };
  }
};

const isHLSConverted = (outputDir: string): boolean => {
  try {
    return Deno.statSync(`${outputDir}/master.m3u8`).isFile;
  } catch {
    return false;
  }
};

export { convert2HLS, isHLSConverted };
