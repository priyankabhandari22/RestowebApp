import { apiUrl } from "../api";

const requestJson = async (path, options = {}) => {
  const response = await fetch(apiUrl(path), {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data;
};

export const getUsers = () => requestJson("/api/users");
export const getUserById = (id) => requestJson(`/api/users/${id}`);
export const createUser = (payload) => requestJson("/api/users", { method: "POST", body: JSON.stringify(payload) });
export const updateUser = (id, payload) => requestJson(`/api/users/${id}`, { method: "PUT", body: JSON.stringify(payload) });
export const deleteUser = (id) => requestJson(`/api/users/${id}`, { method: "DELETE" });

export const getOrders = () => requestJson("/api/orders");
export const getOrderById = (id) => requestJson(`/api/orders/${id}`);
export const createOrder = (payload) => requestJson("/api/orders", { method: "POST", body: JSON.stringify(payload) });
export const updateOrder = (id, payload) => requestJson(`/api/orders/${id}`, { method: "PUT", body: JSON.stringify(payload) });
export const deleteOrder = (id) => requestJson(`/api/orders/${id}`, { method: "DELETE" });

export const getMenu = () => requestJson("/api/menu");