import React, { useEffect, useState } from "react";
import { ArrowLeft, BadgeIndianRupee, CircleUserRound, Clock3, ListOrdered, Users } from "lucide-react";
import "./AdminDashboard.css";
import { apiUrl } from "../../api";

const AdminDashboard = ({ onBackToMenu }) => {
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadAdminData = async () => {
      try {
        setLoading(true);

        const [ordersResponse, usersResponse] = await Promise.all([
          fetch(apiUrl("/api/orders")),
          fetch(apiUrl("/api/users")),
        ]);

        const ordersData = await ordersResponse.json();
        const usersData = await usersResponse.json();

        if (!ordersResponse.ok) {
          throw new Error(ordersData.message || "Unable to load orders");
        }

        if (!usersResponse.ok) {
          throw new Error(usersData.message || "Unable to load users");
        }

        setOrders(Array.isArray(ordersData.orders) ? ordersData.orders : []);
        setUsers(Array.isArray(usersData.users) ? usersData.users : []);
        setError("");
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load admin data");
      } finally {
        setLoading(false);
      }
    };

    loadAdminData();
  }, []);

  return (
    <main className="admin-page">
      <section className="admin-hero">
        <button type="button" className="admin-back-button" onClick={onBackToMenu}>
          <ArrowLeft size={16} /> Back to menu
        </button>

        <div className="admin-copy">
          <span className="admin-kicker">Saved data</span>
          <h1>Orders and customers stored in MongoDB.</h1>
          <p>
            This dashboard shows the last saved customer records and their placed orders from the database.
          </p>
        </div>

        <div className="admin-stats">
          <div className="admin-stat-card">
            <Users size={18} />
            <strong>{users.length}</strong>
            <span>Saved users</span>
          </div>
          <div className="admin-stat-card">
            <ListOrdered size={18} />
            <strong>{orders.length}</strong>
            <span>Saved orders</span>
          </div>
          <div className="admin-stat-card">
            <Clock3 size={18} />
            <strong>Live</strong>
            <span>MongoDB synced</span>
          </div>
        </div>
      </section>

      {error ? <div className="admin-error">{error}</div> : null}

      <section className="admin-grid">
        <div className="admin-panel">
          <div className="admin-panel-head">
            <h2>Customers</h2>
            <span>{users.length}</span>
          </div>

          {loading ? (
            <p className="admin-empty">Loading customers...</p>
          ) : users.length > 0 ? (
            <div className="admin-list">
              {users.map((user) => (
                <article className="admin-card" key={user._id}>
                  <div className="admin-card-head">
                    <CircleUserRound size={18} />
                    <strong>{user.fullName}</strong>
                  </div>
                  <p>{user.phone}</p>
                  <p>{user.address}</p>
                  {user.landmark ? <p>Landmark: {user.landmark}</p> : null}
                  <p>Preferred time: {user.deliveryTime}</p>
                </article>
              ))}
            </div>
          ) : (
            <p className="admin-empty">No saved customers yet.</p>
          )}
        </div>

        <div className="admin-panel">
          <div className="admin-panel-head">
            <h2>Orders</h2>
            <span>{orders.length}</span>
          </div>

          {loading ? (
            <p className="admin-empty">Loading orders...</p>
          ) : orders.length > 0 ? (
            <div className="admin-list">
              {orders.map((order) => (
                <article className="admin-card" key={order._id}>
                  <div className="admin-card-head">
                    <ListOrdered size={18} />
                    <strong>Order #{String(order._id).slice(-6)}</strong>
                  </div>
                  <p>Customer: {order.user?.fullName || "Unknown"}</p>
                  <p>Phone: {order.user?.phone || "Unknown"}</p>
                  <p>Items: {order.items?.length || 0}</p>
                  <p>
                    Total: <BadgeIndianRupee size={14} /> {order.totals?.total || 0}
                  </p>
                  <p>Status: {order.status}</p>
                </article>
              ))}
            </div>
          ) : (
            <p className="admin-empty">No saved orders yet.</p>
          )}
        </div>
      </section>
    </main>
  );
};

export default AdminDashboard;
