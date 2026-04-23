const LOOPBACK_PREFIXES = ["127.", "::1", "::ffff:127."];

const readHeader = (req, name) => String(req.headers?.[name] || "").trim();

const firstHeaderValue = (value) => String(value || "")
  .split(",")
  .map((part) => part.trim())
  .filter(Boolean)[0] || "";

const isLoopbackAddress = (value) => {
  const address = String(value || "").trim().toLowerCase();
  if (!address) return true;
  return LOOPBACK_PREFIXES.some((prefix) => address.startsWith(prefix));
};

const relayTransportLabel = (role) => {
  if (role === "browser-http" || role === "browser-ws") return "relay";
  return "";
};

const getConnectionInfo = (req) => {
  const remoteAddress = String(req.socket?.remoteAddress || "").trim();
  const forwardedForRaw =
    readHeader(req, "x-forwarded-for") ||
    readHeader(req, "cf-connecting-ip") ||
    readHeader(req, "x-real-ip");
  const forwardedFor = firstHeaderValue(forwardedForRaw);
  const relayRole = readHeader(req, "x-relay-role");
  const relayHost = readHeader(req, "x-relay-host");
  const host = readHeader(req, "host");

  let type = "local";
  let via = "localhost";
  let detail = "本机直连";

  if (relayTransportLabel(relayRole)) {
    type = "remote";
    via = "relay";
    detail = "Relay 远程入口";
  } else if (forwardedFor && !isLoopbackAddress(forwardedFor)) {
    type = "remote";
    via = "proxy";
    detail = "代理或隧道转发";
  } else if (!isLoopbackAddress(remoteAddress)) {
    type = "remote";
    via = "direct";
    detail = "远程直接访问";
  }

  return {
    type,
    via,
    detail,
    host: host || null,
    relayHost: relayHost || null,
    remoteAddress: remoteAddress || null,
    forwardedFor: forwardedFor || null
  };
};

export {
  getConnectionInfo,
  isLoopbackAddress
};
