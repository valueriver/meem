const getSetupStatus = async () => {
  try {
    const res = await fetch("/api/system/setup", { credentials: "include" });
    const data = await res.json();
    return {
      reachable: true,
      initialized: Boolean(res.ok && data?.initialized)
    };
  } catch {
    return {
      reachable: false,
      initialized: null
    };
  }
};
export {
  getSetupStatus
};
