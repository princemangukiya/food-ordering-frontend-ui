import React, { useState, useEffect } from "react";
import FoodCard from "../components/FoodCard";
import { getFoods } from "../services/api";
import { CATEGORIES, INITIAL_FOOD_ITEMS } from "../data/foodData";

export default function Home({ searchTerm, onNavigate }) {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLiveBackend, setIsLiveBackend] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    getFoods(selectedCategory, searchTerm)
      .then((data) => {
        if (isMounted) {
          if (Array.isArray(data) && data.length > 0) {
            const existingIds = new Set(data.map((d) => d.id));
            const extraItems = INITIAL_FOOD_ITEMS.filter((i) => !existingIds.has(i.id));
            let combined = [...data, ...extraItems];
            if (selectedCategory !== "All") {
              combined = combined.filter(
                (f) => f.category && f.category.toLowerCase() === selectedCategory.toLowerCase()
              );
            }
            if (searchTerm) {
              combined = combined.filter((f) =>
                f.name.toLowerCase().includes(searchTerm.toLowerCase())
              );
            }
            setFoods(combined);
            setIsLiveBackend(true);
          } else if (Array.isArray(data) && data.length === 0 && (searchTerm || selectedCategory !== "All")) {
            setFoods([]);
            setIsLiveBackend(true);
          } else {
            setFoods(INITIAL_FOOD_ITEMS);
          }
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          let filtered = INITIAL_FOOD_ITEMS;
          if (selectedCategory !== "All") {
            filtered = filtered.filter(
              (f) => f.category.toLowerCase() === selectedCategory.toLowerCase()
            );
          }
          if (searchTerm) {
            filtered = filtered.filter((f) =>
              f.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
          }
          setFoods(filtered);
          setIsLiveBackend(false);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedCategory, searchTerm]);

  // Featured Combos
  const comboDeals = foods.filter((f) => f.category === "Combos" || f.isCombo).slice(0, 3);

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <span className="hero-badge">⚡ Superfast 30 Min Delivery</span>
          <h1 className="hero-title">
            Craving Something <span className="highlight-text">Delicious?</span>
          </h1>
          <p className="hero-desc">
            Order mouthwatering Chinese dishes, cold drinks, crispy burgers, authentic dum biryanis, and super-saver value combos delivered hot to your doorstep!
          </p>
          <div className="hero-features">
            <div className="feature-item">
              <span className="feat-icon">🔥</span>
              <span>Fresh & Hot</span>
            </div>
            <div className="feature-item">
              <span className="feat-icon">🚀</span>
              <span>Free Delivery &gt; ₹499</span>
            </div>
            <div className="feature-item">
              <span className="feat-icon">⭐</span>
              <span>4.9/5 Food Rating</span>
            </div>
          </div>
          <div className="hero-cta-row">
            <button className="hero-primary-btn" onClick={() => onNavigate("menu")}>
              Explore Full Menu 📜
            </button>
            <button className="hero-secondary-btn" onClick={() => onNavigate("orders")}>
              View Live Orders 🛎️
            </button>
          </div>
        </div>
        <div className="hero-image-wrap">
          <img
            src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=700&auto=format&fit=crop&q=80"
            alt="Delicious Feast"
            className="hero-main-img"
          />
        </div>
      </section>

      {/* Featured Combos Spotlight */}
      {comboDeals.length > 0 && selectedCategory === "All" && !searchTerm && (
        <section className="combos-spotlight-section">
          <div className="spotlight-header">
            <div>
              <span className="spotlight-badge">🔥 SAVINGS UP TO 40%</span>
              <h2>Super Saver Combo Deals</h2>
              <p>Special curated combo meals for the ultimate feast</p>
            </div>
            <button className="see-all-combos-btn" onClick={() => {
              if (onNavigate) {
                onNavigate("menu", "Combos");
              } else {
                setSelectedCategory("Combos");
                window.scrollTo({ top: 600, behavior: "smooth" });
              }
            }}>
              View All Combos (6) →
            </button>
          </div>

          <div className="combos-grid">
            {comboDeals.map((food) => (
              <FoodCard key={food.id} food={food} />
            ))}
          </div>
        </section>
      )}

      {/* Categories Bar */}
      <section className="categories-section">
        <div className="section-header">
          <h2>Inspiration For Your Order</h2>
          <p>Explore all culinary sections: Cold Drinks, Chinese, Food, Combos & more</p>
        </div>
        <div className="category-chips">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              className={`category-chip ${
                selectedCategory === cat.id ? "active" : ""
              }`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              <span className="cat-icon">{cat.icon}</span>
              <span className="cat-name">{cat.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Food Items Section */}
      <section className="menu-section">
        <div className="section-header-flex">
          <div>
            <h2>
              {selectedCategory === "All"
                ? "Popular Dishes For You"
                : `${selectedCategory} Specials`}
            </h2>
            <span className="items-count-text">
              {foods.length} items available
            </span>
          </div>
          <div className="header-tags-wrap">
            {isLiveBackend ? (
              <span className="backend-indicator live">● Connected to Spring Boot</span>
            ) : (
              <span className="backend-indicator demo">⚡ Fast In-Memory Database</span>
            )}
            <button className="full-menu-jump-btn" onClick={() => onNavigate("menu")}>
              Open Full Menu View ↗
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Fetching delicious food items...</p>
          </div>
        ) : foods.length === 0 ? (
          <div className="no-items-state">
            <span className="no-items-icon">🔍</span>
            <h3>No matching food found</h3>
            <p>Try clearing your search query or selecting another category.</p>
          </div>
        ) : (
          <div className="food-grid">
            {foods.map((food) => (
              <FoodCard key={food.id} food={food} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
