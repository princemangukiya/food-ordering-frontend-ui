import React from "react";
import { useCart } from "../context/CartContext";

export default function Navbar({
  onNavigate,
  currentPage,
  searchTerm,
  setSearchTerm,
  activeOrdersCount = 0,
  soundEnabled = true,
  onToggleSound,
  isAdmin = false,
  onOpenAdminLogin,
  onAdminLogout,
}) {
  const { totalCount, setIsCartOpen } = useCart();

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    if (val && currentPage !== "menu" && currentPage !== "home") {
      onNavigate("menu");
    }
  };

  return (
    <header className="navbar-header">
      <div className="navbar-container">
        {/* Logo */}
        <div className="navbar-logo" onClick={() => onNavigate("home")}>
          <span className="logo-icon">🍔</span>
          <span className="logo-text">
            Food<span className="highlight">Express</span>
          </span>
          {isAdmin && <span className="nav-admin-chip">ADMIN / KITCHEN</span>}
        </div>

        {/* Search Bar */}
        <div className="navbar-search">
          <svg
            className="search-icon"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search pizza, burger, biryani, noodles, drinks..."
            value={searchTerm}
            onChange={handleSearchChange}
            onFocus={() => {
              if (currentPage !== "menu" && currentPage !== "home") {
                onNavigate("menu");
              }
            }}
          />
          {searchTerm && (
            <button className="clear-search-btn" onClick={() => setSearchTerm("")}>
              ✕
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="navbar-actions">
          <button
            className={`nav-link-btn ${currentPage === "home" ? "active" : ""}`}
            onClick={() => onNavigate("home")}
          >
            Home
          </button>
          <button
            className={`nav-link-btn ${currentPage === "menu" ? "active" : ""}`}
            onClick={() => onNavigate("menu")}
          >
            Menu 📜
          </button>

          <button
            className={`nav-link-btn ${currentPage === "track" ? "active" : ""}`}
            onClick={() => onNavigate("track")}
          >
            Track Order 🛵
          </button>

          {/* Admin-Only Kitchen Dashboard & Controls */}
          {isAdmin && (
            <>
              <button
                className={`nav-link-btn live-orders-link ${currentPage === "orders" ? "active" : ""}`}
                onClick={() => onNavigate("orders")}
              >
                <span className="live-dot-ping"></span>
                <span>Live Orders 👨‍🍳</span>
                {activeOrdersCount > 0 && (
                  <span className="orders-count-badge">{activeOrdersCount}</span>
                )}
              </button>

              {onToggleSound && (
                <button
                  className={`nav-sound-toggle-btn ${soundEnabled ? "sound-active" : "sound-muted"}`}
                  onClick={onToggleSound}
                  title={soundEnabled ? "Kitchen Bell Chime is ON" : "Kitchen Bell Chime is MUTED"}
                >
                  {soundEnabled ? "🔔 Chime ON" : "🔕 Muted"}
                </button>
              )}

              <button
                className="nav-admin-exit-btn"
                onClick={onAdminLogout}
                title="Exit Admin Mode"
              >
                Logout 🚪
              </button>
            </>
          )}

          {/* Staff Login for non-admins */}
          {!isAdmin && onOpenAdminLogin && (
            <button
              className="nav-staff-login-btn"
              onClick={onOpenAdminLogin}
              title="Staff / Kitchen Login"
            >
              🔒 Staff
            </button>
          )}

          <button
            className="cart-btn"
            onClick={() => setIsCartOpen(true)}
            aria-label="View Cart"
          >
            <svg
              width="22"
              height="22"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <span className="cart-label">Cart</span>
            {totalCount > 0 && <span className="cart-badge">{totalCount}</span>}
          </button>
        </div>
      </div>
    </header>
  );
}
