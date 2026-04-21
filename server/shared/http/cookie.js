const parseCookieHeader = (cookieHeader = "") => {
  const result = {};
  if (!cookieHeader) return result;
  const parts = String(cookieHeader).split(";");
  for (const part of parts) {
    const index = part.indexOf("=");
    if (index <= 0) continue;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (!key) continue;
    if (result[key] !== void 0) continue;
    try {
      result[key] = decodeURIComponent(value);
    } catch {
      continue;
    }
  }
  return result;
};
const serializeCookie = (name, value, options = {}) => {
  const segments = [`${name}=${encodeURIComponent(value)}`];
  segments.push(`Path=${options.path || "/"}`);
  if (typeof options.maxAge === "number") segments.push(`Max-Age=${Math.max(0, Math.floor(options.maxAge))}`);
  if (options.httpOnly !== false) segments.push("HttpOnly");
  if (options.sameSite) segments.push(`SameSite=${options.sameSite}`);
  if (options.secure) segments.push("Secure");
  return segments.join("; ");
};
export {
  parseCookieHeader,
  serializeCookie
};
