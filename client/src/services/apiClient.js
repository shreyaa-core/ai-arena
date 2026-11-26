function readCookie(name) {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : "";
}

export async function apiRequest(path, { method = "GET", body, token } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (method !== "GET") {
    const csrf = readCookie("ai_arena_csrf");
    if (csrf) headers["X-CSRF-Token"] = csrf;
  }

  const res = await fetch(path, {
    method,
    headers,
    credentials: "include",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: text };
  }

  if (!res.ok) {
    const err = new Error(data.message || data.error || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const api = {
  health: () => apiRequest("/api/health"),
  aiStatus: () => apiRequest("/api/ai/status"),
  novaChat: (payload) => apiRequest("/api/ai/chat", { method: "POST", body: payload }),
  aiPlayground: (payload) => apiRequest("/api/ai/playground", { method: "POST", body: payload }),
  aiVision: (payload) => apiRequest("/api/ai/vision", { method: "POST", body: payload }),
  aiStt: (payload) => apiRequest("/api/ai/stt", { method: "POST", body: payload }),
  register: (payload) => apiRequest("/api/auth/register", { method: "POST", body: payload }),
  login: (payload) => apiRequest("/api/auth/login", { method: "POST", body: payload }),
  logout: () => apiRequest("/api/auth/logout", { method: "POST" }),
  me: () => apiRequest("/api/auth/me"),
  updateMe: (payload) => apiRequest("/api/auth/me", { method: "PATCH", body: payload }),
  migrateGuest: (payload) => apiRequest("/api/auth/migrate-guest", { method: "POST", body: payload }),
  submitAttempt: (payload) => apiRequest("/api/game/attempts", { method: "POST", body: payload }),
  submitAssessment: (payload) => apiRequest("/api/game/assessments", { method: "POST", body: payload }),
  buyItem: (payload) => apiRequest("/api/game/shop/buy", { method: "POST", body: payload }),
  claimDaily: () => apiRequest("/api/game/daily-bonus", { method: "POST" }),
  leaderboard: () => apiRequest("/api/game/leaderboard"),
  verifyCertificate: (code) => apiRequest(`/api/passport/verify/${encodeURIComponent(code)}`),
};
