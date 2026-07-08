import React from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import Resturant from './Components/Resturant/Resturant'
import Auth from './Components/Auth/Auth'
import OrderDetails from './Components/Resturant/OrderDetails'
import Profile from './Components/Profile/Profile'
import AdminDashboard from './Components/Resturant/AdminDashboard'
import { useCart } from './context/CartContext'
import { useAuth } from './context/AuthContext'
import './App.css'

const App = () => {
  return (
    <div className="app-shell">
      <Routes>
        <Route path="/" element={<Resturant />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/order" element={<OrderPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </div>
  )
}

const AuthPage = () => {
  const navigate = useNavigate();
  return <Auth onAuthSuccess={() => navigate("/")} />;
};

const OrderPage = () => {
  const { cartSummary, setCartItems } = useCart();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
  const placeOrder = async (orderPayload) => {
    const response = await fetch(`${API_BASE_URL}/api/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${currentUser.token}`
      },
      body: JSON.stringify(orderPayload)
    });
    return await response.json();
  };
  return (
    <OrderDetails
      cartSummary={cartSummary}
      onBackToMenu={() => navigate("/")}
      onPlaceOrder={placeOrder}
    />
  );
};

const ProfilePage = () => {
  const navigate = useNavigate();
  return <Profile onBack={() => navigate("/")} />;
};

const AdminPage = () => {
  const navigate = useNavigate();
  return <AdminDashboard onBackToMenu={() => navigate("/")} />;
};

export default App;
