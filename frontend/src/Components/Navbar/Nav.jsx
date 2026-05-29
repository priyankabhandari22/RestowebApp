import React from "react";
import "./Nav.css";
import logo from "../../assets/logo.png";
import { Search } from "lucide-react";

const Nav = ({ filterItem, menuList, activeCategory, searchTerm, setSearchTerm }) => {
  return (
    <header className="navbar">
      <div className="brand">
        <div className="logo">
          <img src={logo} alt="QuickHungry Logo" />
        </div>
        <div>
          <p>QuickHungry</p>
          <span>Fresh meals, fast checkout</span>
        </div>
      </div>

      <div className="nav-controls">
        <label className="search-box">
          <Search size={18} />
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search dishes"
            aria-label="Search dishes"
          />
        </label>

        <ul className="nav-menu">
          {menuList.map((curElem) => {
            const isActive = activeCategory === curElem;

            return (
              <li key={curElem}>
                <button
                  type="button"
                  className={isActive ? "active" : ""}
                  onClick={() => filterItem(curElem)}
                  aria-pressed={isActive}
                >
                  {curElem}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </header>
  );
};

export default Nav;
