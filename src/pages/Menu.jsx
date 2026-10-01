import React, { useState, useEffect, useMemo } from "react";
import FoodCard from "../components/FoodCard";
import { getFoods } from "../services/api";
import { CATEGORIES, INITIAL_FOOD_ITEMS } from "../data/foodData";
import { useCart } from "../context/CartContext";

export default function Menu({ searchTerm = "", setSearchTerm, onNavigate, initialCategory = "All" }) {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [localSearch, setLocalSearch] = useState(searchTerm);
  const [vegFilter, setVegFilter] = useState("ALL"); // "ALL" | "VEG" | "NON_VEG"
  const [sortBy, setSortBy] = useState("DEFAULT"); // "DEFAULT" | "PRICE_ASC" | "PRICE_DESC" | "RATING"
  const [viewLayout, setViewLayout] = useState("sections"); // "sections" | "grid"

  useEffect(() => {
    if (initialCategory) {
      setSelectedCategory(initialCategory);
    }
  }, [initialCategory]);

  const { cart, totalAmount, totalCount, setIsCartOpen, updateQuantity, clearCart } = useCart();

  const deliveryFee = totalAmount > 499 || totalAmount === 0 ? 0 : 40;
  const taxes = Math.round(totalAmount * 0.05);
  const grandTotal = totalAmount + (totalAmount > 0 ? deliveryFee + taxes : 0);

  useEffect(() => {
    setLocalSearch(searchTerm);
  }, [searchTerm]);

  const loadFoods = async () => {
    setLoading(true);
    try {
      const data = await getFoods();
      if (Array.isArray(data) && data.length > 0) {
        // Enrich backend items with metadata
        const enrichedBackend = data.map((d) => {
          const match = INITIAL_FOOD_ITEMS.find(
            (init) => init.id === d.id || init.name.toLowerCase() === d.name.toLowerCase()
          );
          return {
            ...match,
            ...d,
            category: d.category || (match ? match.category : "Specials"),
            isVeg: d.isVeg !== undefined ? d.isVeg : (match ? match.isVeg : true),
            isCombo: d.category === "Combos" || (match ? match.isCombo : false),
            originalPrice:
              match?.originalPrice ||
              (d.category === "Combos" ? Math.round(d.price * 1.25) : undefined),
            badge:
              match?.badge || (d.category === "Combos" ? "Value Combo" : undefined),
          };
        });

        const existingIds = new Set(enrichedBackend.map((d) => d.id));
        const extraItems = INITIAL_FOOD_ITEMS.filter((i) => !existingIds.has(i.id));
        setFoods([...enrichedBackend, ...extraItems]);
      } else {
        setFoods(INITIAL_FOOD_ITEMS);
      }
    } catch {
      setFoods(INITIAL_FOOD_ITEMS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFoods();
  }, []);

  const handleSearchChange = (val) => {
    setLocalSearch(val);
    if (setSearchTerm) setSearchTerm(val);
  };

  // Filter items
  const filteredFoods = useMemo(() => {
    let result = [...foods];

    // 1. Category filter (if not "All")
    if (selectedCategory !== "All") {
      result = result.filter(
        (f) =>
          f.category &&
          f.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // 2. Search query filter
    if (localSearch && localSearch.trim() !== "") {
      const q = localSearch.trim().toLowerCase();
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

    // 4. Sort
    if (sortBy === "PRICE_ASC") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === "PRICE_DESC") {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === "RATING") {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    return result;
  }, [foods, selectedCategory, localSearch, vegFilter, sortBy]);

  // Section categories for the grouped "All Items" view
  const sectionCategories = useMemo(() => {
    return CATEGORIES.filter((c) => c.id !== "All");
  }, []);

  // Category counts for badges
  const categoryCounts = useMemo(() => {
    const counts = {};
    foods.forEach((f) => {
      const catKey = f.category || "Other";
      counts[catKey] = (counts[catKey] || 0) + 1;
    });
    return counts;
  }, [foods]);

  const activeCategoryMeta = CATEGORIES.find((c) => c.id === selectedCategory);

  return (
    <div className="menu-page">
      {/* ================= RESTAURANT HERO HEADER ================= */}
      <div className="menu-hero-header">
        <div className="menu-header-content">
          <div className="menu-header-badges">
            <span className="menu-pill-badge live">🟢 Kitchen Open & Serving</span>
            <span className="menu-pill-badge">⚡ 25-30 Mins Express Delivery</span>
            <span className="menu-pill-badge discount">🛵 Free Delivery on ₹499+</span>
          </div>

          <h1 className="menu-page-title">
            Explore Our <span className="highlight-menu">Delicious Menu</span>
          </h1>
          <p className="menu-page-subtitle">
            Order fresh sizzling Chinese delicacies, super saver value combos, handcrafted pizzas,
            crispy burgers, authentic dum biryanis, and refreshing chilled beverages.
          </p>

          <div className="menu-stats-row">
            <div className="stat-pill">
              <span className="star-icon">⭐</span>
              <strong>4.9 / 5.0</strong>
              <span className="stat-sub">(3,500+ reviews)</span>
            </div>
            <div className="stat-pill">
              <span>🍽️</span>
              <strong>{foods.length}+ Dishes</strong>
              <span className="stat-sub">Fresh on order</span>
            </div>
            <div className="stat-pill">
              <span>🛡️</span>
              <strong>100% Hygienic</strong>
              <span className="stat-sub">Safety Verified</span>
            </div>
          </div>
        </div>
      </div>

      <div className="menu-main-container">
        {/* ================= SEARCH & TOOLBAR CONTROLS ================= */}
        <div className="menu-toolbar-card">
          <div className="menu-search-input-wrap">
            <span className="search-symbol">🔍</span>
            <input
              type="text"
              className="menu-search-box"
              placeholder="Search combos, noodles, pizza, burgers, shakes, biryani..."
              value={localSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
            {localSearch && (
              <button
                className="clear-box-btn"
                onClick={() => handleSearchChange("")}
                title="Clear Search"
              >
                ✕
              </button>
            )}
          </div>

          <div className="menu-filter-controls">
            {/* Dietary Toggle: All / Pure Veg / Non-Veg */}
            <div className="veg-filter-group">
              <button
                className={`veg-toggle-btn ${vegFilter === "ALL" ? "active" : ""}`}
                onClick={() => setVegFilter("ALL")}
              >
                All
              </button>
              <button
                className={`veg-toggle-btn veg ${vegFilter === "VEG" ? "active" : ""}`}
                onClick={() => setVegFilter("VEG")}
              >
                <span className="veg-icon-dot">🌱</span> Veg Only
              </button>
              <button
                className={`veg-toggle-btn non-veg ${vegFilter === "NON_VEG" ? "active" : ""}`}
                onClick={() => setVegFilter("NON_VEG")}
              >
                <span className="non-veg-icon-dot">🍗</span> Non-Veg
              </button>
            </div>

            {/* Sort Options */}
            <div className="sort-dropdown-wrap">
              <label htmlFor="sort-by-select">Sort By:</label>
              <select
                id="sort-by-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="sort-select"
              >
                <option value="DEFAULT">Recommended ★</option>
                <option value="PRICE_ASC">Price: Low to High (₹)</option>
                <option value="PRICE_DESC">Price: High to Low (₹₹)</option>
                <option value="RATING">Highest Rating</option>
              </select>
            </div>

            {/* Layout switch when viewing All Items */}
            {selectedCategory === "All" && !localSearch && (
              <div className="layout-toggle-group">
                <button
                  className={`layout-btn ${viewLayout === "sections" ? "active" : ""}`}
                  onClick={() => setViewLayout("sections")}
                  title="Grouped by Food Sections"
                >
                  📑 Sections
                </button>
                <button
                  className={`layout-btn ${viewLayout === "grid" ? "active" : ""}`}
                  onClick={() => setViewLayout("grid")}
                  title="Compact Grid"
                >
                  🍱 Grid
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ================= STICKY CATEGORY NAVIGATION BAR ================= */}
        <div className="category-pill-scroller-wrap">
          <div className="category-pill-scroller">
            {CATEGORIES.map((cat) => {
              const count =
                cat.id === "All"
                  ? foods.length
                  : categoryCounts[cat.id] || 0;

              return (
                <button
                  key={cat.id}
                  className={`cat-pill-btn ${
                    selectedCategory === cat.id ? "active" : ""
                  }`}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    const el = document.querySelector(".menu-content-anchor");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  <span className="pill-icon">{cat.icon}</span>
                  <span className="pill-text">{cat.label}</span>
                  {count > 0 && <span className="pill-count">{count}</span>}
                </button>
              );
            })}
          </div>
        </div>

        <div className="menu-content-anchor"></div>

        {/* ================= ACTIVE FILTER BANNER ================= */}
        {selectedCategory !== "All" && (
          <div className="active-category-banner">
            <div className="banner-left">
              <span className="banner-icon">{activeCategoryMeta?.icon || "🍽️"}</span>
              <div>
                <div className="banner-title-row">
                  <h2 className="banner-title">{activeCategoryMeta?.name || selectedCategory}</h2>
                  <span className="banner-count">({filteredFoods.length} items)</span>
                </div>
                <p className="banner-desc">
                  {selectedCategory === "Combos"
                    ? "Specially curated value meal combos with complimentary sides and chilled drinks. Save up to 40%!"
                    : selectedCategory === "Chinese"
                    ? "Wok-tossed noodles, Schezwan fried rice, momos, and crispy Manchurian starters."
                    : selectedCategory === "Pizza"
                    ? "Fresh handcrafted cheesy pizzas with Italian herb crust and stuffed garlic breadsticks."
                    : selectedCategory === "Burger"
                    ? "Crispy veggie & grilled chicken burgers with seasoned fries and cheesy nachos."
                    : selectedCategory === "Biryani"
                    ? "Slow-cooked fragrant dum biryanis, soft butter naans, and rich creamy curries."
                    : selectedCategory === "SouthIndian"
                    ? "Crispy dosas, fluffy steamed idlis, and golden medu vadas with authentic sambar."
                    : selectedCategory === "Breakfast"
                    ? "Golden samosas, kachoris, hot jalebis, poha, pav bhaji, and street food favorites."
                    : selectedCategory === "Drinks"
                    ? "Ice-cold soft drinks, thick creamy milkshakes, coolers, and rich cold coffee."
                    : selectedCategory === "Dessert"
                    ? "Melt-in-mouth hot chocolate lava cakes, sizzling brownies, and royal sweets."
                    : "Freshly prepared gourmet dishes made to order with authentic ingredients."}
                </p>
              </div>
            </div>

            <button
              className="reset-to-all-btn"
              onClick={() => setSelectedCategory("All")}
            >
              View All Categories ↺
            </button>
          </div>
        )}

        {/* ================= SPLIT SCREEN LAYOUT: FOOD ITEMS + POS ORDER PANEL (IMAGE 4) ================= */}
        <div className="menu-split-layout">
          <div className="menu-dishes-area">
            {/* LOADING STATE */}
            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading fresh food menu...</p>
              </div>
            ) : filteredFoods.length === 0 ? (
              <div className="no-items-state">
                <span className="no-items-icon">🍽️</span>
                <h3>No dishes found</h3>
                <p>We couldn't find any dishes matching your current search or dietary filters.</p>
                <button
                  className="primary-btn"
                  onClick={() => {
                    setSelectedCategory("All");
                    setLocalSearch("");
                    setVegFilter("ALL");
                  }}
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <>
                {/* VIEW A: ORGANIZED SECTIONS (when All is selected and no search) */}
                {selectedCategory === "All" && !localSearch && viewLayout === "sections" ? (
                  <div className="menu-sections-wrapper">
                    {sectionCategories.map((cat) => {
                      const catFoods = filteredFoods.filter(
                        (f) =>
                          f.category &&
                          f.category.toLowerCase() === cat.id.toLowerCase()
                      );
                      if (catFoods.length === 0) return null;

                      return (
                        <section
                          key={cat.id}
                          className={`menu-category-section ${
                            cat.id === "Combos" ? "combos-highlight-section" : ""
                          }`}
                          id={`sec-${cat.id}`}
                        >
                          <div className="category-section-banner">
                            <div className="cat-header-left">
                              <span className="cat-large-icon">{cat.icon}</span>
                              <div>
                                <div className="cat-title-with-badge">
                                  <h2 className="cat-section-title">{cat.name}</h2>
                                  {cat.id === "Combos" && (
                                    <span className="section-deal-badge">🔥 SAVE UP TO 40%</span>
                                  )}
                                </div>
                                <span className="cat-section-count">
                                  {catFoods.length} dishes available
                                </span>
                              </div>
                            </div>

                            <button
                              className="view-cat-only-btn"
                              onClick={() => {
                                setSelectedCategory(cat.id);
                                const el = document.querySelector(".menu-content-anchor");
                                if (el) el.scrollIntoView({ behavior: "smooth" });
                              }}
                            >
                              View Only {cat.name} →
                            </button>
                          </div>

                          <div className="food-grid">
                            {catFoods.map((food) => (
                              <FoodCard key={food.id} food={food} />
                            ))}
                          </div>
                        </section>
                      );
                    })}
                  </div>
                ) : (
                  /* VIEW B: UNIFORM GRID (Filtered or Grid layout) */
                  <div className="food-grid">
                    {filteredFoods.map((food) => (
                      <FoodCard key={food.id} food={food} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* ================= DEDICATED POS LIVE ORDER TICKET (MATCHING IMAGE 4) ================= */}
          {cart.length > 0 && (
            <aside className="pos-order-sidebar">
              <div className="pos-sidebar-header">
                <div className="pos-header-title">
                  <span>📋</span>
                  <h3>ORDER</h3>
                  <span className="pos-order-tag">{totalCount} {totalCount === 1 ? "Item" : "Items"}</span>
                </div>
                <button
                  className="pos-clear-btn"
                  onClick={clearCart}
                  title="Clear order"
                >
                  Clear ✕
                </button>
              </div>

              {/* Table Column Header: ITEM | QTY | AMOUNT */}
              <div className="pos-table-header">
                <span>ITEM</span>
                <span>QTY</span>
                <span>AMOUNT</span>
              </div>

              {/* Scrollable list of ordered items */}
              <div className="pos-items-scroll-list">
                {cart.map((item) => (
                  <div key={item.id} className="pos-item-row">
                    <div className="pos-item-name-group">
                      <span className="pos-item-title">{item.name}</span>
                    </div>

                    <div className="qty-control-inline mini">
                      <button
                        className="qty-btn"
                        onClick={() => updateQuantity(item.id, -1)}
                        title="Decrease"
                      >
                        -
                      </button>
                      <span className="qty-val">{item.quantity}</span>
                      <button
                        className="qty-btn"
                        onClick={() => updateQuantity(item.id, 1)}
                        title="Increase"
                      >
                        +
                      </button>
                    </div>

                    <div className="pos-item-subtotal">
                      ₹{item.price * item.quantity}
                    </div>
                  </div>
                ))}
              </div>

              {/* Bill Breakdown */}
              <div className="pos-sidebar-footer">
                <div className="pos-bill-line">
                  <span>Subtotal</span>
                  <span>₹{totalAmount}</span>
                </div>
                <div className={`pos-bill-line ${deliveryFee === 0 ? "free-delivery" : ""}`}>
                  <span>Delivery</span>
                  <span>{deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}</span>
                </div>
                <div className="pos-bill-line">
                  <span>Taxes (5% GST)</span>
                  <span>₹{taxes}</span>
                </div>

                <div className="pos-total-row">
                  <span>TOTAL:</span>
                  <span className="total-amount">₹{grandTotal}</span>
                </div>

                <button
                  className="pos-submit-btn"
                  onClick={() => onNavigate("checkout")}
                >
                  SUBMIT ORDER →
                </button>
              </div>
            </aside>
          )}
        </div>
      </div>

      {/* ================= FLOATING STICKY QUICK-CART BAR (MOBILE / TABLET) ================= */}
      {totalCount > 0 && (
        <div className="floating-cart-bar" onClick={() => setIsCartOpen(true)}>
          <div className="floating-cart-info">
            <span className="floating-cart-icon">🛒</span>
            <div className="floating-cart-text">
              <strong>
                {totalCount} {totalCount === 1 ? "Item" : "Items"} Added
              </strong>
              <span className="floating-cart-dot">•</span>
              <span className="floating-cart-total">₹{totalAmount}</span>
            </div>
          </div>
          <button className="floating-view-cart-btn">
            View Cart & Checkout →
          </button>
        </div>
      )}
    </div>
  );
}
