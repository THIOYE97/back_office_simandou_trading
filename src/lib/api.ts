import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

const ACCESS = 'st.bo.access';
const REFRESH = 'st.bo.refresh';

export const tokenStore = {
  get access() {
    return localStorage.getItem(ACCESS);
  },
  set(access: string, refresh: string) {
    localStorage.setItem(ACCESS, access);
    localStorage.setItem(REFRESH, refresh);
  },
  clear() {
    localStorage.removeItem(ACCESS);
    localStorage.removeItem(REFRESH);
  },
};

export const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const t = tokenStore.access;
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

let onUnauthorized: (() => void) | null = null;
export const setOnUnauthorized = (cb: () => void) => {
  onUnauthorized = cb;
};

api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401) {
      tokenStore.clear();
      onUnauthorized?.();
    }
    return Promise.reject(error);
  },
);
