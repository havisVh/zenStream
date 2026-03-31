import { assertEquals } from "@std/assert";
import { getMediaStrategy, StreamInfo } from "./zener/lib/zenDecoder.ts";

Deno.test("getMediaStrategy - AAC Stereo (Copy)", () => {
  const streams: StreamInfo[] = [
    { index: 0, codec_name: "h264" },
    { index: 1, codec_name: "aac", channels: 2 }
  ];
  const strategy = getMediaStrategy(streams);
  
  assertEquals(strategy.video.index, 0);
  assertEquals(strategy.audio[0].index, 1);
  assertEquals(strategy.audio[0].shouldCopy, true);
  assertEquals(strategy.audio[0].needsDownmix, false);
});

Deno.test("getMediaStrategy - AC3 5.1 (Transcode + Downmix)", () => {
  const streams: StreamInfo[] = [
    { index: 0, codec_name: "hevc" },
    { index: 1, codec_name: "ac3", channels: 6 }
  ];
  const strategy = getMediaStrategy(streams);
  
  assertEquals(strategy.video.index, 0);
  assertEquals(strategy.audio[0].index, 1);
  assertEquals(strategy.audio[0].shouldCopy, false);
  assertEquals(strategy.audio[0].needsDownmix, true);
});

Deno.test("getMediaStrategy - Preferred Video Stream (HEVC over H264)", () => {
  const streams: StreamInfo[] = [
    { index: 0, codec_name: "hevc" },
    { index: 1, codec_name: "h264" },
    { index: 2, codec_name: "aac", channels: 2 }
  ];
  const strategy = getMediaStrategy(streams);
  assertEquals(strategy.video.index, 0);
});

Deno.test("getMediaStrategy - Fallback Audio (Non-AAC)", () => {
    const streams: StreamInfo[] = [
      { index: 0, codec_name: "h264" },
      { index: 1, codec_name: "mp3", channels: 2 }
    ];
    const strategy = getMediaStrategy(streams);
    assertEquals(strategy.audio[0].index, 1);
    assertEquals(strategy.audio[0].shouldCopy, false);
});
