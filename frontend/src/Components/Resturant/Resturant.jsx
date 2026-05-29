import React, { useEffect, useMemo, useState } from "react";
import fallbackMenu from "./Menuapi";
import MenuCard from "./MenuCard";
import Nav from "../Navbar/Nav";
import { ArrowRight, BadgeIndianRupee, Clock3, ChefHat, Flame, Minus, Plus, Star, ShoppingBag } from "lucide-react";
import "./Resturant.css";
import OrderDetails from "./OrderDetails";
import AdminDashboard from "./AdminDashboard";

const Resturant = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [cartItems, setCartItems] = useState([]);
  const [activeView, setActiveView] = useState("menu");
  const [menuItems, setMenuItems] = useState(fallbackMenu);
  const [menuLoading, setMenuLoading] = useState(true);
  const [menuError, setMenuError] = useState("");
  const menuList = ["All", "Lunch", "Evening", "Dinner"];

  useEffect(() => {
    const loadMenu = async () => {
      try {
        const response = await fetch("/api/menu");

        if (!response.ok) {
          throw new Error(`Menu request failed with status ${response.status}`);
        }

        const data = await response.json();
        setMenuItems(Array.isArray(data.items) && data.items.length > 0 ? data.items : fallbackMenu);
        setMenuError("");
      } catch (error) {
        setMenuItems(fallbackMenu);
        setMenuError(error instanceof Error ? error.message : "Unable to load live menu");
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

  const cartSummary = useMemo(() => {
    const items = cartItems.reduce((accumulator, item) => {
      const existingItem = accumulator.find((cartItem) => cartItem.id === item.id);

      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        accumulator.push({ ...item, quantity: 1 });
      }

      return accumulator;
    }, []);

    const subtotal = items.reduce((sum, item) => sum + Number(item.price.replace(/[^\d]/g, "")) * item.quantity, 0);
    const deliveryFee = subtotal > 0 ? 49 : 0;
    const tax = Math.round(subtotal * 0.05);

    return {
      items,
      subtotal,
      deliveryFee,
      tax,
      total: subtotal + deliveryFee + tax,
    };
  }, [cartItems]);

  const filterItem = (category) => {
    setActiveCategory(category);
  };

  const addToCart = (item) => {
    setCartItems((currentItems) => [...currentItems, item]);
  };

  const addToCartAndOpenOrder = (item) => {
    addToCart(item);
    setActiveView("order");
  };

  const openOrderPage = () => {
    setActiveView("order");
  };

  const openAdminPage = () => {
    setActiveView("admin");
  };

  const backToMenu = () => {
    setActiveView("menu");
  };

  const removeFromCart = (itemId) => {
    setCartItems((currentItems) => {
      const nextItems = [...currentItems];
      const itemIndex = nextItems.findIndex((cartItem) => cartItem.id === itemId);

      if (itemIndex >= 0) {
        nextItems.splice(itemIndex, 1);
      }

      return nextItems;
    });
  };

  const placeOrder = async (orderPayload) => {
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderPayload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Order request failed");
    }

    return data;
  };

  if (activeView === "order") {
    return (
      <OrderDetails
        cartSummary={cartSummary}
        onBackToMenu={backToMenu}
        onPlaceOrder={placeOrder}
      />
    );
  }

  if (activeView === "admin") {
    return <AdminDashboard onBackToMenu={backToMenu} />;
  }

  return (
    <main className="restaurant-app">
      <Nav
        filterItem={filterItem}
        menuList={menuList}
        activeCategory={activeCategory}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />

      <section className="hero-section">
        <div className="hero-copy">
          <span className="eyebrow">QuickHungry Bistro</span>
          <h1>Responsive food ordering that feels like a real restaurant menu.</h1>
          <p>
            Explore fresh dishes, filter by meal time, and search instantly across a curated menu built for both desktop and mobile.
          </p>

          <div className="hero-actions">
            <button type="button" className="primary-action" onClick={backToMenu}>Explore menu</button>
            <button type="button" className="secondary-action">Today's specials</button>
            <button type="button" className="secondary-action" onClick={openAdminPage}>Saved orders</button>
          </div>

          <div className="hero-stats">
            <div>
              <ChefHat size={18} />
              <strong>10 dishes</strong>
              <span>chef-picked items</span>
            </div>
            <div>
              <Star size={18} />
              <strong>4.8 rating</strong>
              <span>based on guest reviews</span>
            </div>
            <div>
              <Clock3 size={18} />
              <strong>20 min</strong>
              <span>average prep time</span>
            </div>
          </div>
        </div>

        <aside className="hero-panel">
          <div className="hero-panel-card">
            <span className="panel-label">Featured today</span>
            <h2>Spicy paneer bowl with fresh herbs</h2>
            <p>Bright, filling, and ready to ship as a premium lunch special.</p>
            <div className="panel-price-row">
              <span className="price-tag">From 125₹</span>
              <span className="panel-badge"><Flame size={16} /> Popular now</span>
            </div>
          </div>
        </aside>
      </section>

      <section className="menu-section">
        <div className="section-head">
          <div>
            <span className="section-kicker">Menu</span>
            <h2>What are you craving?</h2>
          </div>
          <div className="section-head-actions">
            <p>{menuLoading ? "Loading live menu..." : `${menuData.length} items available`}</p>
            <span className="live-chip">
              <ShoppingBag size={14} /> {cartSummary.items.length} in cart
            </span>
          </div>
        </div>

        {menuError ? (
          <div className="empty-state" style={{ marginBottom: "1rem" }}>
            <h3>Live menu could not load right now.</h3>
            <p>Showing the local fallback menu instead.</p>
          </div>
        ) : null}

        <div className="menu-layout">
          <div className="menu-feed">
            {menuData.length > 0 ? (
              <MenuCard menuData={menuData} onAddToCart={addToCart} onOrderNow={addToCartAndOpenOrder} />
            ) : (
              <div className="empty-state">
                <h3>No dishes match your search.</h3>
                <p>Try another category or clear the search box.</p>
              </div>
            )}
          </div>

          <aside className="checkout-panel">
            <div className="checkout-head">
              <div>
                <span className="checkout-kicker">Checkout</span>
                <h3>Your order</h3>
              </div>
              <span className="checkout-count">{cartSummary.items.length}</span>
            </div>

            {cartSummary.items.length > 0 ? (
              <>
                <div className="checkout-items">
                  {cartSummary.items.map((item) => (
                    <div className="checkout-item" key={`${item.id}-${item.quantity}`}>
                      <div>
                        <strong>{item.name}</strong>
                        <p>{item.category}</p>
                      </div>

                      <div className="checkout-item-actions">
                        <span>{item.quantity}x</span>
                        <button type="button" onClick={() => removeFromCart(item.id)} aria-label={`Remove one ${item.name}`}>
                          <Minus size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="checkout-breakdown">
                  <div>
                    <span>Subtotal</span>
                    <strong><BadgeIndianRupee size={14} /> {cartSummary.subtotal}</strong>
                  </div>
                  <div>
                    <span>Delivery</span>
                    <strong><BadgeIndianRupee size={14} /> {cartSummary.deliveryFee}</strong>
                  </div>
                  <div>
                    <span>Taxes</span>
                    <strong><BadgeIndianRupee size={14} /> {cartSummary.tax}</strong>
                  </div>
                </div>

                <div className="checkout-total">
                  <span>Total</span>
                  <strong><BadgeIndianRupee size={14} /> {cartSummary.total}</strong>
                </div>

                <button type="button" className="checkout-button" onClick={openOrderPage}>
                  Proceed to payment <ArrowRight size={16} />
                </button>
              </>
            ) : (
              <div className="checkout-empty">
                <p>Add dishes to build your order.</p>
              </div>
            )}
          </aside>
        </div>
      </section>
    </main>
  );
};

export default Resturant;


