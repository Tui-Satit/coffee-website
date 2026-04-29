const normalizeBaseUrl = (url = "") => url.replace(/\/+$/, "");

export const API_BASE_URL = normalizeBaseUrl(
  process.env.REACT_APP_API_URL || "http://localhost:3002"
);

export const apiConfig = {
  baseUrl: API_BASE_URL,
};

export const buildApiUrl = (path) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${apiConfig.baseUrl}${normalizedPath}`;
};

export const postJson = async (path, body, options = {}) => {
  const response = await fetch(buildApiUrl(path), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Request failed ${response.status}: ${errorText}`);
  }

  return response.json();
};
