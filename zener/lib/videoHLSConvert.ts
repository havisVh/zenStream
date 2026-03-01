import { Semaphore } from "https://deno.land/x/semaphore@v1.1.2/mod.ts";

const convert2HLS = async (inputPath: string, outputDir: string) => {
    const decoder = new TextDecoder();
    const sem = new Semaphore(4);

    try {
        await Deno.mkdir(outputDir, { recursive: true });

        // --- 1. PROBE: Find ONLY AAC Stereo ---
        const probeCmd = new Deno.Command("ffprobe", {
            args: ["-v", "error", "-show_entries", "stream=index,codec_name,channels", "-select_streams", "a", "-of", "json", inputPath],
        });
        const { stdout: probeOut } = await probeCmd.output();
        const allAudio = JSON.parse(decoder.decode(probeOut)).streams || [];
        
        // Find the index of the first AAC stereo track
        const targetAudio = allAudio.find((s: any) => s.codec_name === "aac" && s.channels === 2);
        
        if (!targetAudio) {
            return { status: false, message: "No AAC Stereo track found. Approach requires pre-existing AAC stereo." };
        }
        
        const audioIdx = targetAudio.index;
        console.log(`Found AAC Stereo at stream index ${audioIdx}.`);

        // --- 2. FAST SPLIT (Now mapping only the target audio) ---
        console.log("Splitting movie...");
        const splitCmd = new Deno.Command("ffmpeg", {
            args: [
                "-i", inputPath,
                "-map", "0:v:0", "-map", `0:${audioIdx}`, // Only take one video, one audio
                "-f", "segment", "-segment_time", "600",
                "-c", "copy", "-reset_timestamps", "1",
                `${outputDir}/chunk_%03d.mkv`
            ],
        });
        await splitCmd.output();

        const chunks = [];
        for await (const entry of Deno.readDir(outputDir)) {
            if (entry.name.startsWith("chunk_") && entry.name.endsWith(".mkv")) chunks.push(entry.name);
        }
        chunks.sort();

        // --- 3. PARALLEL TS CONVERSION ---
        const tasks = chunks.map(async (chunk, index) => {
            const release = await sem.acquire();
            try {
                const cmd = new Deno.Command("ffmpeg", {
                    args: [
                        "-i", `${outputDir}/${chunk}`,
                        "-c", "copy", // Instant copy because we know audio is already AAC
                        "-f", "mpegts",
                        `${outputDir}/part_${index}.ts`
                    ]
                });
                await cmd.output();
                await Deno.remove(`${outputDir}/${chunk}`);
            } finally { release(); }
        });
        await Promise.all(tasks);

        // --- 4. STITCH & HLS (With fixed tags) ---
        const listContent = chunks.map((_, i) => `file 'part_${i}.ts'`).join("\n");
        const listPath = `${outputDir}/concat_list.txt`;
        await Deno.writeTextFile(listPath, listContent);

        const stitchArgs = [
            "-f", "concat", "-safe", "0", "-i", listPath,
            "-map", "0:v:0", "-map", "0:a:0",
            "-c", "copy",
            "-tag:v", "hvc1",             // Fixed Tag
            "-bsf:a", "aac_adtstoasc",    // Fixed Bitstream
            "-copyts", "-start_at_zero",
            "-f", "hls",
            "-hls_time", "10",
            "-hls_playlist_type", "vod",
            "-hls_flags", "independent_segments",
            "-master_pl_name", "master.m3u8",
            "-var_stream_map", "v:0,a:0,name:Stereo",
            "-hls_segment_filename", `${outputDir}/stream_%v_%03d.m4s`,
            "-hls_segment_type", "fmp4",
            `${outputDir}/stream_%v.m3u8`
        ];

        const finalCmd = new Deno.Command("ffmpeg", { args: stitchArgs });
        const result = await finalCmd.output();

        // Cleanup
        await Deno.remove(listPath);
        for (let i = 0; i < chunks.length; i++) await Deno.remove(`${outputDir}/part_${i}.ts`);

        return { status: result.code === 0, message: result.code === 0 ? "Success" : "Stitch failed" };

    } catch (error: any) {
        return { status: false, message: error.message };
    }
}

const isHLSConverted = (outputDir: string): boolean => {
  try {
    return Deno.statSync(`${outputDir}/master.m3u8`).isFile;
  } catch {
    return false;
  }
};

export { convert2HLS, isHLSConverted };

