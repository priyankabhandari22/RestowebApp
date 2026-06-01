import React, { useEffect, useMemo, useRef, useState } from "react";
import fallbackMenu from "./Menuapi";
import MenuCard from "./MenuCard";
import Nav from "../Navbar/Nav";
import { ArrowRight, BadgeIndianRupee, ChefHat, Clock3, Flame, LogIn, LogOut, Minus, Plus, Save, ShoppingBag, Star, UserRound } from "lucide-react";
import "./Resturant.css";
import OrderDetails from "./OrderDetails";
import AdminDashboard from "./AdminDashboard";
import { createOrder, createUser, getMenu, getUsers, updateUser } from "../../services/restoApi";

const storageKey = "restowebapp-current-user";

const createEmptyAccountForm = () => ({
  fullName: "",
  phone: "",
  address: "",
  landmark: "",
  deliveryTime: "asap",
});

const normalizePhone = (phone) => String(phone || "").replace(/\D/g, "");

const buildAccountForm = (user) => ({
  fullName: user?.fullName || "",
  phone: user?.phone || "",
  address: user?.address || "",
  landmark: user?.landmark || "",
  deliveryTime: user?.deliveryTime || "asap",
});

const Resturant = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [cartItems, setCartItems] = useState([]);
  const [activeView, setActiveView] = useState("menu");
  const [menuItems, setMenuItems] = useState(fallbackMenu);
  const [menuLoading, setMenuLoading] = useState(true);
  const [menuError, setMenuError] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [accountForm, setAccountForm] = useState(createEmptyAccountForm());
  const [accountLoading, setAccountLoading] = useState(false);
  const [accountStatus, setAccountStatus] = useState({ type: "idle", message: "" });
  const accountSectionRef = useRef(null);
  const menuList = ["All", "Lunch", "Evening", "Dinner"];

  useEffect(() => {
    const loadMenu = async () => {
      try {
        const data = await getMenu();
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

  useEffect(() => {
    const storedUser = window.localStorage.getItem(storageKey);

    if (!storedUser) {
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);

      if (parsedUser && parsedUser._id) {
        setCurrentUser(parsedUser);
        setAccountForm(buildAccountForm(parsedUser));
      }
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      window.localStorage.setItem(storageKey, JSON.stringify(currentUser));
      setAccountForm(buildAccountForm(currentUser));
    } else {
      window.localStorage.removeItem(storageKey);
      setAccountForm(createEmptyAccountForm());
    }
  }, [currentUser]);

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

  const viewAccount = () => {
    accountSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
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

  const handleAccountChange = (event) => {
    const { name, value } = event.target;

    setAccountForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const setAccountFeedback = (type, message) => {
    setAccountStatus({ type, message });
  };

  const syncUserFromApi = async (phoneValue) => {
    const normalizedInputPhone = normalizePhone(phoneValue);
    const { users = [] } = await getUsers();
    const matchedUser = users.find((user) => normalizePhone(user.phone) === normalizedInputPhone);

    if (!matchedUser) {
      throw new Error("No saved user found with that phone number.");
    }

    setCurrentUser(matchedUser);
    setAccountFeedback("success", `Logged in as ${matchedUser.fullName}.`);
    return matchedUser;
  };

  const handleRegister = async (event) => {
    event.preventDefault();

    try {
      setAccountLoading(true);
      setAccountFeedback("idle", "");

      const payload = {
        fullName: accountForm.fullName.trim(),
        phone: accountForm.phone.trim(),
        address: accountForm.address.trim(),
        landmark: accountForm.landmark.trim(),
        deliveryTime: accountForm.deliveryTime,
      };

      const normalizedInputPhone = normalizePhone(payload.phone);
      const { users = [] } = await getUsers();
      const existingUser = users.find((user) => normalizePhone(user.phone) === normalizedInputPhone);

      if (existingUser) {
        setCurrentUser(existingUser);
        setAccountFeedback("success", `Profile already exists. Logged in as ${existingUser.fullName}.`);
        return;
      }

      const response = await createUser(payload);
      setCurrentUser(response.user);
      setAccountFeedback("success", `Profile created for ${response.user.fullName}.`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unable to register user.";
      setAccountFeedback("error", errorMessage);
    } finally {
      setAccountLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      setAccountLoading(true);
      setAccountFeedback("idle", "");

      if (!accountForm.phone.trim()) {
        throw new Error("Enter a phone number to log in.");
      }

      await syncUserFromApi(accountForm.phone);
    } catch (error) {
      setAccountFeedback("error", error instanceof Error ? error.message : "Unable to log in.");
    } finally {
      setAccountLoading(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAccountFeedback("success", "Logged out successfully.");
  };

  const handleProfileUpdate = async (event) => {
    event.preventDefault();

    try {
      if (!currentUser?._id) {
        throw new Error("Log in before updating your profile.");
      }

      setAccountLoading(true);
      setAccountFeedback("idle", "");

      const payload = {
        fullName: accountForm.fullName.trim(),
        phone: accountForm.phone.trim(),
        address: accountForm.address.trim(),
        landmark: accountForm.landmark.trim(),
        deliveryTime: accountForm.deliveryTime,
      };

      const response = await updateUser(currentUser._id, payload);
      setCurrentUser(response.user);
      setAccountFeedback("success", `Profile updated for ${response.user.fullName}.`);
    } catch (error) {
      setAccountFeedback("error", error instanceof Error ? error.message : "Unable to update profile.");
    } finally {
      setAccountLoading(false);
    }
  };

  const placeOrder = async (orderPayload) => {
    return createOrder({
      ...orderPayload,
      userId: currentUser?._id || orderPayload.userId,
    });
  };

  if (activeView === "order") {
    return (
      <OrderDetails
        cartSummary={cartSummary}
        onBackToMenu={backToMenu}
        onPlaceOrder={placeOrder}
        currentUser={currentUser}
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
            <button type="button" className="secondary-action" onClick={() => filterItem("Lunch")}>Today's specials</button>
            <button type="button" className="secondary-action" onClick={viewAccount}>My account</button>
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
          <div className="hero-panel-stack">
            <div className="hero-panel-card">
              <span className="panel-label">Featured today</span>
              <h2>Spicy paneer bowl with fresh herbs</h2>
              <p>Bright, filling, and ready to ship as a premium lunch special.</p>
              <div className="panel-price-row">
                <span className="price-tag">From 125₹</span>
                <span className="panel-badge"><Flame size={16} /> Popular now</span>
              </div>
            </div>

            <form className="account-panel" ref={accountSectionRef} onSubmit={currentUser ? handleProfileUpdate : handleRegister}>
              <div className="account-panel-head">
                <div>
                  <span className="panel-label">Customer account</span>
                  <h2>{currentUser ? `Welcome back, ${currentUser.fullName}` : "Register or log in"}</h2>
                </div>
                <UserRound size={18} />
              </div>

              {currentUser ? (
                <div className="account-summary">
                  <p>Saved profile is connected to the live backend.</p>
                  <strong>{currentUser.phone}</strong>
                  <span>{currentUser.address}</span>
                  {currentUser.landmark ? <span>Landmark: {currentUser.landmark}</span> : null}
                </div>
              ) : (
                <p className="account-summary">Create a profile to save orders and update your details later.</p>
              )}

              <div className="account-form-grid">
                <label>
                  Full name
                  <input name="fullName" value={accountForm.fullName} onChange={handleAccountChange} type="text" placeholder="Priyanka Sharma" />
                </label>
                <label>
                  Phone
                  <input name="phone" value={accountForm.phone} onChange={handleAccountChange} type="tel" placeholder="98765 43210" />
                </label>
                <label className="full-width">
                  Address
                  <textarea name="address" value={accountForm.address} onChange={handleAccountChange} rows="3" placeholder="Flat no, street, area, city" />
                </label>
                <label>
                  Landmark
                  <input name="landmark" value={accountForm.landmark} onChange={handleAccountChange} type="text" placeholder="Near main market" />
                </label>
                <label>
                  Delivery time
                  <select name="deliveryTime" value={accountForm.deliveryTime} onChange={handleAccountChange}>
                    <option value="asap">As soon as possible</option>
                    <option value="30">In 30 minutes</option>
                    <option value="60">In 1 hour</option>
                  </select>
                </label>
              </div>

              <div className="account-actions">
                {currentUser ? (
                  <>
                    <button type="submit" className="account-primary-button" disabled={accountLoading}>
                      <Save size={16} /> {accountLoading ? "Saving..." : "Update profile"}
                    </button>
                    <button type="button" className="account-secondary-button" onClick={handleLogout}>
                      <LogOut size={16} /> Logout
                    </button>
                  </>
                ) : (
                  <>
                    <button type="submit" className="account-primary-button" disabled={accountLoading}>
                      <UserRound size={16} /> {accountLoading ? "Registering..." : "Register"}
                    </button>
                    <button type="button" className="account-secondary-button" onClick={handleLogin} disabled={accountLoading}>
                      <LogIn size={16} /> Log in
                    </button>
                  </>
                )}
              </div>

              {accountStatus.message ? (
                <div className={`account-message ${accountStatus.type}`}>
                  {accountStatus.message}
                </div>
              ) : null}
            </form>
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
                        <button type="button" onClick={() => addToCart(item)} aria-label={`Add one more ${item.name}`}>
                          <Plus size={14} />
                        </button>
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


