const BASE_URL = process.env.PLAYGROUND_URL || "http://localhost:3004";

async function request(path, init = {}) {
  const url = new URL(`/playground/api${path}`, BASE_URL);
  const res = await fetch(url, init);
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};

  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }

  return data;
}

export function get(path) {
  return request(path);
}

export function post(path, body) {
  return request(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function del(path) {
  return request(path, { method: "DELETE" });
}
