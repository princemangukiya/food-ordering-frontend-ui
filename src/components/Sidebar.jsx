import React, { useState, useEffect } from "react";
import { getReviews } from "../services/api";

export default function Sidebar({
  isOpen = true,
  onClose,
  categories = [],
  selectedCategory = "All",
  onSelectCategory,
  vegFilter = "ALL",
  onSelectVegFilter,
  quickFilter = "ALL",
  onSelectQuickFilter,
  sortBy = "DEFAULT",
  onSelectSortBy,
  activeView = "menu",
  onSelectView,
  activeOrdersCount = 0,
  orderMode = "DELIVERY",
  onChangeOrderMode,
  categoryCounts = {},
  isAdmin = false,
  onOpenAdminLogin,
  onOpenShareModal,
}) {
  const [reviewsAvg, setReviewsAvg] = useState("5.0");
  const [reviewsCount, setReviewsCount] = useState(5);

  useEffect(() => {
    const updateStats = () => {
      getReviews().then((revs) => {
        if (Array.isArray(revs) && revs.length > 0) {
          const avg = (
            revs.reduce((sum, r) => sum + (Number(r.rating) || 5), 0) / revs.length
          ).toFixed(1);
          setReviewsAvg(avg);
          setReviewsCount(revs.length);
        }
      });
    };
    updateStats();
    window.addEventListener("food_express_review_added", updateStats);
    window.addEventListener("storage", updateStats);
    return () => {
      window.removeEventListener("food_express_review_added", updateStats);
      window.removeEventListener("storage", updateStats);
    };
  }, []);
  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={`sidebar-mobile-backdrop ${isOpen ? "open" : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className={`food-sidebar ${isOpen ? "open" : "collapsed"}`}>
        {/* Brand Banner */}
        <div className="sidebar-brand-box">
          <div className="sidebar-brand-header">
            <span className="sidebar-brand-icon">🍔</span>
            <div className="sidebar-brand-text">
              <h2 className="sidebar-brand-title">
                Food<span className="brand-accent">Express</span>
              </h2>
              <span className="sidebar-live-status">
                <span className="status-ping-dot"></span>
                Kitchen Open • 25m
              </span>
            </div>
          </div>
          {onClose && (
            <button className="sidebar-mobile-close-btn" onClick={onClose} title="Close sidebar">
              ✕
            </button>
          )}
        </div>

        {/* Public Share Button Banner */}
        <div className="sidebar-share-card" onClick={onOpenShareModal}>
          <div className="share-card-icon">📱</div>
          <div className="share-card-text">
            <strong>Share Live Order Link</strong>
            <span>Send to anyone on phone or laptop</span>
          </div>
          <span className="share-card-arrow">↗</span>
        </div>

        {/* Order Mode Switcher: Delivery / Takeaway / Dine-in */}
        <div className="sidebar-mode-selector">
          <button
            className={`mode-btn ${orderMode === "DELIVERY" ? "active" : ""}`}
            onClick={() => onChangeOrderMode && onChangeOrderMode("DELIVERY")}
          >
            <span className="mode-icon">🛵</span>
            <span className="mode-label">Delivery</span>
          </button>
          <button
            className={`mode-btn ${orderMode === "TAKEAWAY" ? "active" : ""}`}
            onClick={() => onChangeOrderMode && onChangeOrderMode("TAKEAWAY")}
          >
            <span className="mode-icon">🥡</span>
            <span className="mode-label">Takeaway</span>
          </button>
          <button
            className={`mode-btn ${orderMode === "DINEIN" ? "active" : ""}`}
            onClick={() => onChangeOrderMode && onChangeOrderMode("DINEIN")}
          >
            <span className="mode-icon">🍽️</span>
            <span className="mode-label">Dine-in</span>
          </button>
        </div>

        {/* Navigation Tabs (Everything on the same page!) */}
        <div className="sidebar-nav-section">
          <span className="sidebar-section-title">NAVIGATION</span>
          <div className="sidebar-nav-list">
            <button
              className={`sidebar-nav-item ${activeView === "menu" ? "active" : ""}`}
              onClick={() => onSelectView("menu")}
            >
              <span className="nav-item-icon">📜</span>
              <span className="nav-item-label">Food Menu</span>
              <span className="nav-item-tag">Explore</span>
            </button>

            <button
              className={`sidebar-nav-item ${activeView === "track" ? "active" : ""}`}
              onClick={() => onSelectView("track")}
            >
              <span className="nav-item-icon">🛵</span>
              <span className="nav-item-label">Track Order</span>
              <span className="nav-item-tag live">Live</span>
            </button>

            <button
              className={`sidebar-nav-item ${activeView === "reviews" ? "active" : ""}`}
              onClick={() => onSelectView("reviews")}
            >
              <span className="nav-item-icon">⭐</span>
              <span className="nav-item-label">Customer Reviews</span>
              <span className="nav-item-tag">{reviewsAvg} ★</span>
            </button>

            {isAdmin && (
              <button
                className={`sidebar-nav-item admin-kitchen-item ${activeView === "orders" ? "active" : ""}`}
                onClick={() => onSelectView("orders")}
              >
                <span className="nav-item-icon">👨‍🍳</span>
                <span className="nav-item-label">Kitchen Live POS</span>
                {activeOrdersCount > 0 ? (
                  <span className="nav-counter-badge">{activeOrdersCount}</span>
                ) : (
                  <span className="nav-item-tag admin">Staff</span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Categories Section */}
        <div className="sidebar-categories-section">
          <div className="sidebar-section-header">
            <span className="sidebar-section-title">MENU CATEGORIES</span>
            <span className="sidebar-cat-total">{categories.length} sections</span>
          </div>

          <nav className="sidebar-category-list" aria-label="Menu categories">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              const count = categoryCounts[cat.id] || 0;
              const isCombo = cat.id === "Combos";

              return (
                <button
                  key={cat.id}
                  className={`sidebar-cat-btn ${isSelected ? "selected" : ""} ${
                    isCombo ? "is-combo-highlight" : ""
                  }`}
                  onClick={() => onSelectCategory(cat.id)}
                >
                  <span className="cat-btn-icon">{cat.icon}</span>
                  <span className="cat-btn-name">{cat.name}</span>
                  {isCombo && <span className="cat-deal-badge">40% OFF</span>}
                  {count > 0 && <span className="cat-count-pill">{count}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Dietary Filter Section: Pure Veg / Non-Veg */}
        <div className="sidebar-filter-box">
          <span className="sidebar-section-title">DIETARY PREFERENCE</span>
          <div className="sidebar-dietary-pills">
            <button
              className={`diet-pill-btn ${vegFilter === "ALL" ? "active" : ""}`}
              onClick={() => onSelectVegFilter("ALL")}
            >
              All Items
            </button>
            <button
              className={`diet-pill-btn veg ${vegFilter === "VEG" ? "active" : ""}`}
              onClick={() => onSelectVegFilter("VEG")}
            >
              <span className="diet-dot veg"></span> Pure Veg
            </button>
            <button
              className={`diet-pill-btn non-veg ${vegFilter === "NON_VEG" ? "active" : ""}`}
              onClick={() => onSelectVegFilter("NON_VEG")}
            >
              <span className="diet-dot non-veg"></span> Non-Veg
            </button>
          </div>
        </div>

        {/* Quick Tags Filter */}
        <div className="sidebar-filter-box">
          <span className="sidebar-section-title">SPECIAL BADGES</span>
          <div className="sidebar-tags-grid">
            <button
              className={`tag-filter-btn ${quickFilter === "ALL" ? "active" : ""}`}
              onClick={() => onSelectQuickFilter("ALL")}
            >
              ✨ All Deals
            </button>
            <button
              className={`tag-filter-btn ${quickFilter === "BESTSELLER" ? "active" : ""}`}
              onClick={() => onSelectQuickFilter("BESTSELLER")}
            >
              ⭐ Bestsellers
            </button>
            <button
              className={`tag-filter-btn ${quickFilter === "CHEF" ? "active" : ""}`}
              onClick={() => onSelectQuickFilter("CHEF")}
            >
              👨‍🍳 Chef Specials
            </button>
            <button
              className={`tag-filter-btn ${quickFilter === "SPICY" ? "active" : ""}`}
              onClick={() => onSelectQuickFilter("SPICY")}
            >
              🔥 Spicy Favs
            </button>
          </div>
        </div>

        {/* Sorting Dropdown */}
        <div className="sidebar-sort-box">
          <label htmlFor="sidebar-sort-select" className="sidebar-section-title">
            SORT DISHES BY
          </label>
          <select
            id="sidebar-sort-select"
            className="sidebar-select"
            value={sortBy}
            onChange={(e) => onSelectSortBy(e.target.value)}
          >
            <option value="DEFAULT">Recommended ★</option>
            <option value="PRICE_ASC">Price: Low to High (₹)</option>
            <option value="PRICE_DESC">Price: High to Low (₹₹)</option>
            <option value="RATING">Highest Customer Rating</option>
          </select>
        </div>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          <div className="sidebar-info-card">
            <span className="info-icon">📞</span>
            <div className="info-text">
              <span className="info-title">Need Help / Support?</span>
              <span className="info-phone">1800-200-FOOD</span>
            </div>
          </div>

          {!isAdmin && onOpenAdminLogin && (
            <button className="sidebar-staff-btn" onClick={onOpenAdminLogin}>
              🔒 Staff / Kitchen Access
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
