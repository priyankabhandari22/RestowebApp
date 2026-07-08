import React, { useEffect, useState, useRef } from "react";
import { ArrowLeft, CreditCard, MapPin, AlertCircle, Check } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import MapSelector from "../Tracking/MapSelector";
import PaymentModal from "../Payment/PaymentModal";
import DeliveryTracker from "../Tracking/DeliveryTracker";
import "./OrderDetails.css";

const formatCurrency = (value) => `${value}₹`;
const parsePrice = (price) => Number(String(price).replace(/[^\d]/g, "")) || 0;

const OrderDetails = ({ cartSummary, onBackToMenu, onPlaceOrder }) => {
  const { user: currentUser } = useAuth();
  const { setCartItems } = useCart();
  const [formData, setFormData] = useState({
    customerName: "", phone: "", address: "", landmark: "", deliveryTime: "asap", paymentMethod: "upi-card",
  });
  const [errors, setErrors] = useState({});
  const [submitState, setSubmitState] = useState({ status: "idle", message: "", orderId: "" });
  const [customerLocation, setCustomerLocation] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState(null);
  const formRef = useRef(null);

  useEffect(() => {
    if (currentUser) {
      setFormData((prev) => ({
        ...prev, customerName: currentUser.fullName || "", phone: currentUser.phone || "",
        address: currentUser.address || "", landmark: currentUser.landmark || "",
      }));
    }
  }, [currentUser]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.customerName.trim()) newErrors.customerName = "Name is required";
    else if (formData.customerName.length < 3) newErrors.customerName = "Name must be at least 3 characters";
    else if (!/^[a-zA-Z\s]+$/.test(formData.customerName)) newErrors.customerName = "Name can only contain letters and spaces";
    if (!formData.phone) newErrors.phone = "Phone number is required";
    else if (!/^\d{10}$/.test(formData.phone)) newErrors.phone = "Phone must be exactly 10 digits";
    if (!formData.address.trim()) newErrors.address = "Delivery address is required";
    if (!formData.landmark.trim()) newErrors.landmark = "Landmark is required";
    if (!customerLocation) newErrors.location = "Please select your delivery location on the map";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    setSubmitState({ status: "submitting", message: "", orderId: "" });
    try {
      const payload = {
        ...formData,
        items: cartSummary.items.map((item) => ({
          id: item.id, name: item.name, category: item.category, image: item.image,
          price: parsePrice(item.price), quantity: item.quantity,
        })),
        totals: { subtotal: cartSummary.subtotal, deliveryFee: cartSummary.deliveryFee, tax: cartSummary.tax, total: cartSummary.total },
        customerLocation,
        paymentMethod: formData.paymentMethod,
      };
      const result = await onPlaceOrder(payload);
      if (result.success) {
        setPlacedOrderId(result.order?._id || "");
        if (formData.paymentMethod === "cod") {
          setSubmitState({ status: "success", message: result.message || "Order placed successfully!", orderId: result.order?._id || "" });
          setCartItems([]);
        } else {
          setSubmitState({ status: "idle", message: "", orderId: result.order?._id || "" });
          setShowPayment(true);
        }
      } else {
        throw new Error(result.message || "Order placement failed");
      }
    } catch (error) {
      setSubmitState({ status: "error", message: error.message || "Unable to place order.", orderId: "" });
    }
  };

  const handlePaymentComplete = async (method, txId) => {
    setShowPayment(false);
    setCartItems([]);
    setSubmitState({ status: "success", message: "Order placed successfully!", orderId: placedOrderId });
  };

  if (placedOrderId && cartSummary.items.length === 0) {
    return (
      <main className="order-page">
        <header className="order-header-card">
          <button type="button" className="back-button" onClick={onBackToMenu}>
            <ArrowLeft size={16} /> Back to menu
          </button>
          <div className="order-header-copy">
            <span className="order-kicker">Order Placed</span>
            <h1>Your order is confirmed!</h1>
            <p>Order ID: <strong>{placedOrderId}</strong></p>
          </div>
        </header>
        <DeliveryTracker
          orderId={placedOrderId}
          customerLocation={customerLocation}
          restaurantLocation={{ latitude: 19.076, longitude: 72.8777 }}
        />
      </main>
    );
  }

  return (
    <main className="order-page">
      <header className="order-header-card" ref={formRef}>
        <button type="button" className="back-button" onClick={onBackToMenu}>
          <ArrowLeft size={16} /> Back to menu
        </button>
        <div className="order-header-copy">
          <span className="order-kicker">Checkout</span>
          <h1>Almost there!</h1>
          <p>Confirm your details and place your order.</p>
          {currentUser && <span className="order-profile-note">Logged in as {currentUser.fullName}</span>}
        </div>
        <div className="order-progress">
          <div className="progress-step completed"><span className="step-circle"><Check size={14} /></span> Order</div>
          <span className="progress-line" />
          <div className="progress-step active"><span className="step-circle">2</span> Payment</div>
          <span className="progress-line" />
          <div className="progress-step"><span className="step-circle">3</span> Delivery</div>
        </div>
      </header>

      <form className="order-layout" onSubmit={handleSubmit}>
        <div className="order-details-column">
          <div className="card">
            <div className="card-heading">
              <MapPin size={20} />
              <div><span className="card-kicker">Delivery Details</span><h2>Where should we send your food?</h2></div>
            </div>
            <div className="form-grid">
              <label className={errors.customerName ? "has-error" : ""}>
                Recipient Name
                <input name="customerName" value={formData.customerName} onChange={handleChange} type="text" placeholder="Priyanka Bhandari" className={errors.customerName ? "input-error" : ""} />
                {errors.customerName && <span className="field-error"><AlertCircle size={12}/> {errors.customerName}</span>}
              </label>
              <label className={errors.phone ? "has-error" : ""}>
                Phone Number
                <input name="phone" value={formData.phone} onChange={handleChange} type="tel" placeholder="1234567890" className={errors.phone ? "input-error" : ""} />
                {errors.phone && <span className="field-error"><AlertCircle size={12}/> {errors.phone}</span>}
              </label>
              <label className={`full-width ${errors.address ? "has-error" : ""}`}>
                Delivery Address
                <textarea name="address" value={formData.address} onChange={handleChange} rows="2" placeholder="Flat no, Street name, Building, Area" className={errors.address ? "input-error" : ""} />
                {errors.address && <span className="field-error"><AlertCircle size={12}/> {errors.address}</span>}
              </label>
              <label className={errors.landmark ? "has-error" : ""}>
                Landmark
                <input name="landmark" value={formData.landmark} onChange={handleChange} type="text" placeholder="Near Post Office" className={errors.landmark ? "input-error" : ""} />
                {errors.landmark && <span className="field-error"><AlertCircle size={12}/> {errors.landmark}</span>}
              </label>
              <label>
                Delivery Time
                <select name="deliveryTime" value={formData.deliveryTime} onChange={handleChange}>
                  <option value="asap">As soon as possible</option>
                  <option value="30">In 30 minutes</option>
                  <option value="60">In 1 hour</option>
                </select>
              </label>
            </div>

            <div className="full-width">
              <MapSelector onLocationSelect={setCustomerLocation} />
              {errors.location && <p className="field-error" style={{ marginTop: "0.35rem" }}><AlertCircle size={12}/> {errors.location}</p>}
            </div>
          </div>

        </div>

        <aside className="summary-card">
          <div className="summary-heading">
            <div><span className="card-kicker">Order Summary</span><h2>{cartSummary.items.length} Item{cartSummary.items.length !== 1 ? "s" : ""}</h2></div>
          </div>
          {cartSummary.items.length > 0 ? (
            <>
              <div className="summary-items">
                {cartSummary.items.map((item) => (
                  <div className="summary-item" key={item.id}>
                    <div><strong>{item.name}</strong><p>{item.category}</p></div>
                    <div className="summary-item-meta"><span>{item.quantity}x</span><strong>{item.price}</strong></div>
                  </div>
                ))}
              </div>
              <div className="summary-breakdown">
                <div><span>Subtotal</span><strong>{formatCurrency(cartSummary.subtotal)}</strong></div>
                <div><span>Delivery</span><strong>{formatCurrency(cartSummary.deliveryFee)}</strong></div>
                <div><span>Taxes (5%)</span><strong>{formatCurrency(cartSummary.tax)}</strong></div>
              </div>
              <div className="summary-total"><span>Total Payable</span><strong>{formatCurrency(cartSummary.total)}</strong></div>
              <button type="submit" className="place-order-button">
                {`Place order — ${formatCurrency(cartSummary.total)}`}
              </button>
            </>
          ) : (
            <div className="summary-empty"><h3>Cart is empty</h3><p>Add some delicious meals from the menu first!</p></div>
          )}
        </aside>
      </form>

      {submitState.status === "error" && (
        <div className="order-banner error">{submitState.message}</div>
      )}

      {showPayment && placedOrderId && (
        <PaymentModal
          orderId={placedOrderId}
          amount={cartSummary.total}
          onClose={() => setShowPayment(false)}
          onPaymentComplete={handlePaymentComplete}
        />
      )}
    </main>
  );
};

export default OrderDetails;
