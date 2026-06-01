import React, { useEffect, useState } from "react";
import { ArrowLeft, BadgeIndianRupee, CreditCard, MapPin, Package, Phone, Truck } from "lucide-react";
import "./OrderDetails.css";

const formatCurrency = (value) => `${value}₹`;

const parsePrice = (price) => Number(String(price).replace(/[^\d]/g, "")) || 0;

const buildFormState = (currentUser) => ({
  fullName: currentUser?.fullName || "",
  phone: currentUser?.phone || "",
  address: currentUser?.address || "",
  landmark: currentUser?.landmark || "",
  deliveryTime: currentUser?.deliveryTime || "asap",
  paymentMethod: "upi-card",
});

const OrderDetails = ({ cartSummary, onBackToMenu, onPlaceOrder, currentUser }) => {
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    address: "",
    landmark: "",
    deliveryTime: "asap",
    paymentMethod: "upi-card",
  });
  const [submitState, setSubmitState] = useState({
    status: "idle",
    message: "",
    orderId: "",
    user: null,
  });

  useEffect(() => {
    setFormData(buildFormState(currentUser));
  }, [currentUser]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSubmitState({ status: "submitting", message: "", orderId: "", user: null });

      const payload = {
        userId: currentUser?._id,
        customer: {
          fullName: formData.fullName,
          phone: formData.phone,
          address: formData.address,
          landmark: formData.landmark,
          deliveryTime: formData.deliveryTime,
        },
        paymentMethod: formData.paymentMethod,
        items: cartSummary.items.map((item) => ({
          id: item.id,
          name: item.name,
          category: item.category,
          image: item.image,
          price: parsePrice(item.price),
          quantity: item.quantity,
        })),
        totals: {
          subtotal: cartSummary.subtotal,
          deliveryFee: cartSummary.deliveryFee,
          tax: cartSummary.tax,
          total: cartSummary.total,
        },
      };

      const result = await onPlaceOrder(payload);

      setSubmitState({
        status: "success",
        message: result.message || "Order saved to MongoDB successfully.",
        orderId: result.orderId || result.order?._id || "",
        user: result.order?.user || {
          fullName: formData.fullName,
          phone: formData.phone,
          address: formData.address,
          landmark: formData.landmark,
          deliveryTime: formData.deliveryTime,
        },
      });
    } catch (error) {
      setSubmitState({
        status: "error",
        message: error instanceof Error ? error.message : "Unable to place order.",
        orderId: "",
        user: null,
      });
    }
  };

  return (
    <main className="order-page">
      <section className="order-header-card">
        <button type="button" className="back-button" onClick={onBackToMenu}>
          <ArrowLeft size={16} /> Back to menu
        </button>

        <div className="order-header-copy">
          <span className="order-kicker">Order details</span>
          <h1>Review your order and complete payment in one place.</h1>
          <p>
            This is the same page your menu buttons open. Add dishes, review your summary, and finish checkout without leaving the app.
          </p>
          {currentUser?._id ? <span className="order-profile-note">Checkout is connected to {currentUser.fullName}.</span> : null}
        </div>

        <div className="order-progress">
          <div className="progress-step active">
            <Package size={16} /> Order
          </div>
          <div className="progress-step active">
            <CreditCard size={16} /> Payment
          </div>
          <div className="progress-step">
            <Truck size={16} /> Delivery
          </div>
        </div>
      </section>

      <form className="order-layout" onSubmit={handleSubmit}>
        <div className="order-details-column">
          <div className="details-card">
            <div className="card-heading">
              <div>
                <span className="card-kicker">Delivery address</span>
                <h2>Where should we send it?</h2>
              </div>
              <MapPin size={18} />
            </div>

            <div className="form-grid">
              <label>
                Full name
                <input name="fullName" value={formData.fullName} onChange={handleChange} type="text" placeholder="Priyanka Sharma" required />
              </label>
              <label>
                Phone number
                <input name="phone" value={formData.phone} onChange={handleChange} type="tel" placeholder="98765 43210" required />
              </label>
              <label className="full-width">
                Delivery address
                <textarea name="address" value={formData.address} onChange={handleChange} rows="4" placeholder="Flat no, street, area, city" required />
              </label>
              <label>
                Landmark
                <input name="landmark" value={formData.landmark} onChange={handleChange} type="text" placeholder="Near main market" />
              </label>
              <label>
                Delivery time
                <select name="deliveryTime" value={formData.deliveryTime} onChange={handleChange}>
                  <option value="asap">As soon as possible</option>
                  <option value="30">In 30 minutes</option>
                  <option value="60">In 1 hour</option>
                </select>
              </label>
            </div>
          </div>

          <div className="details-card">
            <div className="card-heading">
              <div>
                <span className="card-kicker">Payment</span>
                <h2>Choose how you want to pay</h2>
              </div>
              <CreditCard size={18} />
            </div>

            <div className="payment-options">
              <label className="payment-option active">
                <input type="radio" name="paymentMethod" value="upi-card" checked={formData.paymentMethod === "upi-card"} onChange={handleChange} />
                <div>
                  <strong>UPI / Card</strong>
                  <span>Pay securely online</span>
                </div>
              </label>
              <label className="payment-option">
                <input type="radio" name="paymentMethod" value="cod" checked={formData.paymentMethod === "cod"} onChange={handleChange} />
                <div>
                  <strong>Cash on delivery</strong>
                  <span>Pay when your order arrives</span>
                </div>
              </label>
            </div>

            <div className="support-line">
              <Phone size={16} /> Need help? Call delivery support on +91 90000 12345
            </div>
          </div>
        </div>

        <aside className="summary-card">
          <div className="summary-heading">
            <div>
              <span className="card-kicker">Order summary</span>
              <h2>{cartSummary.items.length} items</h2>
            </div>
            <span className="summary-badge">Live</span>
          </div>

          {cartSummary.items.length > 0 ? (
            <>
              <div className="summary-items">
                {cartSummary.items.map((item) => (
                  <div className="summary-item" key={`${item.id}-${item.quantity}`}>
                    <div>
                      <strong>{item.name}</strong>
                      <p>{item.category}</p>
                    </div>
                    <div className="summary-item-meta">
                      <span>{item.quantity}x</span>
                      <strong>{item.price}</strong>
                    </div>
                  </div>
                ))}
              </div>

              <div className="summary-breakdown">
                <div>
                  <span>Subtotal</span>
                  <strong><BadgeIndianRupee size={14} /> {cartSummary.subtotal}</strong>
                </div>
                <div>
                  <span>Delivery fee</span>
                  <strong><BadgeIndianRupee size={14} /> {cartSummary.deliveryFee}</strong>
                </div>
                <div>
                  <span>Taxes</span>
                  <strong><BadgeIndianRupee size={14} /> {cartSummary.tax}</strong>
                </div>
              </div>

              <div className="summary-total">
                <span>Total payable</span>
                <strong>{formatCurrency(cartSummary.total)}</strong>
              </div>

              <button type="submit" className="place-order-button" disabled={submitState.status === "submitting"}>
                {submitState.status === "submitting" ? "Placing order..." : "Place secure order"}
              </button>

              {submitState.status === "success" ? (
                <div className="order-success">
                  <strong>{submitState.message}</strong>
                  {submitState.orderId ? <span>Order ID: {submitState.orderId}</span> : null}
                  {submitState.user ? (
                    <span>
                      Customer: {submitState.user.fullName || formData.fullName} | {submitState.user.phone || formData.phone}
                    </span>
                  ) : null}
                  {submitState.user?.address ? <span>Address: {submitState.user.address}</span> : null}
                </div>
              ) : null}

              {submitState.status === "error" ? (
                <div className="order-error">
                  <strong>Order could not be saved.</strong>
                  <span>{submitState.message}</span>
                </div>
              ) : null}
            </>
          ) : (
            <div className="summary-empty">
              <h3>Your cart is empty.</h3>
              <p>Add food items from the menu to see the full order summary here.</p>
            </div>
          )}
        </aside>
      </form>
    </main>
  );
};

export default OrderDetails;