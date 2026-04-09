const DEFAULT_DEV_API_BASE_URL = "http://localhost:3002";

const normalizeBaseUrl = (url = "") => url.replace(/\/+$/, "");

const resolveBaseUrl = () => {
  const envBaseUrl = process.env.REACT_APP_API_BASE_URL?.trim();

  if (envBaseUrl) {
    return normalizeBaseUrl(envBaseUrl);
  }

  if (process.env.NODE_ENV === "development") {
    return DEFAULT_DEV_API_BASE_URL;
  }

  return "";
};

const API_BASE_URL = resolveBaseUrl();

if (process.env.NODE_ENV === "production" && !API_BASE_URL) {
  // eslint-disable-next-line no-console
  console.warn(
    "REACT_APP_API_BASE_URL is not set. API calls will use relative URLs in production."
  );
}

export const apiConfig = {
  baseUrl: API_BASE_URL,
};

export const buildApiUrl = (path) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${apiConfig.baseUrl}${normalizedPath}`;
};

export const apiFetch = (path, options = {}) => fetch(buildApiUrl(path), options);

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
