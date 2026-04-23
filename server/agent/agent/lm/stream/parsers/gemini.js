import { openaiParser } from "./openai.js";

const geminiParser = {
  createState: openaiParser.createState,
  parseChunk: openaiParser.parseChunk,
  toMessage: openaiParser.toMessage
};

export { geminiParser };
