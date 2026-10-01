import React, { useState, useEffect, useRef, useMemo } from "react";
import "./App.css";
import { CartProvider, useCart } from "./context/CartContext";
import TopBar from "./components/TopBar";
import Sidebar from "./components/Sidebar";
import OrderSidebar from "./components/OrderSidebar";
import MenuFeed from "./components/MenuFeed";
import DishDetailModal from "./components/DishDetailModal";
import CheckoutDrawer from "./components/CheckoutDrawer";
import AdminLoginModal from "./components/AdminLoginModal";
import ShareModal from "./components/ShareModal";
import TrackOrder from "./pages/TrackOrder";
import LiveOrders from "./pages/LiveOrders";
import OrderSuccess from "./pages/OrderSuccess";
import ReviewsFeed from "./pages/ReviewsFeed";
import { CATEGORIES, INITIAL_FOOD_ITEMS } from "./data/foodData";
import { getAllOrders, getFoods } from "./services/api";

// Web Audio API Chime for incoming restaurant orders
function playRestaurantBell() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const now = ctx.currentTime;
    // Chime 1
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.4, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.8);

    // Chime 2
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(987.77, now + 0.18);
    gain2.gain.setValueAtTime(0.45, now + 0.18);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.1);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.18);
    osc2.stop(now + 1.1);
  } catch (e) {
    console.warn("Audio chime error:", e);
  }
}

