const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

let onSessionExpired = () => {};
export function setOnSessionExpired(fn) {
  onSessionExpired = fn;
}

async function request(path, { method = "GET", body, token } = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    /* respuestas binarias (pdf/excel/png) se manejan con requestBlob */
  }

  if (res.status === 401 && data?.code === "SESSION_EXPIRED") {
    onSessionExpired();
  }

  if (!res.ok) {
    const err = new Error(data?.error || `Error ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

/** Para descargar archivos binarios (pdf, excel, qr.png). */
async function requestBlob(path, { token } = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (res.status === 401) onSessionExpired();
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return res.blob();
}

export const api = {
  get: (path, token) => request(path, { token }),
  post: (path, body, token) => request(path, { method: "POST", body, token }),
  put: (path, body, token) => request(path, { method: "PUT", body, token }),
  del: (path, token) => request(path, { method: "DELETE", token }),
  blob: requestBlob,
  url: (path) => `${API_URL}${path}`,
};
