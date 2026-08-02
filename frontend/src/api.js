const API_BASE = import.meta.env.VITE_API_URL || "/api";
const TOKEN_KEY = "snippetvault_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const payload = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(payload.error || `Request failed (${res.status})`);
  }

  return payload.data;
}

export function requestOtp(email) {
  return request("/auth/otp/request", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function verifyOtp(email, code) {
  return request("/auth/otp/verify", {
    method: "POST",
    body: JSON.stringify({ email, code }),
  });
}

export function fetchMe() {
  return request("/auth/me");
}

export function createSnippet(body) {
  return request("/snippets", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function fetchSnippet(shortId) {
  return request(`/snippets/${encodeURIComponent(shortId)}`);
}

export function fetchPublicSnippets(page = 1) {
  return request(`/snippets?page=${page}`);
}

export function fetchMySnippets() {
  return request("/snippets/mine");
}