function MainAppContent() {
  // Navigation View: "menu" | "track" | "orders" | "ordersuccess"
  const [activeView, setActiveView] = useState("menu");

  // Left Sidebar and Filter States
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [orderSidebarOpen, setOrderSidebarOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [vegFilter, setVegFilter] = useState("ALL"); // "ALL" | "VEG" | "NON_VEG"
  const [quickFilter, setQuickFilter] = useState("ALL"); // "ALL" | "BESTSELLER" | "CHEF" | "SPICY"
  const [sortBy, setSortBy] = useState("DEFAULT"); // "DEFAULT" | "PRICE_ASC" | "PRICE_DESC" | "RATING"
  const [orderMode, setOrderMode] = useState("DELIVERY"); // "DELIVERY" | "TAKEAWAY" | "DINEIN"
  const [deliveryAddress, setDeliveryAddress] = useState("Flat 402, Sunshine Heights, Sector 18, Noida");

  // Food Data States
  const [foods, setFoods] = useState(INITIAL_FOOD_ITEMS);
  const [loadingFoods, setLoadingFoods] = useState(false);

  // Modals & Drawers
  const [selectedDishModal, setSelectedDishModal] = useState(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [latestOrder, setLatestOrder] = useState(null);

  // Admin & Sound States
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeOrdersCount, setActiveOrdersCount] = useState(0);
  const [globalOrderAlert, setGlobalOrderAlert] = useState(null);
  const [isAdmin, setIsAdmin] = useState(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("admin") === "true") return true;
      const sessionLogged = sessionStorage.getItem("food_admin_logged_in") === "true";
      // Clear legacy localStorage admin flag so regular users never see kitchen POS
      if (!sessionLogged) {
        localStorage.removeItem("food_admin_logged_in");
      }
      return sessionLogged;
    } catch {
      return false;
    }
  });

  const knownOrderIdsRef = useRef(new Set());
  const isInitialLoadRef = useRef(true);

  // Load foods with backend sync
  useEffect(() => {
    let isMounted = true;
    setLoadingFoods(true);

    getFoods()
      .then((data) => {
        if (isMounted) {
          if (Array.isArray(data) && data.length > 0) {
            const existingIds = new Set(data.map((d) => d.id));
            const extraItems = INITIAL_FOOD_ITEMS.filter((i) => !existingIds.has(i.id));
            setFoods([...data, ...extraItems]);
          } else {
            setFoods(INITIAL_FOOD_ITEMS);
          }
          setLoadingFoods(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setFoods(INITIAL_FOOD_ITEMS);
          setLoadingFoods(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Compute category counts
  const categoryCounts = useMemo(() => {
    const counts = { All: foods.length };
    foods.forEach((f) => {
      const cat = f.category || "Other";
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [foods]);

  // Monitor Live Orders
  const fetchOrdersAndMonitor = async () => {
    try {
      const orders = await getAllOrders();
      if (!Array.isArray(orders)) return;

      const active = orders.filter((o) =>
        ["CONFIRMED", "PREPARING", "PENDING", "OUT_FOR_DELIVERY", "OUT FOR DELIVERY"].includes(
          (o.orderStatus || "").toUpperCase()
        )
      ).length;
      setActiveOrdersCount(active);

      if (isInitialLoadRef.current) {
        orders.forEach((o) => {
          if (o.id) knownOrderIdsRef.current.add(o.id);
        });
        isInitialLoadRef.current = false;
        return;
      }

      const newOrders = orders.filter((o) => o.id && !knownOrderIdsRef.current.has(o.id));
      if (newOrders.length > 0) {
        newOrders.forEach((o) => knownOrderIdsRef.current.add(o.id));
        newOrders.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        const newest = newOrders[0];

        if (isAdmin) {
          if (soundEnabled) {
            playRestaurantBell();
          }
          setGlobalOrderAlert({
            id: newest.id,
            customerName: newest.customerName || "Customer",
            customerPhone: newest.customerPhone || "",
            totalAmount: newest.totalAmount || 0,
            itemsCount: (newest.orderItems || []).length,
          });

          setTimeout(() => {
            setGlobalOrderAlert((cur) => (cur?.id === newest.id ? null : cur));
          }, 9000);
        }
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchOrdersAndMonitor();
    const timer = setInterval(fetchOrdersAndMonitor, 3500);
    return () => clearInterval(timer);
  }, [soundEnabled, isAdmin]);

  const toggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      if (next) playRestaurantBell();
      return next;
    });
  };

  const handleAdminLoginSuccess = () => {
    setIsAdmin(true);
    sessionStorage.setItem("food_admin_logged_in", "true");
    setIsAdminLoginOpen(false);
    setActiveView("orders");
  };

  const handleAdminLogout = () => {
    setIsAdmin(false);
    sessionStorage.removeItem("food_admin_logged_in");
    localStorage.removeItem("food_admin_logged_in");
    setActiveView("menu");
  };

  const handleOrderSuccess = (placedOrder) => {
    setLatestOrder(placedOrder);
    if (placedOrder && placedOrder.id) {
      knownOrderIdsRef.current.add(placedOrder.id);
    }
    setActiveView("ordersuccess");
    window.scrollTo({ top: 0, behavior: "smooth" });
    fetchOrdersAndMonitor();
  };

  return (
    <div className="unified-app-layout">
      {/* Global Toast for Incoming Orders (Admin only) */}
      {isAdmin && globalOrderAlert && (
        <div className="global-order-toast" role="alert">
          <div className="global-toast-glow"></div>
          <div className="global-toast-bell">🔔</div>
          <div className="global-toast-details">
            <div className="global-toast-title">
              <span className="global-toast-badge">NEW ONLINE ORDER!</span>
              <strong>#ORD-{globalOrderAlert.id}</strong>
            </div>
            <div className="global-toast-info">
              <span>👤 {globalOrderAlert.customerName}</span>
              <span>•</span>
              <span className="global-toast-amount">₹{globalOrderAlert.totalAmount}</span>
              <span>•</span>
              <span>{globalOrderAlert.itemsCount} item(s)</span>
            </div>
          </div>
          <div className="global-toast-actions">
            <button
              className="global-toast-view-btn"
              onClick={() => {
                setActiveView("orders");
                setGlobalOrderAlert(null);
              }}
            >
              View Live Orders 👁️
            </button>
            <button
              className="global-toast-close-btn"
              onClick={() => setGlobalOrderAlert(null)}
              title="Dismiss"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Top Navigation & Status Bar */}
      <TopBar
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        deliveryAddress={deliveryAddress}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
        isAdmin={isAdmin}
        onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
        onAdminLogout={handleAdminLogout}
        activeOrdersCount={activeOrdersCount}
        onToggleCart={() => setOrderSidebarOpen((prev) => !prev)}
        activeView={activeView}
        onSelectView={(v) => {
          if (v === "orders" && !isAdmin) {
            setIsAdminLoginOpen(true);
            return;
          }
          setActiveView(v);
        }}
        onOpenShareModal={() => setIsShareOpen(true)}
      />

      {/* Main Single-Page Workspace */}
      <div className="app-workspace-body">
        {/* 1. Left Sidebar: Categories, Dietary filters, Sort, Views */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          categories={CATEGORIES}
          selectedCategory={selectedCategory}
          onSelectCategory={(catId) => {
            setSelectedCategory(catId);
            setActiveView("menu");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          vegFilter={vegFilter}
          onSelectVegFilter={setVegFilter}
          quickFilter={quickFilter}
          onSelectQuickFilter={setQuickFilter}
          sortBy={sortBy}
          onSelectSortBy={setSortBy}
          activeView={activeView}
          onSelectView={(view) => {
            if (view === "orders" && !isAdmin) {
              setIsAdminLoginOpen(true);
              return;
            }
            setActiveView(view);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          activeOrdersCount={activeOrdersCount}
          orderMode={orderMode}
          onChangeOrderMode={setOrderMode}
          categoryCounts={categoryCounts}
          isAdmin={isAdmin}
          onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
          onOpenShareModal={() => setIsShareOpen(true)}
        />

        {/* 2. Center Stage: MenuFeed / TrackOrder / LiveOrders / OrderSuccess */}
        <main className="center-stage-container">
          {activeView === "menu" && (
            <MenuFeed
              foods={foods}
              loading={loadingFoods}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              vegFilter={vegFilter}
              setVegFilter={setVegFilter}
              quickFilter={quickFilter}
              setQuickFilter={setQuickFilter}
              sortBy={sortBy}
              setSortBy={setSortBy}
              onOpenDishDetail={(dish) => setSelectedDishModal(dish)}
              orderMode={orderMode}
              onOpenCart={() => setOrderSidebarOpen(true)}
            />
          )}

          {activeView === "track" && (
            <div className="in-page-view-stage">
              <div className="in-page-stage-header">
                <button
                  className="in-page-back-btn"
                  onClick={() => setActiveView("menu")}
                >
                  ← Back to Food Menu
                </button>
                <span className="in-page-badge">🛵 Real-Time Delivery Tracking</span>
              </div>
              <TrackOrder
                latestOrder={latestOrder}
                onNavigate={(page) => {
                  if (page === "menu") setActiveView("menu");
                  else if (page === "reviews") setActiveView("reviews");
                  else if (page === "orders" && isAdmin) setActiveView("orders");
                }}
              />
            </div>
          )}

          {activeView === "reviews" && (
            <div className="in-page-view-stage">
              <div className="in-page-stage-header">
                <button
                  className="in-page-back-btn"
                  onClick={() => setActiveView("menu")}
                >
                  ← Back to Food Menu
                </button>
                <span className="in-page-badge">⭐ Customer Ratings & Reviews</span>
              </div>
              <ReviewsFeed
                onNavigate={(page) => {
                  if (page === "menu") setActiveView("menu");
                  else if (page === "track") setActiveView("track");
                }}
              />
            </div>
          )}

          {activeView === "orders" && (
            isAdmin ? (
              <div className="in-page-view-stage">
                <div className="in-page-stage-header">
                  <button
                    className="in-page-back-btn"
                    onClick={() => setActiveView("menu")}
                  >
                    ← Back to Food Menu
                  </button>
                  <span className="in-page-badge">👨‍🍳 Kitchen POS & Order Manager</span>
                </div>
                <LiveOrders
                  onNavigate={(page) => {
                    if (page === "menu") setActiveView("menu");
                    else if (page === "track") setActiveView("track");
                  }}
                />
              </div>
            ) : (
              <div className="in-page-view-stage">
                <div className="in-page-stage-header">
                  <button
                    className="in-page-back-btn"
                    onClick={() => setActiveView("menu")}
                  >
                    ← Back to Food Menu
                  </button>
                  <span className="in-page-badge">🔒 Staff Access Only</span>
                </div>
                <div className="track-empty-box">
                  <div className="empty-icon">👨‍🍳</div>
                  <h3>Kitchen Dashboard is for Restaurant Staff</h3>
                  <p>Customers can order food and track deliveries directly from the menu.</p>
                  <button className="primary-btn" onClick={() => setActiveView("menu")}>
                    Back to Food Menu 🍔
                  </button>
                </div>
              </div>
            )
          )}

          {activeView === "ordersuccess" && (
            <div className="in-page-view-stage">
              <div className="in-page-stage-header">
                <button
                  className="in-page-back-btn"
                  onClick={() => setActiveView("menu")}
                >
                  ← Continue Shopping Menu
                </button>
                <span className="in-page-badge">🎉 Order Receipt & Status</span>
              </div>
              <OrderSuccess
                order={latestOrder}
                onNavigate={(page) => {
                  if (page === "track") setActiveView("track");
                  else if (page === "reviews") setActiveView("reviews");
                  else setActiveView("menu");
                }}
              />
            </div>
          )}
        </main>

        {/* 3. Right Sidebar: Live Order Ticket / POS Cart */}
        <OrderSidebar
          isOpen={orderSidebarOpen}
          onClose={() => setOrderSidebarOpen(false)}
          orderMode={orderMode}
          onOpenCheckout={() => {
            setOrderSidebarOpen(false);
            setIsCheckoutOpen(true);
          }}
          deliveryAddress={deliveryAddress}
        />
      </div>

      {/* In-Page Slide-Over Checkout Drawer */}
      <CheckoutDrawer
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        orderMode={orderMode}
        deliveryAddress={deliveryAddress}
        onOrderSuccess={(placedOrder) => {
          setIsCheckoutOpen(false);
          handleOrderSuccess(placedOrder);
        }}
      />

      {/* Dish Detail Modal (Item inspection with ingredients, notes, ratings) */}
      {selectedDishModal && (
        <DishDetailModal
          dish={selectedDishModal}
          onClose={() => setSelectedDishModal(null)}
        />
      )}

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onLoginSuccess={handleAdminLoginSuccess}
      />

      {/* Share Public Link & QR Code Modal */}
      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <CartProvider>
      <MainAppContent />
    </CartProvider>
  );
}
