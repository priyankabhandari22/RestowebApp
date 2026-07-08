import React, { useEffect, useState } from "react";
import { ArrowLeft, Bike, RefreshCw, Users, TrendingUp, PackageCheck, ListOrdered } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import "./AdminDashboard.css";

const API = () => import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const STATUSES = ["received", "preparing", "picked-up", "on-the-way", "near-you", "delivered", "cancelled"];

const AdminDashboard = ({ onBackToMenu }) => {
  const { user: currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [agents, setAgents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = currentUser?.token || "";

  const api = async (path, opts = {}) => {
    const base = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
    const res = await fetch(base + path, {
      ...opts,
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token, ...opts.headers },
    });
    return res.json();
  };

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [o, a, s] = await Promise.all([
        api("/api/admin/orders"),
        api("/api/admin/delivery-agents"),
        api("/api/admin/stats"),
      ]);
      if (o.success) setOrders(o.orders);
      if (a.success) setAgents(a.agents);
      if (s.success) setStats(s.stats);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (currentUser) load(); }, [currentUser]);

  const updateOrder = async (orderId, body) => {
    const data = await api("/api/admin/orders/" + orderId + "/status", {
      method: "PUT",
      body: JSON.stringify(body),
    });
    if (data.success) setOrders((prev) => prev.map((o) => (o._id === orderId ? data.order : o)));
  };

  return (
    <main className="admin-page">
      <section className="admin-hero">
        <button className="admin-back-button" onClick={onBackToMenu}><ArrowLeft size={16} /> Back</button>
        <div className="admin-copy">
          <span className="admin-kicker">Admin Panel</span>
          <h1>Restaurant Dashboard</h1>
          <p>Manage orders, assign delivery agents, and monitor operations.</p>
        </div>
        {stats && (
          <div className="admin-stats">
            <div className="admin-stat-card"><PackageCheck size={18} /><strong>{stats.activeOrders}</strong><span>Active</span></div>
            <div className="admin-stat-card"><TrendingUp size={18} /><strong>{stats.totalRevenue}₹</strong><span>Revenue</span></div>
            <div className="admin-stat-card"><Users size={18} /><strong>{stats.totalUsers}</strong><span>Users</span></div>
            <div className="admin-stat-card"><Bike size={18} /><strong>{stats.availableAgents}</strong><span>Free riders</span></div>
          </div>
        )}
      </section>

      {error && <div className="admin-error">{error}</div>}

      <div className="admin-toolbar">
        <button className="admin-refresh-button" onClick={load} disabled={loading}>
          <RefreshCw size={16} /> {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      <div className="admin-list-full">
        {loading ? (
          <p className="admin-empty">Loading orders...</p>
        ) : orders.length > 0 ? (
          <div className="admin-list">
            {orders.map((order) => (
              <article className="admin-card" key={order._id}>
                <div className="admin-card-head">
                  <ListOrdered size={18} />
                  <strong>Order #{(order._id || "").slice(-6)}</strong>
                  <span className={"status-pill " + (order.status || "received")}>{order.status}</span>
                </div>
                <div className="admin-card-body">
                  <p><strong>Customer:</strong> {order.customerName}</p>
                  <p><strong>Total:</strong> {order.totals?.total}₹</p>
                  <p><strong>Items:</strong> {order.items?.length || 0}</p>
                  <p><strong>Address:</strong> {order.address}</p>
                  {order.deliveryAgent && typeof order.deliveryAgent === "object" && (
                    <p><strong>Rider:</strong> {order.deliveryAgent.fullName}</p>
                  )}
                </div>
                <div className="admin-card-actions">
                  <select
                    value={order.status || "received"}
                    onChange={(e) => updateOrder(order._id, { status: e.target.value })}
                    className="admin-status-select"
                  >
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <select
                    value={order.deliveryAgent?._id || ""}
                    onChange={(e) => updateOrder(order._id, { deliveryAgentId: e.target.value })}
                    className="admin-agent-select"
                  >
                    <option value="">No rider</option>
                    {agents.map((a) => (
                      <option key={a._id} value={a._id}>{a.fullName} {a.isAvailable ? "(free)" : "(busy)"}</option>
                    ))}
                  </select>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="admin-empty">No orders yet.</p>
        )}
      </div>
    </main>
  );
};

export default AdminDashboard;
