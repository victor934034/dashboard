import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

let socket: Socket | null = null;

export const initializeSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling']
    });
  }
  return socket;
};

export const getSocket = (): Socket | null => socket;

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const joinChat = (chatId: string): void => {
  if (socket) {
    socket.emit('join-chat', chatId);
  }
};

export const leaveChat = (chatId: string): void => {
  if (socket) {
    socket.emit('leave-chat', chatId);
  }
};
