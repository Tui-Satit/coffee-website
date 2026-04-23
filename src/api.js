const normalizeBaseUrl = (url = "") => url.replace(/\/+$/, "");

const API_URL = normalizeBaseUrl(
  process.env.REACT_APP_API_URL || "http://localhost:3002"
);

export const apiConfig = {
  baseUrl: API_URL,
};

export const buildApiUrl = (path) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${apiConfig.baseUrl}${normalizedPath}`;
};

export const apiFetch = (path, options = {}) =>
  fetch(buildApiUrl(path), options);

export const getJson = async (path, options = {}) => {
  const response = await apiFetch(path, options);
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  return response.json();
};

export const postJson = async (path, body, options = {}) => {
  const response = await apiFetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json();
};