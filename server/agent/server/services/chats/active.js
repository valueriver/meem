const normalizeConversationId = (conversationId) => {
  const value = String(conversationId || "").trim();
  if (!value) {
    throw new Error(`invalid conversationId: ${conversationId}`);
  }
  return value;
};

export { normalizeConversationId };
