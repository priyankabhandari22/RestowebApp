import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { User, Phone, Lock, MapPin, Tag, LogIn, UserPlus } from "lucide-react";
import "./Auth.css";

const Auth = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    password: "",
    address: "",
    landmark: "",
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();

  const validate = () => {
    const newErrors = {};
    
    if (!isLogin) {
      if (!formData.fullName.trim()) {
        newErrors.fullName = "Name is required";
      } else if (formData.fullName.length < 3) {
        newErrors.fullName = "Name must be at least 3 characters";
      } else if (!/^[a-zA-Z\s]+$/.test(formData.fullName)) {
        newErrors.fullName = "Name can only contain letters and spaces";
      }

      if (!formData.address.trim()) {
        newErrors.address = "Address is required";
      }
    }

    if (!formData.phone) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(formData.phone)) {
      newErrors.phone = "Phone number must be exactly 10 digits";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    
    if (!validate()) return;

    setLoading(true);
    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        if (isLogin) login(data.user);
        else register(data.user);
        if (onAuthSuccess) onAuthSuccess();
      } else {
        setServerError(data.message || "Authentication failed");
      }
    } catch (err) {
      setServerError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-icon-circle" onClick={onAuthSuccess}>
            {isLogin ? <LogIn size={32} /> : <UserPlus size={32} />}
          </div>
          <h2>{isLogin ? "Welcome Back" : "Create Account"}</h2>
          <p>{isLogin ? "Login to manage your orders" : "Sign up to start ordering"}</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {serverError && <div className="error-banner">{serverError}</div>}

          {!isLogin && (
            <>
              <div className="input-group">
                <label><User size={18} /> Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  placeholder="Priyanka Bhandari"
                  value={formData.fullName}
                  onChange={handleChange}
                  className={errors.fullName ? "error" : ""}
                />
                {errors.fullName && <span className="error-text">{errors.fullName}</span>}
              </div>

              <div className="input-group">
                <label><MapPin size={18} /> Delivery Address</label>
                <input
                  type="text"
                  name="address"
                  placeholder="123 Street Name"
                  value={formData.address}
                  onChange={handleChange}
                  className={errors.address ? "error" : ""}
                />
                {errors.address && <span className="error-text">{errors.address}</span>}
              </div>

              <div className="input-group">
                <label><Tag size={18} /> Landmark (Optional)</label>
                <input
                  type="text"
                  name="landmark"
                  placeholder="Near Post Office"
                  value={formData.landmark}
                  onChange={handleChange}
                />
              </div>
            </>
          )}

          <div className="input-group">
            <label><Phone size={18} /> Phone Number</label>
            <input
              type="text"
              name="phone"
              placeholder="1234567890"
              value={formData.phone}
              onChange={handleChange}
              className={errors.phone ? "error" : ""}
            />
            {errors.phone && <span className="error-text">{errors.phone}</span>}
          </div>

          <div className="input-group">
            <label><Lock size={18} /> Password</label>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              className={errors.password ? "error" : ""}
            />
            {errors.password && <span className="error-text">{errors.password}</span>}
          </div>

          <button type="submit" disabled={loading} className="auth-submit">
            {loading ? "Processing..." : isLogin ? "Login" : "Register"}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button onClick={() => setIsLogin(!isLogin)} className="toggle-auth">
              {isLogin ? "Sign Up" : "Login"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
