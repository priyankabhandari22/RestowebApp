import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, BadgeIndianRupee, CircleUserRound, Clock3, ListOrdered, RefreshCw, Save, Trash2, Users } from "lucide-react";
import "./AdminDashboard.css";
import { deleteOrder, getOrders, getUsers, updateOrder } from "../../services/restoApi";

const AdminDashboard = ({ onBackToMenu }) => {
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionState, setActionState] = useState({ type: "idle", message: "", orderId: "" });
  const [updatingOrderId, setUpdatingOrderId] = useState("");
  const [statusDrafts, setStatusDrafts] = useState({});

  const refreshAdminData = async () => {
    try {
      setLoading(true);

      const [ordersData, usersData] = await Promise.all([getOrders(), getUsers()]);

      setOrders(Array.isArray(ordersData.orders) ? ordersData.orders : []);
      setUsers(Array.isArray(usersData.users) ? usersData.users : []);
      setStatusDrafts(
        Object.fromEntries(
          (Array.isArray(ordersData.orders) ? ordersData.orders : []).map((order) => [order._id, order.status || "received"])
        )
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadAdminData = async () => {
      try {
        await refreshAdminData();
        setActionState({ type: "idle", message: "", orderId: "" });
        setError("");
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load admin data");
      } finally {
        setLoading(false);
      }
    };

    loadAdminData();
  }, []);

  const handleStatusChange = (orderId, value) => {
    setStatusDrafts((current) => ({
      ...current,
      [orderId]: value,
    }));
  };

  const handleOrderStatusSave = async (orderId) => {
    try {
      setUpdatingOrderId(orderId);
      setActionState({ type: "idle", message: "", orderId: "" });

      const selectedStatus = statusDrafts[orderId] || "received";
      const response = await updateOrder(orderId, { status: selectedStatus });

      setOrders((currentOrders) => currentOrders.map((order) => (order._id === orderId ? response.order : order)));
      setActionState({ type: "success", message: `Order status updated to ${selectedStatus}.`, orderId });
    } catch (saveError) {
      setActionState({
        type: "error",
        message: saveError instanceof Error ? saveError.message : "Unable to update order status.",
        orderId,
      });
    } finally {
      setUpdatingOrderId("");
    }
  };

  const handleOrderDelete = async (orderId) => {
    const shouldDelete = window.confirm("Delete this order? This cannot be undone.");

    if (!shouldDelete) {
      return;
    }

    try {
      setUpdatingOrderId(orderId);
      setActionState({ type: "idle", message: "", orderId: "" });

      await deleteOrder(orderId);
      setOrders((currentOrders) => currentOrders.filter((order) => order._id !== orderId));
      setActionState({ type: "success", message: "Order deleted successfully.", orderId });
    } catch (deleteError) {
      setActionState({
        type: "error",
        message: deleteError instanceof Error ? deleteError.message : "Unable to delete order.",
        orderId,
      });
    } finally {
      setUpdatingOrderId("");
    }
  };

  const orderStatusOptions = useMemo(() => ["received", "confirmed", "preparing", "out-for-delivery", "delivered", "cancelled"], []);

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

      {actionState.message ? (
        <div className={`admin-notice ${actionState.type}`}>
          {actionState.message}
        </div>
      ) : null}

      <div className="admin-toolbar">
        <button type="button" className="admin-refresh-button" onClick={refreshAdminData} disabled={loading}>
          <RefreshCw size={16} /> {loading ? "Refreshing..." : "Refresh data"}
        </button>
      </div>

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
                  <label className="admin-status-field">
                    Status
                    <select
                      value={statusDrafts[order._id] || order.status || "received"}
                      onChange={(event) => handleStatusChange(order._id, event.target.value)}
                    >
                      {orderStatusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="admin-card-actions">
                    <button
                      type="button"
                      className="admin-card-button primary"
                      onClick={() => handleOrderStatusSave(order._id)}
                      disabled={updatingOrderId === order._id}
                    >
                      <Save size={14} /> {updatingOrderId === order._id ? "Saving..." : "Save status"}
                    </button>
                    <button
                      type="button"
                      className="admin-card-button danger"
                      onClick={() => handleOrderDelete(order._id)}
                      disabled={updatingOrderId === order._id}
                    >
                      <Trash2 size={14} /> Delete order
                    </button>
                  </div>
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
