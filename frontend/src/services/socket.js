import { io } from "socket.io-client";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(API_BASE_URL, {
      autoConnect: false,
      transports: ["websocket", "polling"],
    });
  }
  return socket;
};

export const connectSocket = (token) => {
  const s = getSocket();
  if (!s.connected) {
    s.auth = { token };
    s.connect();
  }
  return s;
};

export const disconnectSocket = () => {
  if (socket && socket.connected) {
    socket.disconnect();
  }
};

export const joinOrderRoom = (orderId) => {
  const s = getSocket();
  if (s.connected) {
    s.emit("join-order", orderId);
  }
};

export const leaveOrderRoom = (orderId) => {
  const s = getSocket();
  if (s.connected) {
    s.emit("leave-order", orderId);
  }
};
