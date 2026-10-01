import React from "react";
import { useCart } from "../context/CartContext";

export default function TopBar({
  searchTerm,
  setSearchTerm,
  deliveryAddress = "Sector 18, Wave Silver Tower, Noida",
  soundEnabled = true,
  onToggleSound,
  isAdmin = false,
  onOpenAdminLogin,
  onAdminLogout,
  activeOrdersCount = 0,
  onToggleCart,
  activeView = "menu",
  onSelectView,
  onOpenShareModal,
}) {
  const { totalCount, totalAmount } = useCart();

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    if (activeView !== "menu") {
      onSelectView("menu");
    }
  };

  return (
    <header className="swiggy-navbar-header">
      <div className="swiggy-navbar-container">
        {/* Left: Brand Logo & Location Selector */}
        <div className="swiggy-nav-left">
          <div className="swiggy-brand-logo" onClick={() => onSelectView("menu")}>
            <span className="swiggy-logo-icon">🍔</span>
            <div className="swiggy-logo-text-group">
              <span className="swiggy-brand-name">
                Food<span className="accent-color">Express</span>
              </span>
              <span className="swiggy-brand-tagline">Gourmet Food Delivery</span>
            </div>
            {isAdmin && <span className="swiggy-admin-badge">STAFF POS</span>}
          </div>

          {/* Location Picker with dropdown arrow */}
          <div className="swiggy-location-selector" title="Change delivery location">
            <span className="location-pin-icon">📍</span>
            <div className="location-text-group">
              <span className="location-title">
                Sector 18, Noida <span className="arrow-down">▾</span>
              </span>
              <span className="location-subtitle" title={deliveryAddress}>
                {deliveryAddress}
              </span>
            </div>
            <span className="swiggy-eta-badge">⚡ 20m</span>
          </div>
        </div>

        {/* Center: Global Search Bar */}
        <div className="swiggy-nav-center">
          <div className="swiggy-search-box">
            <span className="swiggy-search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search for dishes, combos, biryani, pizzas, burgers..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
            {searchTerm && (
              <button
                className="swiggy-clear-search-btn"
                onClick={() => setSearchTerm("")}
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Right: Navigation Actions (Offers, Track, Reviews, Staff, Cart) */}
        <div className="swiggy-nav-right">
          {/* Menu / Home */}
          <button
            className={`swiggy-nav-btn ${activeView === "menu" ? "active" : ""}`}
            onClick={() => onSelectView("menu")}
          >
            <span className="nav-btn-icon">🍽️</span>
            <span className="nav-btn-label">Menu</span>
          </button>

          {/* Track Order */}
          <button
            className={`swiggy-nav-btn ${activeView === "track" ? "active" : ""}`}
            onClick={() => onSelectView("track")}
            title="Track active food delivery"
          >
            <span className="nav-btn-icon">🛵</span>
            <span className="nav-btn-label">Track</span>
            {activeOrdersCount > 0 && <span className="nav-live-ping"></span>}
          </button>

          {/* Customer Reviews */}
          <button
            className={`swiggy-nav-btn ${activeView === "reviews" ? "active" : ""}`}
            onClick={() => onSelectView("reviews")}
            title="Customer feedback & ratings"
          >
            <span className="nav-btn-icon">⭐</span>
            <span className="nav-btn-label">Reviews</span>
          </button>

          {/* Share Online */}
          <button
            className="swiggy-nav-btn share-btn"
            onClick={onOpenShareModal}
            title="Share online ordering link"
          >
            <span className="nav-btn-icon">🌐</span>
            <span className="nav-btn-label">Share</span>
          </button>

          {/* Staff Kitchen POS Toggle */}
          {isAdmin ? (
            <div className="admin-controls-group">
              <button
                className={`swiggy-nav-btn admin-btn ${activeView === "orders" ? "active" : ""}`}
                onClick={() => onSelectView("orders")}
                title="Switch to Kitchen POS"
              >
                <span className="nav-btn-icon">👨‍🍳</span>
                <span className="nav-btn-label">Kitchen POS</span>
                {activeOrdersCount > 0 && (
                  <span className="nav-orders-count-badge">{activeOrdersCount}</span>
                )}
              </button>
              <button
                className="admin-logout-btn"
                onClick={onAdminLogout}
                title="Exit Kitchen Admin"
              >
                Logout 🚪
              </button>
            </div>
          ) : (
            onOpenAdminLogin && (
              <button
                className="swiggy-nav-btn staff-login-btn"
                onClick={onOpenAdminLogin}
                title="Restaurant Staff Access"
              >
                <span className="nav-btn-icon">🔒</span>
                <span className="nav-btn-label">Staff</span>
              </button>
            )
          )}

          {/* Cart Button */}
          <button
            className={`swiggy-header-cart-btn ${totalCount > 0 ? "has-items" : ""}`}
            onClick={onToggleCart}
            aria-label="View Cart"
          >
            <span className="cart-icon">🛒</span>
            <span className="cart-text">Cart</span>
            {totalCount > 0 && (
              <>
                <span className="cart-badge-count">{totalCount}</span>
                <span className="cart-badge-amount">₹{totalAmount}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
