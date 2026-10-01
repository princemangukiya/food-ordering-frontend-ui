import React from "react";
import { useCart } from "../context/CartContext";

export default function FoodCard({ food, onOpenDetail }) {
  const { cart, addToCart, updateQuantity } = useCart();

  const cartItem = cart.find((item) => item.id === food.id);
  const quantity = cartItem ? cartItem.quantity : 0;

  // Determine Veg vs Non-Veg accurately
  const isNonVeg =
    food.isVeg === false ||
    food.name.toLowerCase().includes("chicken") ||
    food.name.toLowerCase().includes("murgh") ||
    food.name.toLowerCase().includes("pepperoni");
  const isVeg = !isNonVeg;

  const isCombo = food.category === "Combos" || food.isCombo;
  const isBestseller = food.badge?.toLowerCase().includes("bestseller") || food.rating >= 4.9;

  const handleCardClick = () => {
    if (onOpenDetail) {
      onOpenDetail(food);
    }
  };

  const discountPercent =
    food.originalPrice && food.originalPrice > food.price
      ? Math.round(((food.originalPrice - food.price) / food.originalPrice) * 100)
      : null;

  return (
    <div className={`swiggy-dish-card ${isCombo ? "is-combo-card" : ""}`}>
      {/* Left Column: Dish Info */}
      <div className="swiggy-dish-info">
        <div className="swiggy-diet-tags-row">
          {/* Authentic Veg / Non-Veg Icon */}
          <span
            className={`swiggy-diet-box ${isVeg ? "veg" : "non-veg"}`}
            title={isVeg ? "100% Pure Veg" : "Non-Vegetarian"}
          >
            <span className="swiggy-diet-dot"></span>
          </span>

          {isBestseller && (
            <span className="swiggy-badge bestseller">
              <span className="badge-star">⭐</span> Bestseller
            </span>
          )}

          {isCombo && (
            <span className="swiggy-badge combo">
              🍱 Value Combo
            </span>
          )}

          {food.badge && !isBestseller && !isCombo && (
            <span className="swiggy-badge special">{food.badge}</span>
          )}
        </div>

        <h3 className="swiggy-dish-name" onClick={handleCardClick}>
          {food.name}
        </h3>

        {/* Price Row with Discount */}
        <div className="swiggy-price-row">
          <span className="swiggy-currency">₹</span>
          <span className="swiggy-price-val">{food.price}</span>
          {food.originalPrice && food.originalPrice > food.price && (
            <span className="swiggy-strike-price">₹{food.originalPrice}</span>
          )}
          {discountPercent && (
            <span className="swiggy-discount-badge">{discountPercent}% OFF</span>
          )}
        </div>

        {/* Rating Pill */}
        {food.rating && (
          <div className="swiggy-rating-row">
            <span className="swiggy-rating-pill">
              ★ {food.rating}
            </span>
            <span className="swiggy-rating-count">
              ({Math.floor(food.rating * 135)}+ ratings)
            </span>
          </div>
        )}

        {/* Dish Description */}
        <p className="swiggy-dish-desc" onClick={handleCardClick}>
          {food.description || "Freshly prepared with authentic ingredients on order."}
        </p>
      </div>

      {/* Right Column: Dish Photo with the Iconic Swiggy / Zomato ADD button */}
      <div className="swiggy-dish-media">
        <div className="swiggy-img-wrapper" onClick={handleCardClick} title={`View details for ${food.name}`}>
          <img
            src={
              food.imageUrl ||
              "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80"
            }
            alt={food.name}
            className="swiggy-dish-img"
            loading="lazy"
          />
        </div>

        {/* Signature Swiggy / Zomato ADD Button overlapping bottom of image */}
        <div className="swiggy-add-btn-wrapper">
          {quantity > 0 ? (
            <div className="swiggy-qty-counter" onClick={(e) => e.stopPropagation()}>
              <button
                className="swiggy-qty-btn minus"
                onClick={() => updateQuantity(food.id, -1)}
                title="Decrease quantity"
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="swiggy-qty-num">{quantity}</span>
              <button
                className="swiggy-qty-btn plus"
                onClick={() => updateQuantity(food.id, 1)}
                title="Increase quantity"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          ) : (
            <button
              className="swiggy-add-btn"
              onClick={(e) => {
                e.stopPropagation();
                addToCart(food);
              }}
              aria-label={`Add ${food.name} to cart`}
            >
              <span className="swiggy-add-label">ADD</span>
              <span className="swiggy-add-plus">+</span>
            </button>
          )}
          <span className="swiggy-customisable-sub">customisable</span>
        </div>
      </div>
    </div>
  );
}
