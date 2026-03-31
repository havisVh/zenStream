import { convert2HLS } from "./zener/lib/videoHLSConvert.ts";
import { join } from "https://deno.land/std@0.201.0/path/join.ts";

const inputPath = Deno.args[0];
const movieID = Deno.args[1] || "Output_Movie";

if (!inputPath) {
  console.error("Usage: deno run --allow-all process_movie.ts <path_to_movie> [movie_id]");
  Deno.exit(1);
}

const outputDir = join(Deno.cwd(), "hls_output", movieID);

console.log(`Starting conversion for: ${inputPath}`);
console.log(`Output directory: ${outputDir}`);

const result = await convert2HLS(inputPath, outputDir);

if (result.status) {
  console.log("Conversion successful!");
  console.log(`Master playlist: ${join(outputDir, "master.m3u8")}`);
} else {
  console.error("Conversion failed:", result.message);
}
