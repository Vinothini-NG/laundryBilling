import axios from 'axios';

const baseURL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api';

export const api = axios.create({ baseURL });

const TOKEN_KEY = 'laundryos_token';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

// Attach the bearer token to every request.
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Bounce to login on auth failure.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (
      error?.response?.status === 401 &&
      typeof window !== 'undefined' &&
      !window.location.pathname.startsWith('/login')
    ) {
      setToken(null);
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export function apiError(e: unknown, fallback = 'Something went wrong'): string {
  if (axios.isAxiosError(e)) {
    const msg = e.response?.data?.message;
    if (Array.isArray(msg)) return msg.join(', ');
    if (typeof msg === 'string') return msg;
  }
  return fallback;
}
