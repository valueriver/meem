import { openaiParser } from "./openai.js";

const createState = () => ({
  ...openaiParser.createState(),
  reasoning_content: ""
});

const parseChunk = (json, state, onDelta) => {
  const choice = json?.choices?.[0];
  const delta = choice?.delta || {};
  if (typeof delta.reasoning_content === "string") {
    state.reasoning_content += delta.reasoning_content;
  }
  openaiParser.parseChunk(json, state, onDelta);
};

const toMessage = (state) => {
  const message = openaiParser.toMessage(state);
  if (state.reasoning_content) {
    message.reasoning_content = state.reasoning_content;
  }
  return message;
};

const kimiParser = {
  createState,
  parseChunk,
  toMessage
};

export { kimiParser };
