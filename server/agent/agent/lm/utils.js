const parseJson = (raw, label = "json") => {
  const input = String(raw ?? "");
  if (!input) {
    throw new Error(`Invalid JSON in ${label}: empty input`);
  }
  try {
    return JSON.parse(input);
  } catch (error) {
    throw new Error(`Invalid JSON in ${label}: ${error.message}`);
  }
};

export { parseJson };
