export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export const getWsBaseUrl = () => {
  // If API_BASE_URL is https, WS should be wss. Otherwise ws.
  if (API_BASE_URL.startsWith("https://")) {
    return API_BASE_URL.replace("https://", "wss://");
  }
  return API_BASE_URL.replace("http://", "ws://");
};

export const WS_BASE_URL = getWsBaseUrl();
