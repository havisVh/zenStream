
interface StreamInfo {
  index: number;
  codec_name: string;
  channels?: number;
  width?: number;
  height?: number;
  tags?: Record<string, string>;
}

interface AudioStrategy {
  index: number;
  codec: string;
  shouldCopy: boolean;
  needsDownmix: boolean;
  language: string;
  title: string;
}

interface MediaStrategy {
  video: {
    index: number;
    codec: string;
    shouldCopy: boolean;
    resolution: string;
  };
  audio: AudioStrategy[];
  duration: number;
}

const getMediaStrategy = (streams: StreamInfo[], format: any): MediaStrategy => {
  const videoStream = streams.find((s) => s.codec_name === "h264" || s.codec_name === "hevc" || s.codec_name === "vp9") || 
                      streams.find((s) => s.codec_name === "video") || 
                      streams[0];
  
  const audioStreams = streams.filter((s) => s.channels !== undefined);

  if (!videoStream || audioStreams.length === 0) {
    throw new Error("Could not find valid video or audio streams.");
  }

  const duration = parseFloat(format.duration) || 0;
  const resolution = videoStream.width ? `${videoStream.width}x${videoStream.height}` : "unknown";

  const audioStrategies: AudioStrategy[] = audioStreams.map((s, idx) => {
    const lang = s.tags?.language || "und";
    const title = s.tags?.title || `Track ${idx + 1}`;
    return {
      index: s.index,
      codec: s.codec_name,
      shouldCopy: s.codec_name === "aac" && s.channels === 2,
      needsDownmix: (s.channels || 0) > 2,
      language: lang,
      title: title,
    };
  });

  return {
    video: {
      index: videoStream.index,
      codec: videoStream.codec_name,
      shouldCopy: true,
      resolution,
    },
    audio: audioStrategies,
    duration,
  };
};

const probeMedia = async (inputPath: string): Promise<MediaStrategy> => {
  const decoder = new TextDecoder();
  
  // Try to find ffprobe in standard path or related project
  const ffprobePath = "ffprobe";
  const staticPath = "C:\\Users\\USER\\Documents\\PROJECTS\\zenplayencoder\\node_modules\\ffprobe-static\\bin\\win32\\x64\\ffprobe.exe";
  
  let targetBinary = ffprobePath;
  try {
     const checkCmd = new Deno.Command("where.exe", { args: ["ffprobe.exe"] });
     const { code } = await checkCmd.output();
     if (code !== 0) {
        targetBinary = staticPath;
     }
  } catch (_) {
     targetBinary = staticPath;
  }

  const probeCmd = new Deno.Command(targetBinary, {
    args: [
      "-v",
      "error",
      "-show_entries",
      "format=duration:stream=index,codec_name,channels,width,height:stream_tags=language,title",
      "-of",
      "json",
      inputPath,
    ],
  });

  const { stdout, stderr } = await probeCmd.output();
  if (stderr.length > 0) {
    const errorMsg = decoder.decode(stderr);
    console.warn(`ffprobe warning/error: ${errorMsg}`);
  }

  const data = JSON.parse(decoder.decode(stdout));
  return getMediaStrategy(data.streams || [], data.format || {});
};

export { probeMedia, getMediaStrategy };
export type { MediaStrategy, StreamInfo };
