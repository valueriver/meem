const parseSseStream = async (stream, onEvent) => {
  const decoder = new TextDecoder("utf-8");
  let buffer = "";
  let event = "message";
  let data = "";

  const dispatch = () => {
    if (!data) {
      event = "message";
      return;
    }
    let parsed = data;
    try {
      parsed = JSON.parse(data);
    } catch {
      // keep raw text
    }
    onEvent(event, parsed);
    event = "message";
    data = "";
  };

  for await (const chunk of stream) {
    buffer += decoder.decode(chunk, { stream: true });
    let idx;
    while ((idx = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, idx).replace(/\r$/, "");
      buffer = buffer.slice(idx + 1);
      if (!line) {
        dispatch();
      } else if (line.startsWith("event:")) {
        event = line.slice(6).trim() || "message";
      } else if (line.startsWith("data:")) {
        const part = line.slice(5).trim();
        data = data ? `${data}\n${part}` : part;
      }
    }
  }
  dispatch();
};

export {
  parseSseStream
};
