import React from "react";
import './MenuCard.css'
import { ArrowRight, BadgeIndianRupee, Sparkles } from "lucide-react";

const MenuCard = ({ menuData, onAddToCart, onOrderNow }) => {
  return (
    <div className="menu-grid">
      {menuData.map((item) => {
        return (
          <article className="card-container" key={item.id}>
            <div className="card">
              <img
                src={item.image}
                alt={item.name}
                className="card-media"
              />

              <div className="card-body">
                <div className="card-top-row">
                  <span className="card-author">{item.category}</span>
                  <span className="card-number">#{item.id}</span>
                </div>

                <h3 className="card-title">{item.name}</h3>
                <p className="card-description">{item.description}</p>

                <div className="card-meta-row">
                  <span className="meta-pill">
                    <Sparkles size={14} /> Fresh pick
                  </span>
                  <span className="meta-price">
                    <BadgeIndianRupee size={16} /> {item.price}
                  </span>
                </div>

                <button type="button" className="card-tag" onClick={() => onOrderNow(item)}>
                  Order now <ArrowRight size={16} />
                </button>

                <button type="button" className="card-secondary-action" onClick={() => onAddToCart(item)}>
                  Add to cart
                </button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
};

export default MenuCard;

