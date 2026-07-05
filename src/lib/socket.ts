import { io, Socket } from 'socket.io-client';
import { tokenStore } from './api';

// Le serveur Socket.IO est à la racine de l'API (sans le préfixe /api).
const base = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api').replace(/\/api\/?$/, '');

export function createSocket(): Socket {
  return io(base, {
    auth: { token: tokenStore.access ?? '' },
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 1500,
  });
}
