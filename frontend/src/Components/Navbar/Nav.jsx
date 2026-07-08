import React from "react";
import "./Nav.css";
import logo from "../../assets/Logo.PNG";
import { Search, User } from "lucide-react";

const Nav = ({ searchTerm, setSearchTerm, currentUser, onLogout, onLoginClick, onProfileClick, activeCategory, setActiveCategory, menuList }) => {
  return (
    <header className="navbar">
      <div className="brand">
        <div className="logo">
          <img src={logo} alt="QuickHungry Logo" />
        </div>
        <div className="brand-text">
          <p className="brand-name">QuickHungry</p>
          <span className="brand-tagline">Fresh meals, fast checkout</span>
        </div>
      </div>

      <div className="search-wrapper">
        <label className="search-box">
          <Search size={18} />
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search menu"
            aria-label="Search dishes"
          />
        </label>
      </div>

      <div className="nav-pills">
        {menuList && menuList.map((curElem) => (
          <button
            key={curElem}
            type="button"
            className={activeCategory === curElem ? "pill active" : "pill"}
            onClick={() => setActiveCategory(curElem)}
          >
            {curElem}
          </button>
        ))}
      </div>

      <div className="nav-actions">
        {currentUser ? (
          <div className="user-info" onClick={onProfileClick}>
            <div className="user-avatar">
              {currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : <User size={16} />}
            </div>
            <span className="user-name">{currentUser.fullName ? currentUser.fullName.split(' ')[0] : "User"}</span>
          </div>
        ) : (
          <button className="login-btn" onClick={onLoginClick}>
            <span>Sign up</span>
          </button>
        )}
      </div>
    </header>
  );
};

export default Nav;
