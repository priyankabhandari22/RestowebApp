import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import MenuCard from "./MenuCard";
import Nav from "../Navbar/Nav";
import { ShoppingBag } from "lucide-react";
import "./Resturant.css";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { getMenu } from "../../services/restoApi";

const Resturant = () => {
  const { user: currentUser, logout } = useAuth();
  const { cartSummary, addToCart, incrementItem, decrementItem, removeFromCart } = useCart();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [menuItems, setMenuItems] = useState([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [menuError, setMenuError] = useState("");
  const menuList = ["All", "Lunch", "Evening", "Dinner"];
  const heroImages = ["/images/chicken.jpg","/images/daalrice.jpg","/images/Dosa.jpg","/images/Maggi.jpg","/images/momo.jpg","/images/noodles.jpg","/images/paneer.jpg","/images/rajmachawal.png"];
  const [currentImageIdx, setCurrentImageIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIdx((prev) => (prev + 1) % heroImages.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [heroImages.length]);

  useEffect(() => {
    const loadMenu = async () => {
      try {
        const data = await getMenu();
        if (Array.isArray(data.items)) {
          setMenuItems(data.items);
        } else {
          setMenuError("Unexpected menu data format");
        }
      } catch (error) {
        setMenuError(error.message || "Unable to load menu");
      } finally {
        setMenuLoading(false);
      }
    };
    loadMenu();
  }, []);

  const menuData = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return menuItems.filter((item) => {
      const matchesCategory = activeCategory === "All" || item.category === activeCategory;
      const matchesSearch = !query || item.name.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchTerm, menuItems]);

  const openOrderPage = () => {
    if (!currentUser) navigate("/auth");
    else navigate("/order");
  };

  return (
    <main className="restaurant-app">
      <Nav
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        currentUser={currentUser}
        onLogout={logout}
        onLoginClick={() => navigate("/auth")}
        onProfileClick={() => navigate(currentUser ? "/profile" : "/auth")}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        menuList={menuList}
      />

      <section className="hero-section">
        <div className="hero-copy">
          <span className="hero-eyebrow">QuickHungry Bistro</span>
          <h1>Order food that<br />feels like a real<br />restaurant.</h1>
          <p className="hero-sub">Fresh dishes, curated by chefs, delivered in 20 minutes. Simple ordering, no clutter.</p>
          <div className="hero-actions">
            <button className="primary-action" onClick={() => document.querySelector(".menu-section")?.scrollIntoView({ behavior: "smooth" })}>Explore menu</button>
            <button className="secondary-action" onClick={openOrderPage}>My orders</button>
          </div>
          <div className="hero-stats">
            <span className="stat-item">
              <span className="stat-number">300+</span>
              <span className="stat-label">Dishes</span>
            </span>
            <span className="stat-divider"></span>
            <span className="stat-item">
              <span className="stat-number">4.8★</span>
              <span className="stat-label">Guest rating</span>
            </span>
            <span className="stat-divider"></span>
            <span className="stat-item">
              <span className="stat-number">20 min</span>
              <span className="stat-label">Avg. prep</span>
            </span>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-image-gallery">
            {heroImages.map((src, i) => (
              <img
                key={src}
                src={src}
                alt="Dish"
                className={i === currentImageIdx ? "gallery-img active" : "gallery-img"}
              />
            ))}
          </div>
          <div className="gallery-dots">
            {heroImages.map((_, i) => (
              <span key={i} className={i === currentImageIdx ? "dot active" : "dot"} />
            ))}
          </div>
        </div>
      </section>

      <section className="menu-section">
        <div className="section-head">
          <div><span className="section-kicker">Menu</span><h2>What are you craving?</h2></div>
          <div className="section-head-actions">
            <p>{menuLoading ? "Loading..." : `${menuData.length} items`}</p>
            <span className="live-chip"><ShoppingBag size={14} /> {cartSummary.items.length} in cart</span>
          </div>
        </div>

        <div className={"menu-layout" + (currentUser && cartSummary.items.length > 0 ? " has-checkout" : "")}>
          <div className="menu-feed">
            {menuData.length > 0 ? (
              <MenuCard menuData={menuData} onAddToCart={addToCart} onOrderNow={(item) => { addToCart(item); openOrderPage(); }} />
            ) : (
              <div className="empty-state">
                {menuError ? (
                  <>
                    <h3>Could not load menu</h3>
                    <p>{menuError}</p>
                  </>
                ) : menuLoading ? (
                  <>
                    <h3>Loading menu...</h3>
                    <p>Fetching fresh dishes from the kitchen.</p>
                  </>
                ) : (
                  <>
                    <h3>No dishes match your search.</h3>
                    <p>Try another category or clear the search box.</p>
                  </>
                )}
              </div>
            )}
          </div>

          {currentUser && cartSummary.items.length > 0 && (
          <aside className="checkout-panel">
            <div className="checkout-head">
              <div><span className="checkout-kicker">Checkout</span><h3>Your Order</h3></div>
              <span className="checkout-count">{cartSummary.items.length}</span>
            </div>

            <div className="checkout-items">
              {cartSummary.items.map((item) => (
                <div className="checkout-item" key={item.id}>
                  <div className="checkout-item-info">
                    <strong>{item.name}</strong>
                    <p>{item.category}</p>
                    <span className="checkout-item-price">{Number(item.price.replace(/[^\d]/g, ""))}₹ each</span>
                  </div>
                  <div className="checkout-item-actions">
                    <button className="qty-btn" onClick={() => decrementItem(item.id)} title="Decrease">−</button>
                    <span className="checkout-qty">{item.quantity}</span>
                    <button className="qty-btn" onClick={() => incrementItem(item.id)} title="Increase">+</button>
                    <strong className="item-total">{Number(item.price.replace(/[^\d]/g, "")) * item.quantity}₹</strong>
                    <button className="remove-btn" onClick={() => removeFromCart(item.id)} title="Remove item">✕</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="checkout-breakdown">
              <div><span>Subtotal</span><strong>{cartSummary.subtotal}₹</strong></div>
              <div><span>Delivery</span><strong>{cartSummary.deliveryFee}₹</strong></div>
              <div><span>Taxes</span><strong>{cartSummary.tax}₹</strong></div>
            </div>

            <div className="checkout-total"><span>Total</span><strong>{cartSummary.total}₹</strong></div>

            <button className="checkout-button" onClick={openOrderPage}>
              Proceed to Payment
            </button>
          </aside>
          )}
        </div>
      </section>

      {currentUser && cartSummary.items.length > 0 && (
        <button className="cart-fab" onClick={openOrderPage}>
          <ShoppingBag size={18} />
          <span className="fab-count">{cartSummary.items.length}</span>
          <span className="fab-total">{cartSummary.total}₹</span>
        </button>
      )}
    </main>
  );
};

export default Resturant;
