import React, { useState, useMemo } from "react";
import FoodCard from "./FoodCard";
import { CATEGORIES } from "../data/foodData";
import { useCart } from "../context/CartContext";

const INSPIRATION_ITEMS = [
  { id: "Biryani", name: "Biryani", img: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300&auto=format&fit=crop&q=80" },
  { id: "Pizza", name: "Pizzas", img: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300&auto=format&fit=crop&q=80" },
  { id: "Burger", name: "Burgers", img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&auto=format&fit=crop&q=80" },
  { id: "Combos", name: "Combos", img: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=300&auto=format&fit=crop&q=80" },
  { id: "Chinese", name: "Chinese", img: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=300&auto=format&fit=crop&q=80" },
  { id: "SouthIndian", name: "South Indian", img: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=300&auto=format&fit=crop&q=80" },
  { id: "Breakfast", name: "Snacks", img: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300&auto=format&fit=crop&q=80" },
  { id: "Drinks", name: "Shakes", img: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=300&auto=format&fit=crop&q=80" },
  { id: "Dessert", name: "Desserts", img: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=300&auto=format&fit=crop&q=80" },
];

export default function MenuFeed({
  foods = [],
  loading = false,
  selectedCategory = "All",
  onSelectCategory,
  searchTerm = "",
  setSearchTerm,
  vegFilter = "ALL",
  setVegFilter,
  quickFilter = "ALL",
  setQuickFilter,
  sortBy = "DEFAULT",
  setSortBy,
  onOpenDishDetail,
  orderMode = "DELIVERY",
  onOpenCart,
}) {
  const { totalCount, totalAmount } = useCart();
  const [copiedCode, setCopiedCode] = useState(null);

  const handleCopyCode = (code) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  // Filter and sort items
  const filteredFoods = useMemo(() => {
    let result = [...foods];

    // 1. Category Filter
    if (selectedCategory !== "All") {
      result = result.filter(
        (f) =>
          f.category &&
          f.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // 2. Search Filter
    if (searchTerm && searchTerm.trim() !== "") {
      const q = searchTerm.trim().toLowerCase();
      result = result.filter(
        (f) =>
          (f.name && f.name.toLowerCase().includes(q)) ||
          (f.description && f.description.toLowerCase().includes(q)) ||
          (f.category && f.category.toLowerCase().includes(q))
      );
    }

    // 3. Dietary Filter
    if (vegFilter === "VEG") {
      result = result.filter((f) => {
        const isNonVeg =
          f.isVeg === false ||
          f.name.toLowerCase().includes("chicken") ||
          f.name.toLowerCase().includes("murgh") ||
          f.name.toLowerCase().includes("pepperoni");
        return !isNonVeg;
      });
    } else if (vegFilter === "NON_VEG") {
      result = result.filter((f) => {
        return (
          f.isVeg === false ||
          f.name.toLowerCase().includes("chicken") ||
          f.name.toLowerCase().includes("murgh") ||
          f.name.toLowerCase().includes("pepperoni")
        );
      });
    }

    // 4. Quick Badge Filter
    if (quickFilter === "BESTSELLER") {
      result = result.filter(
        (f) =>
          f.badge?.toLowerCase().includes("bestseller") ||
          f.badge?.toLowerCase().includes("popular") ||
          (f.rating && f.rating >= 4.9)
      );
    } else if (quickFilter === "CHEF") {
      result = result.filter(
        (f) =>
          f.badge?.toLowerCase().includes("chef") ||
          f.badge?.toLowerCase().includes("special")
      );
    } else if (quickFilter === "SPICY") {
      result = result.filter(
        (f) =>
          f.name.toLowerCase().includes("chilli") ||
          f.name.toLowerCase().includes("schezwan") ||
          f.name.toLowerCase().includes("spicy") ||
          f.badge?.toLowerCase().includes("spicy")
      );
    }

    // 5. Sort By
    if (sortBy === "PRICE_ASC") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === "PRICE_DESC") {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === "RATING") {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    return result;
  }, [foods, selectedCategory, searchTerm, vegFilter, quickFilter, sortBy]);

  const activeCategoryMeta = CATEGORIES.find((c) => c.id === selectedCategory);
  const isFilterActive =
    selectedCategory !== "All" ||
    searchTerm.trim() !== "" ||
    vegFilter !== "ALL" ||
    quickFilter !== "ALL" ||
    sortBy !== "DEFAULT";

  const handleResetFilters = () => {
    onSelectCategory("All");
    if (setSearchTerm) setSearchTerm("");
    if (setVegFilter) setVegFilter("ALL");
    if (setQuickFilter) setQuickFilter("ALL");
    if (setSortBy) setSortBy("DEFAULT");
  };

  return (
    <div className="swiggy-marketplace-container">
      {/* ================= 1. "WHAT'S ON YOUR MIND?" (SWIGGY/ZOMATO CIRCULAR INSPIRATION) ================= */}
      {selectedCategory === "All" && !searchTerm && (
        <section className="swiggy-inspiration-section">
          <div className="section-title-wrap">
            <h2 className="swiggy-section-headline">What's on your mind?</h2>
            <span className="swiggy-section-sub">Order delicious food from authentic chef recipes</span>
          </div>

          <div className="swiggy-inspiration-carousel">
            {INSPIRATION_ITEMS.map((item) => (
              <div
                key={item.id}
                className="swiggy-inspiration-bubble"
                onClick={() => {
                  onSelectCategory(item.id);
                  const el = document.getElementById("swiggy-menu-anchor");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <div className="swiggy-bubble-img-wrap">
                  <img src={item.img} alt={item.name} className="swiggy-bubble-img" />
                </div>
                <span className="swiggy-bubble-title">{item.name}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ================= 2. DEALS & OFFERS CAROUSEL (SWIGGY / ZOMATO COUPONS STRIP) ================= */}
      {selectedCategory === "All" && !searchTerm && (
        <section className="swiggy-offers-strip">
          <div className="swiggy-offer-card" onClick={() => handleCopyCode("WELCOME50")}>
            <div className="offer-badge-tag">FLAT 50 OFF</div>
            <div className="offer-content">
              <strong>₹50 OFF on first order</strong>
              <span>Use code <code>WELCOME50</code> • Above ₹150</span>
            </div>
            <button className="copy-code-chip">
              {copiedCode === "WELCOME50" ? "Copied! ✓" : "Copy"}
            </button>
          </div>

          <div className="swiggy-offer-card highlight" onClick={() => handleCopyCode("TASTY100")}>
            <div className="offer-badge-tag orange">MEGA DEAL</div>
            <div className="offer-content">
              <strong>Flat ₹100 OFF on ₹399+</strong>
              <span>Use code <code>TASTY100</code> • Valid on all items</span>
            </div>
            <button className="copy-code-chip">
              {copiedCode === "TASTY100" ? "Copied! ✓" : "Copy"}
            </button>
          </div>

          <div className="swiggy-offer-card" onClick={() => handleCopyCode("FEAST20")}>
            <div className="offer-badge-tag green">20% OFF</div>
            <div className="offer-content">
              <strong>20% OFF up to ₹150</strong>
              <span>Use code <code>FEAST20</code> • Above ₹299</span>
            </div>
            <button className="copy-code-chip">
              {copiedCode === "FEAST20" ? "Copied! ✓" : "Copy"}
            </button>
          </div>
        </section>
      )}

      {/* ================= 3. RESTAURANT SHOWCASE HEADER (AUTHENTIC SWIGGY/ZOMATO RESTAURANT CARD) ================= */}
      <section className="swiggy-restaurant-header-card" id="swiggy-menu-anchor">
        <div className="restaurant-main-info">
          <div className="restaurant-title-row">
            <h1 className="restaurant-brand-name">FoodExpress Gourmet Kitchen</h1>
            <span className="restaurant-veg-pure-badge">🌱 Multi-Cuisine Cloud Kitchen</span>
          </div>

          <div className="restaurant-meta-rating-row">
            <span className="restaurant-rating-chip">★ 4.9 (2,500+ ratings)</span>
            <span className="dot-sep">•</span>
            <span className="restaurant-cost-info">₹200 for two</span>
            <span className="dot-sep">•</span>
            <span className="restaurant-cuisines-text">North Indian, Biryani, Pizzas, Burgers, Chinese, Desserts</span>
          </div>

          <div className="restaurant-delivery-location-row">
            <span className="delivery-icon">🛵</span>
            <span className="delivery-timing"><strong>20-25 mins</strong> (Outlet: Sector 18, Noida)</span>
            <span className="free-del-pill">⚡ Free Delivery on orders &gt; ₹199</span>
          </div>
        </div>

        <div className="restaurant-discount-banner">
          <span className="discount-icon">🏷️</span>
          <span>40% OFF up to ₹100 on Combos • Use Code <strong>WELCOME50</strong></span>
        </div>
      </section>

      {/* ================= 4. STICKY SWIGGY FILTER STRIP ================= */}
      <div className="swiggy-sticky-filter-bar">
        {/* Pure Veg Switcher */}
        <button
          className={`swiggy-filter-pill ${vegFilter === "VEG" ? "active-veg" : ""}`}
          onClick={() => setVegFilter(vegFilter === "VEG" ? "ALL" : "VEG")}
        >
          <span className="filter-diet-dot veg"></span>
          <span>Pure Veg</span>
        </button>

        {/* Non-Veg Switcher */}
        <button
          className={`swiggy-filter-pill ${vegFilter === "NON_VEG" ? "active-nonveg" : ""}`}
          onClick={() => setVegFilter(vegFilter === "NON_VEG" ? "ALL" : "NON_VEG")}
        >
          <span className="filter-diet-dot non-veg"></span>
          <span>Non-Veg</span>
        </button>

        {/* Bestseller Filter */}
        <button
          className={`swiggy-filter-pill ${quickFilter === "BESTSELLER" ? "active" : ""}`}
          onClick={() => setQuickFilter(quickFilter === "BESTSELLER" ? "ALL" : "BESTSELLER")}
        >
          <span>⭐ Bestseller</span>
        </button>

        {/* Chef Specials */}
        <button
          className={`swiggy-filter-pill ${quickFilter === "CHEF" ? "active" : ""}`}
          onClick={() => setQuickFilter(quickFilter === "CHEF" ? "ALL" : "CHEF")}
        >
          <span>👨‍🍳 Chef Special</span>
        </button>

        {/* Spicy Favs */}
        <button
          className={`swiggy-filter-pill ${quickFilter === "SPICY" ? "active" : ""}`}
          onClick={() => setQuickFilter(quickFilter === "SPICY" ? "ALL" : "SPICY")}
        >
          <span>🔥 Spicy</span>
        </button>

        {/* Rating 4.5+ */}
        <button
          className={`swiggy-filter-pill ${sortBy === "RATING" ? "active" : ""}`}
          onClick={() => setSortBy(sortBy === "RATING" ? "DEFAULT" : "RATING")}
        >
          <span>★ 4.5+ Rating</span>
        </button>

        {/* Sort By Dropdown */}
        <div className="swiggy-sort-dropdown-wrap">
          <select
            className="swiggy-sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="DEFAULT">Recommended</option>
            <option value="PRICE_ASC">Price: Low to High</option>
            <option value="PRICE_DESC">Price: High to Low</option>
            <option value="RATING">Highest Rated</option>
          </select>
        </div>

        {isFilterActive && (
          <button className="swiggy-clear-filters-btn" onClick={handleResetFilters}>
            Clear Filters ✕
          </button>
        )}
      </div>

      {/* ================= 5. SWIGGY MENU CATEGORIES TABS ================= */}
      <div className="swiggy-category-tabs-bar">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              className={`swiggy-cat-tab-btn ${isSelected ? "selected" : ""}`}
              onClick={() => onSelectCategory(cat.id)}
            >
              <span className="cat-tab-icon">{cat.icon}</span>
              <span className="cat-tab-label">{cat.name}</span>
              {cat.id === "Combos" && <span className="cat-badge-deal">40% OFF</span>}
            </button>
          );
        })}
      </div>

      {/* ================= 6. SECTION HEADER & ITEMS COUNT ================= */}
      <div className="swiggy-menu-header-row">
        <div>
          <h2 className="swiggy-menu-title">
            {activeCategoryMeta?.name || selectedCategory}
          </h2>
          <span className="swiggy-menu-count">({filteredFoods.length} items)</span>
        </div>

        {isFilterActive && (
          <span className="filter-applied-notice">Showing filtered results</span>
        )}
      </div>

      {/* ================= 7. DISHES LIST (AUTHENTIC SWIGGY/ZOMATO DISH CARDS) ================= */}
      {loading ? (
        <div className="swiggy-loading-state">
          <div className="swiggy-spinner"></div>
          <p>Loading mouth-watering food items...</p>
        </div>
      ) : filteredFoods.length === 0 ? (
        <div className="swiggy-empty-state">
          <div className="empty-icon">🍽️</div>
          <h3>No matching dishes found</h3>
          <p>We couldn't find any dishes matching your filters or search.</p>
          <button className="primary-btn" onClick={handleResetFilters}>
            See All Dishes ↺
          </button>
        </div>
      ) : (
        <div className="swiggy-dishes-grid">
          {filteredFoods.map((food) => (
            <FoodCard
              key={food.id}
              food={food}
              onOpenDetail={onOpenDishDetail}
            />
          ))}
        </div>
      )}

      {/* ================= 8. FLOATING BOTTOM CART BAR (SWIGGY/ZOMATO SIGNATURE BAR) ================= */}
      {totalCount > 0 && (
        <div className="swiggy-floating-cart-bar" onClick={onOpenCart}>
          <div className="cart-bar-left">
            <span className="cart-bar-count-badge">🛍️ {totalCount} Item{totalCount > 1 ? "s" : ""}</span>
            <span className="cart-bar-divider">|</span>
            <span className="cart-bar-total">₹{totalAmount}</span>
            <span className="cart-bar-delivery-note">• Extra charges may apply</span>
          </div>

          <div className="cart-bar-right">
            <span className="view-cart-text">VIEW CART</span>
            <span className="view-cart-arrow">🛒 →</span>
          </div>
        </div>
      )}
    </div>
  );
}
