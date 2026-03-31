import { probeMedia } from "./zener/lib/zenDecoder.ts";

const inputPath = "C:\\Users\\USER\\Downloads\\Telegram Desktop\\[CT™].Thattathin.Marayathu.2012.1080p.AMZN.WEBDL.mkv";

try {
  console.log(`Probing movie: ${inputPath}`);
  const strategy = await probeMedia(inputPath);
  console.log("Encoding Strategy:");
  console.log(JSON.stringify(strategy, null, 2));
} catch (error) {
  console.error("Probing failed:", error.message);
}
