const handleHealthGet = async (_req, res, { sendJson }, { port }) => {
  sendJson(res, 200, { ok: true, port });
};

export { handleHealthGet };
