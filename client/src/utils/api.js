// Small helpers to consistently talk to backend in dev and prod
// API_BASE is used for REST calls; SOCKET_BASE for Socket.IO and absolute resource URLs
export const API_BASE = (typeof window !== 'undefined' && !['localhost', '127.0.0.1'].includes(window.location.hostname))
  ? 'https://api.yokebud.com'
  : '';

export const SOCKET_BASE = (typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname))
  ? 'https://api.yokebud.com'
  : 'https://api.yokebud.com';

export function apiFetch(input, init) {
  const isApiPath = typeof input === 'string' && input.startsWith('/api');
  const url = isApiPath ? `${API_BASE}${input}` : input;
  return fetch(url, init);
}

export function absoluteUrl(path) {
  if (!path) return '';
  if (typeof path !== 'string') return '';
  if (path.startsWith('http')) return path;
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${SOCKET_BASE}${clean}`;
}

