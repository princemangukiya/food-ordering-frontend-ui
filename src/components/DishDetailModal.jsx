import React, { useState } from "react";
import { useCart } from "../context/CartContext";

export default function DishDetailModal({ dish, onClose }) {
  const { cart, addToCart, updateQuantity } = useCart();
  const [cookingNote, setCookingNote] = useState("");
  const [localQty, setLocalQty] = useState(1);

  if (!dish) return null;

  const cartItem = cart.find((item) => item.id === dish.id);
  const currentCartQty = cartItem ? cartItem.quantity : 0;

  const isNonVeg =
    dish.isVeg === false ||
    dish.name.toLowerCase().includes("chicken") ||
    dish.name.toLowerCase().includes("murgh") ||
    dish.name.toLowerCase().includes("pepperoni");
  const isVeg = !isNonVeg;

  const isCombo = dish.category === "Combos" || dish.isCombo;
  const badgeText = dish.badge || (isCombo ? "Value Combo" : null);

  const handleAddToCart = () => {
    // Add item with requested quantity
    for (let i = 0; i < localQty; i++) {
      addToCart(dish);
    }
    onClose();
  };

  return (
    <div className="dish-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="dish-modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="dish-modal-close-btn" onClick={onClose} aria-label="Close details">
          ✕
        </button>

        <div className="dish-modal-media-wrap">
          <img
            src={
              dish.imageUrl ||
              "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80"
            }
            alt={dish.name}
            className="dish-modal-img"
          />
          {badgeText && (
            <span className={`dish-modal-deal-tag ${isCombo ? "combo" : ""}`}>
              {badgeText}
            </span>
          )}
          <div className="dish-modal-quick-meta">
            <span className="dish-prep-time">⏱️ 20-25 Mins Prep</span>
            {dish.rating && <span className="dish-modal-rating">⭐ {dish.rating} (1,200+ reviews)</span>}
          </div>
        </div>

        <div className="dish-modal-body">
          {/* Header Row */}
          <div className="dish-modal-title-row">
            <div className="dish-modal-diet-title">
              <span
                className={`diet-box ${isVeg ? "veg" : "non-veg"}`}
                title={isVeg ? "100% Pure Vegetarian" : "Non-Vegetarian"}
              >
                <span className="diet-circle"></span>
              </span>
              <h2 className="dish-modal-name">{dish.name}</h2>
            </div>
            <div className="dish-modal-price-box">
              <span className="dish-modal-currency">₹</span>
              <span className="dish-modal-amount">{dish.price}</span>
              {dish.originalPrice && dish.originalPrice > dish.price && (
                <span className="dish-modal-strike">₹{dish.originalPrice}</span>
              )}
            </div>
          </div>

          <p className="dish-modal-full-desc">
            {dish.description ||
              "Prepared freshly with authentic chef spices, premium quality ingredients, and served piping hot right to your table."}
          </p>

          {/* Highlights & Tags */}
          <div className="dish-modal-specs-grid">
            <div className="dish-spec-card">
              <span className="spec-icon">🌱</span>
              <div className="spec-info">
                <strong>Dietary</strong>
                <span>{isVeg ? "100% Vegetarian" : "Non-Vegetarian"}</span>
              </div>
            </div>
            <div className="dish-spec-card">
              <span className="spec-icon">🔥</span>
              <div className="spec-info">
                <strong>Spice Level</strong>
                <span>{dish.name.toLowerCase().includes("chilli") || dish.name.toLowerCase().includes("schezwan") || dish.name.toLowerCase().includes("spicy") ? "Spicy Hot 🌶️🌶️" : "Medium Mild 🌶️"}</span>
              </div>
            </div>
            <div className="dish-spec-card">
              <span className="spec-icon">🛡️</span>
              <div className="spec-info">
                <strong>Hygiene</strong>
                <span>FSSAI Certified Kitchen</span>
              </div>
            </div>
            <div className="dish-spec-card">
              <span className="spec-icon">📦</span>
              <div className="spec-info">
                <strong>Packaging</strong>
                <span>Eco-Friendly Spill-Proof</span>
              </div>
            </div>
          </div>

          {/* Cooking Instructions note */}
          <div className="dish-modal-notes-field">
            <label htmlFor="dish-custom-note">Cooking Preferences / Instructions (Optional):</label>
            <input
              id="dish-custom-note"
              type="text"
              placeholder="e.g. Less spicy, extra sauce, no onion/garlic..."
              value={cookingNote}
              onChange={(e) => setCookingNote(e.target.value)}
            />
          </div>

          {/* Action Row */}
          <div className="dish-modal-action-bar">
            <div className="dish-modal-qty-picker">
              <button
                className="modal-qty-btn"
                onClick={() => setLocalQty((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
              >
                -
              </button>
              <span className="modal-qty-count">{localQty}</span>
              <button
                className="modal-qty-btn"
                onClick={() => setLocalQty((q) => q + 1)}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>

            <button className="dish-modal-add-btn" onClick={handleAddToCart}>
              <span>Add to Order</span>
              <span className="add-btn-dot">•</span>
              <span className="add-btn-price">₹{dish.price * localQty}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
