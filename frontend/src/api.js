const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const TOKEN_KEY = 'careertrack_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export const messagesOf = (err) =>
  err && err.errors && err.errors.length ? err.errors : [err && err.message ? err.message : 'Something went wrong'];

const qs = (params = {}) =>
  new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== '' && value !== undefined && value !== null)
  ).toString();

async function request(path, { method = 'GET', body, auth = false, raw = false } = {}) {
  const headers = {};
  let payload;

  if (body instanceof FormData) {
    payload = body;
  } else if (body) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  if (auth && getToken()) headers.Authorization = `Bearer ${getToken()}`;

  let response;
  try {
    response = await fetch(BASE + path, { method, headers, body: payload });
  } catch (err) {
    throw new Error('Unable to reach the server. Please check your connection and try again.');
  }

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    if (response.status === 401 && auth) {
      clearToken();
      window.dispatchEvent(new Event('careertrack-logout'));
    }
    const error = new Error(data.message || 'Request failed');
    error.errors = data.errors || [];
    error.status = response.status;
    throw error;
  }

  return raw ? response : response.json();
}

export async function download(path, fallbackName) {
  const response = await request(path, { auth: true, raw: true });
  const blob = await response.blob();
  const disposition = response.headers.get('Content-Disposition') || '';
  const match = disposition.match(/filename="([^"]+)"/);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = match ? match[1] : fallbackName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export const api = {
  jobs: (params) => request(`/jobs?${qs(params)}`),
  job: (id) => request(`/jobs/${id}`),
  apply: (id, formData) => request(`/jobs/${id}/apply`, { method: 'POST', body: formData }),

  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password } }),
  me: () => request('/auth/me', { auth: true }),

  stats: () => request('/admin/stats', { auth: true }),
  adminJobs: (params) => request(`/admin/jobs?${qs(params)}`, { auth: true }),
  adminJob: (id) => request(`/admin/jobs/${id}`, { auth: true }),
  createJob: (body) => request('/admin/jobs', { method: 'POST', body, auth: true }),
  updateJob: (id, body) => request(`/admin/jobs/${id}`, { method: 'PUT', body, auth: true }),
  jobStatus: (id, status) =>
    request(`/admin/jobs/${id}/status`, { method: 'PATCH', body: { status }, auth: true }),
  deleteJob: (id) => request(`/admin/jobs/${id}`, { method: 'DELETE', auth: true }),

  applications: (params) => request(`/admin/applications?${qs(params)}`, { auth: true }),
  application: (id) => request(`/admin/applications/${id}`, { auth: true }),
  applicationStatus: (id, status) =>
    request(`/admin/applications/${id}/status`, { method: 'PATCH', body: { status }, auth: true }),
  addNote: (id, text) =>
    request(`/admin/applications/${id}/notes`, { method: 'POST', body: { text }, auth: true }),
  exportPath: (params) => `/admin/applications/export?${qs(params)}`,
  resumePath: (id) => `/admin/applications/${id}/resume`
};
