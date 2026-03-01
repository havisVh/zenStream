import ollama from "ollama";
import { config } from "../configParser.ts";
import { json } from "node:stream/consumers";

interface MetaData {
  title: string;
  year: string;
  language: string;
}

const formatData = (data: string) => {
  
  if (data.includes(".")) {
    const lines = data
      .replace("```json", "")
      .replace("```", "")
      .replaceAll(".", " ")
      .split("\n");
    const jsonString = lines.join("");
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      console.error("Failed to parse JSON:", error);
      return null;
    }
  } else {
    try {
      const lines = data.replace("```json", "").replace("```", "").split("\n");
      const jsonString = lines.join("");

      return JSON.parse(jsonString);
    } catch (error) {
      console.error("Failed to parse JSON:", error);
      return null;
    }
  }
};

const metaExtract = async (text: string): Promise<MetaData> => {
  if (!config.ollama) {
    throw new Error("Ollama integration is disabled in the config.");
  } else {
    const prompt = `Extract {title, year, language, fileType, fileFormat} as raw JSON from: "${text}".

Rules:
1. "title" must ONLY be the Movie Name. Example: "Movie Name".
2. Stop the "title" before technical terms like 1080p, 10bit, x265, HEVC, or WEBRip.
3. "fileType" and "fileFormat" must be lowercase ("video"/"audio" and "mkv"/"mp4" etc).
4. If a field is missing, use "". No talk, just raw JSON.`;

    const response = await ollama.chat({
      model: config.ollamaModel,
      messages: [{ role: "user", content: prompt }],
      stream: false,
    });

    return formatData(response.message.content);
  }
};

export { metaExtract };
