import React, { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { X, CreditCard, Wallet, Banknote, QrCode, Check, Loader2, Smartphone } from "lucide-react";
import "./PaymentModal.css";

const PaymentModal = ({ orderId, amount, onClose, onPaymentComplete }) => {
  const [method, setMethod] = useState("cod");
  const [step, setStep] = useState("select");
  const [loading, setLoading] = useState(false);
  const [qrData, setQrData] = useState("");
  const [upiLink, setUpiLink] = useState("");
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [message, setMessage] = useState("");

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  const getToken = () => {
    const user = JSON.parse(localStorage.getItem("restoUser") || "{}");
    return user.token || "";
  };

  const handleProceed = async () => {
    setLoading(true);
    setMessage("");
    try {
      if (method === "cod") {
        setStep("confirm");
        setMessage("Your order will be placed with Cash on Delivery.");
      } else if (method === "qr") {
        const res = await fetch(`${API_BASE_URL}/api/payments/qr/data`, {
          method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
          body: JSON.stringify({ orderId }),
        });
        const data = await res.json();
        if (data.success) { setQrData(data.qrData); setStep("qr"); }
        else setMessage(data.message || "Failed to generate QR");
      } else if (method === "upi") {
        const res = await fetch(`${API_BASE_URL}/api/payments/upi/link`, {
          method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
          body: JSON.stringify({ orderId }),
        });
        const data = await res.json();
        if (data.success) { setUpiLink(data.upiLink); setStep("upi"); }
        else setMessage(data.message || "Failed to generate UPI link");
      } else if (method === "razorpay") {
        const res = await fetch(`${API_BASE_URL}/api/payments/razorpay/create-order`, {
          method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
          body: JSON.stringify({ orderId }),
        });
        const data = await res.json();
        if (!data.success) { setMessage(data.message || "Failed to create payment"); setLoading(false); return; }
        await loadRazorpay(data.razorpayOrderId, data.amount);
      }
    } catch (err) {
      setMessage(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const loadRazorpay = async (razorpayOrderId, amount) => {
    if (!window.Razorpay) {
      await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = resolve;
        script.onerror = reject;
        document.body.appendChild(script);
      });
    }
    const user = JSON.parse(localStorage.getItem("restoUser") || "{}");
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_placeholder",
      amount,
      currency: "INR",
      name: "QuickHungry",
      description: `Order #${orderId}`,
      order_id: razorpayOrderId,
      handler: async (response) => {
        const verifyRes = await fetch(`${API_BASE_URL}/api/payments/razorpay/verify`, {
          method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
          body: JSON.stringify({ ...response, orderId }),
        });
        const verifyData = await verifyRes.json();
        if (verifyData.success) onPaymentComplete("razorpay", response.razorpay_payment_id);
        else setMessage("Payment verification failed");
      },
      prefill: { name: user.fullName || "", contact: user.phone || "" },
      theme: { color: "#f97316" },
      modal: { ondismiss: () => setLoading(false) },
    };
    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  const markPaid = (method, txId) => {
    onPaymentComplete?.(method, txId);
  };

  const methods = [
    { id: "cod", label: "Cash on Delivery", desc: "Pay when food arrives", icon: Banknote },
    { id: "qr", label: "QR Code Payment", desc: "Scan & pay via any UPI app", icon: QrCode },
    { id: "upi", label: "UPI Payment", desc: "PhonePe, GPay, Paytm, BHIM", icon: Smartphone },
    { id: "razorpay", label: "Card / Net Banking", desc: "Credit Card, Debit Card, Net Banking", icon: Wallet },
  ];

  return (
    <div className="payment-overlay" onClick={onClose}>
      <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
        <button className="payment-close" onClick={onClose}><X size={18} /></button>

        {step === "select" && (
          <>
            <div className="payment-header">
              <CreditCard size={22} />
              <h3>Select Payment Method</h3>
              <p className="payment-amount">Payable: <strong>{amount}₹</strong></p>
            </div>
            <div className="payment-methods">
              {methods.map((m) => (
                <label key={m.id} className={`payment-method-item ${method === m.id ? "active" : ""}`}>
                  <input type="radio" name="paymentMethod" value={m.id} checked={method === m.id} onChange={() => setMethod(m.id)} />
                  <m.icon size={20} />
                  <div><strong>{m.label}</strong><span>{m.desc}</span></div>
                </label>
              ))}
            </div>
            {message && <p className="payment-message">{message}</p>}
            <button className="payment-proceed-btn" onClick={handleProceed} disabled={loading}>
              {loading ? <><Loader2 size={16} className="spin" /> Processing...</> : `Pay ${amount}₹`}
            </button>
          </>
        )}

        {step === "confirm" && (
          <div className="payment-confirm">
            <Banknote size={40} />
            <h3>Cash on Delivery</h3>
            <p>Pay {amount}₹ when your food arrives at your doorstep.</p>
            <button className="payment-proceed-btn" onClick={() => markPaid("cod")}>Place Order</button>
          </div>
        )}

        {step === "qr" && (
          <div className="payment-qr">
            <h3>Scan to Pay</h3>
            <p>Scan this QR code with any UPI app</p>
            <div className="qr-wrapper"><QRCodeSVG value={qrData} size={200} /></div>
            <p className="qr-amount">{amount}₹</p>
            <button className="payment-proceed-btn" onClick={() => onPaymentComplete?.("qr")}>I have paid</button>
          </div>
        )}

        {step === "upi" && (
          <div className="payment-upi">
            <h3>Pay via UPI</h3>
            <p>Open any UPI app on your phone to pay</p>
            <div className="upi-link-box">
              <span className="upi-id-text">{upiLink.includes("pa=") ? decodeURIComponent(upiLink.split("pa=")[1]?.split("&")[0] || "") : upiLink}</span>
              <button onClick={() => { navigator.clipboard.writeText(upiLink); setMessage("UPI link copied!"); }}>Copy</button>
            </div>
            <div className="upi-apps">
              <button onClick={() => { window.location.href = `tez://upi/pay?pa=${upiLink.split("pa=")[1]?.split("&")[0]}&pn=QuickHungry&am=${amount}&tn=Order&cu=INR`; setTimeout(() => setMessage("If Google Pay didn't open, tap 'I have paid' after completing payment on your phone."), 1000); }}>Google Pay</button>
              <button onClick={() => { window.location.href = `phonepe://pay?pa=${upiLink.split("pa=")[1]?.split("&")[0]}&pn=QuickHungry&am=${amount}&tn=Order&cu=INR`; setTimeout(() => setMessage("If PhonePe didn't open, tap 'I have paid' after completing payment."), 1000); }}>PhonePe</button>
              <button onClick={() => { window.location.href = `paytmmp://pay?pa=${upiLink.split("pa=")[1]?.split("&")[0]}&pn=QuickHungry&am=${amount}&tn=Order&cu=INR`; setTimeout(() => setMessage("If Paytm didn't open, tap 'I have paid' after completing payment."), 1000); }}>Paytm</button>
              <button onClick={() => { window.location.href = `bhim://upi/pay?pa=${upiLink.split("pa=")[1]?.split("&")[0]}&pn=QuickHungry&am=${amount}&tn=Order&cu=INR`; setTimeout(() => setMessage("If BHIM didn't open, tap 'I have paid' after completing payment."), 1000); }}>BHIM</button>
            </div>
            <div className="upi-qr-row">
              <p className="upi-note">Or scan QR code on your phone:</p>
              <div className="qr-wrapper"><QRCodeSVG value={upiLink} size={160} /></div>
            </div>
            <button className="payment-proceed-btn" onClick={() => onPaymentComplete?.("upi")}>I have paid</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentModal;
