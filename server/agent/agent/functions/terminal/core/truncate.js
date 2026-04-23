const DEFAULT_MAX_OUTPUT_CHARS = 20000;

const truncateOutput = (output, maxOutputChars = DEFAULT_MAX_OUTPUT_CHARS) => {
  const content = String(output ?? "");
  const limit = Math.max(0, Number(maxOutputChars) || DEFAULT_MAX_OUTPUT_CHARS);

  if (limit === 0 || content.length <= limit) {
    return {
      content,
      truncated: false,
      omittedChars: 0,
    };
  }

  const omittedChars = content.length - limit;
  return {
    content: content.slice(-limit),
    truncated: true,
    omittedChars,
  };
};

export { truncateOutput };
