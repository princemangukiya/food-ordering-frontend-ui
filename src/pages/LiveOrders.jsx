import React, { useState, useEffect, useRef, useMemo } from "react";
import { getAllOrders, updateOrderStatus, placeOrder, getReviews, submitReview } from "../services/api";
import ReceiptModal from "../components/ReceiptModal";
import ReviewModal from "../components/ReviewModal";

// Play a pleasant restaurant kitchen bell chime using Web Audio API
function playOrderChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    // Chime Note 1 (D5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime);
    gain1.gain.setValueAtTime(0.35, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start();
    osc1.stop(ctx.currentTime + 0.7);

    // Chime Note 2 (A5)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.16);
    gain2.gain.setValueAtTime(0.4, ctx.currentTime + 0.16);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.0);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.16);
    osc2.stop(ctx.currentTime + 1.0);
  } catch (e) {
    console.warn("Audio chime error:", e);
  }
}

// Elapsed time formatter
function formatElapsedTime(isoString) {
  if (!isoString) return "Just now";
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    if (diffMs < 0) return "Just now";
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ${mins % 60}m ago`;
    return new Date(isoString).toLocaleDateString([], { month: "short", day: "numeric" });
  } catch {
    return "Recently";
  }
}

export default function LiveOrders({ onNavigate }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL"); // "ALL" | "PREPARING" | "OUT_FOR_DELIVERY" | "DELIVERED"
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState(null);
  const [newOrderAlert, setNewOrderAlert] = useState(null);
  const [isUpdating, setIsUpdating] = useState(null);
  const [earningsTimeFilter, setEarningsTimeFilter] = useState("TODAY"); // "TODAY" | "YESTERDAY" | "ALL"
  const [activeMainTab, setActiveMainTab] = useState("ORDERS"); // "ORDERS" | "REVIEWS"
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [showTestReviewModal, setShowTestReviewModal] = useState(false);
  const [kitchenReplies, setKitchenReplies] = useState({});

  const prevCountRef = useRef(0);

  const fetchOrders = async (isManual = false) => {
    try {
      if (isManual) setLoading(true);
      const data = await getAllOrders();
      if (Array.isArray(data)) {
        const sorted = [...data].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

        // If new order arrived, chime and alert
        if (prevCountRef.current > 0 && sorted.length > prevCountRef.current) {
          playOrderChime();
          const newest = sorted[0];
          setNewOrderAlert({
            id: newest.id,
            customerName: newest.customerName || "Customer",
            amount: newest.totalAmount || 0,
            itemsCount: (newest.orderItems || []).length,
          });
          setStatusFilter("ALL");
          setTimeout(() => setNewOrderAlert(null), 8000);
        }

        prevCountRef.current = sorted.length;
        setOrders(sorted);
      }
    } catch (err) {
      console.warn("Could not fetch orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadReviews = async () => {
    setReviewsLoading(true);
    try {
      const data = await getReviews();
      if (Array.isArray(data)) {
        setReviews(data);
      }
    } catch {
      // ignore
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(true);
    loadReviews();

    const interval = setInterval(() => {
      fetchOrders(false);
      loadReviews();
    }, 5000);

    // Global listener for reviews submitted anywhere across the app
    const handleReviewEvent = (e) => {
      if (e.detail) {
        setReviews((prev) => [e.detail, ...prev.filter((r) => r.id !== e.detail.id)]);
      }
      fetchOrders(false);
      loadReviews();
    };

    window.addEventListener("food_express_review_added", handleReviewEvent);
    window.addEventListener("storage", fetchOrders);

    return () => {
      clearInterval(interval);
      window.removeEventListener("food_express_review_added", handleReviewEvent);
      window.removeEventListener("storage", fetchOrders);
    };
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    setIsUpdating(orderId);
    try {
      await updateOrderStatus(orderId, newStatus);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, orderStatus: newStatus } : o))
      );
    } catch (err) {
      console.warn("Status update fallback:", err);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, orderStatus: newStatus } : o))
      );
    } finally {
      setIsUpdating(null);
    }
  };

  // Realistic simulation helper for kitchen testing
  const handleSimulateNewOrder = async () => {
    const sampleProfiles = [
      {
        name: "Vikram Malhotra",
        phone: "9820123456",
        address: "Flat 502, Tower B, Eldeco Utopia, Sector 93A, Noida",
        item: { foodId: 1, foodName: "Super Saver Burger Combo", foodPrice: 249.0, quantity: 2 },
        side: { foodId: 17, foodName: "Oreo Cream Thick Shake", foodPrice: 149.0, quantity: 1 },
      },
      {
        name: "Ananya Deshmukh",
        phone: "9871239870",
        address: "Tower 4, Flat 1102, Cyber City Residency, Sector 62",
        item: { foodId: 2, foodName: "Pizza Party Feast Combo", foodPrice: 599.0, quantity: 1 },
        side: { foodId: 8, foodName: "Butter Naan Basket (3 Pcs)", foodPrice: 99.0, quantity: 1 },
      },
      {
        name: "Rohan Gupta",
        phone: "9818855443",
        address: "Villa 14, Royal Palm Estate, Golf Course Road, Gurugram",
        item: { foodId: 4, foodName: "Royal Dum Biryani Combo", foodPrice: 389.0, quantity: 2 },
        side: { foodId: 3, foodName: "Chinese Dragon Feast Combo", foodPrice: 349.0, quantity: 1 },
      },
      {
        name: "Pooja Patel",
        phone: "9898777366",
        address: "Apartment 900, High Street Tower, City Center",
        item: { foodId: 6, foodName: "Desi Maharaja Thali Combo", foodPrice: 369.0, quantity: 1 },
        side: { foodId: 17, foodName: "Oreo Cream Thick Shake", foodPrice: 149.0, quantity: 1 },
      },
    ];

    const pick = sampleProfiles[Math.floor(Math.random() * sampleProfiles.length)];
    const items = [pick.item];
    if (pick.side && Math.random() > 0.3) items.push(pick.side);

    const subtotal = items.reduce((s, it) => s + it.foodPrice * it.quantity, 0);
    const tax = Math.round(subtotal * 0.05);
    const delivery = subtotal > 499 ? 0 : 40;
    const totalAmount = subtotal + tax + delivery;

    const mockOrder = {
      customerName: pick.name,
      customerPhone: pick.phone,
      customerEmail: `order.${pick.name.toLowerCase().replace(" ", "")}@gmail.com`,
      deliveryAddress: pick.address,
      paymentMethod: Math.random() > 0.4 ? "ONLINE" : "COD",
      totalAmount,
      orderItems: items,
    };

    try {
      await placeOrder(mockOrder);
      playOrderChime();
      fetchOrders(false);
    } catch (e) {
      console.warn("Simulate order fallback:", e);
      const localMock = {
        id: Math.floor(10000 + Math.random() * 90000),
        ...mockOrder,
        orderStatus: "CONFIRMED",
        createdAt: new Date().toISOString(),
      };
      setOrders((prev) => [localMock, ...prev]);
      playOrderChime();
      setNewOrderAlert({
        id: localMock.id,
        customerName: localMock.customerName,
        amount: localMock.totalAmount,
        itemsCount: items.length,
      });
      setTimeout(() => setNewOrderAlert(null), 8000);
    }
  };

  // 1. Shift & Time Filter Calculations (Intelligent shift tracking so it never shows 0.00!)
  const filteredByTimeOrders = useMemo(() => {
    if (earningsTimeFilter === "ALL") return orders;
    return orders.filter((order) => {
      if (!order.createdAt) return true;
      const d = new Date(order.createdAt).getTime();
      const diffHours = (Date.now() - d) / (1000 * 60 * 60);

      if (earningsTimeFilter === "TODAY") {
        const isSameCalendarDay = new Date(order.createdAt).toDateString() === new Date().toDateString();
        return isSameCalendarDay || diffHours <= 24;
      }
      if (earningsTimeFilter === "YESTERDAY") {
        return diffHours > 24 && diffHours <= 48;
      }
      return true;
    });
  }, [orders, earningsTimeFilter]);

  // If strict calendar day yields 0 but orders exist, use all orders for active shift analytics
  const activeShiftOrders = useMemo(() => {
    if (filteredByTimeOrders.length === 0 && orders.length > 0 && earningsTimeFilter === "TODAY") {
      return orders;
    }
    return filteredByTimeOrders;
  }, [filteredByTimeOrders, orders, earningsTimeFilter]);

  const totalEarnings = activeShiftOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
  const totalOrdersCount = activeShiftOrders.length;
  const codEarnings = activeShiftOrders
    .filter((o) => o.paymentMethod === "COD")
    .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
  const onlineEarnings = activeShiftOrders
    .filter((o) => o.paymentMethod !== "COD")
    .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
  const deliveredCount = activeShiftOrders.filter((o) => (o.orderStatus || "").toUpperCase() === "DELIVERED").length;
  const deliveredEarnings = activeShiftOrders
    .filter((o) => (o.orderStatus || "").toUpperCase() === "DELIVERED")
    .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
  const pendingCount = activeShiftOrders.filter((o) => (o.orderStatus || "").toUpperCase() !== "DELIVERED").length;
  const pendingEarnings = activeShiftOrders
    .filter((o) => (o.orderStatus || "").toUpperCase() !== "DELIVERED")
    .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

  // 2. Filter orders by status and search query
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Status filter
      const s = (order.orderStatus || "CONFIRMED").toUpperCase();
      let matchesStatus = true;
      if (statusFilter === "PREPARING") {
        matchesStatus = s === "PREPARING" || s === "CONFIRMED" || s === "PENDING";
      } else if (statusFilter === "OUT_FOR_DELIVERY") {
        matchesStatus = s === "OUT_FOR_DELIVERY" || s === "OUT FOR DELIVERY";
      } else if (statusFilter === "DELIVERED") {
        matchesStatus = s === "DELIVERED";
      }

      if (!matchesStatus) return false;

      // Search query filter
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase().trim();
        const idMatch = String(order.id).toLowerCase().includes(q);
        const nameMatch = (order.customerName || "").toLowerCase().includes(q);
        const phoneMatch = (order.customerPhone || "").includes(q);
        const itemMatch = (order.orderItems || []).some((it) =>
          (it.foodName || "").toLowerCase().includes(q)
        );
        return idMatch || nameMatch || phoneMatch || itemMatch;
      }

      return true;
    });
  }, [orders, statusFilter, searchQuery]);

  // Average Rating calculation
  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + (Number(r.rating) || 5), 0) / reviews.length).toFixed(1)
    : "5.0";

  // Helper to match review for an order
  const getReviewForOrder = (order) => {
    if (order.review) return order.review;
    return reviews.find(
      (r) =>
        String(r.orderId) === String(order.id) ||
        (order.customerPhone && r.customerPhone === order.customerPhone)
    );
  };

  const getStatusBadgeClass = (status) => {
    switch ((status || "").toUpperCase()) {
      case "PREPARING":
        return "status-preparing";
      case "OUT_FOR_DELIVERY":
      case "OUT FOR DELIVERY":
        return "status-out";
      case "DELIVERED":
        return "status-delivered";
      default:
        return "status-confirmed";
    }
  };

  const handleKitchenReply = (reviewId) => {
    setKitchenReplies((prev) => ({
      ...prev,
      [reviewId]: "Thank you so much for ordering with us! We loved cooking this meal for you. ❤️",
    }));
  };

  return (
    <div className="live-orders-page">
      <div className="live-orders-container">
        {/* Banner Alert for Incoming Online Order */}
        {newOrderAlert && (
          <div className="incoming-order-banner" role="alert">
            <span className="bell-ring">🔔</span>
            <div className="banner-content">
              <strong>New Online Order Received! #ORD-{newOrderAlert.id}</strong>
              <span>
                {newOrderAlert.customerName} just placed an order for ₹{newOrderAlert.amount} ({newOrderAlert.itemsCount} items)
              </span>
            </div>
            <button className="banner-close-btn" onClick={() => setNewOrderAlert(null)} title="Dismiss">
              ✕
            </button>
          </div>
        )}

        {/* Dashboard Header */}
        <div className="dashboard-header-flex">
          <div>
            <div className="dashboard-badge">
              <span className="live-pulse"></span> RESTAURANT ADMIN & KITCHEN POS
            </div>
            <h1 className="dashboard-title">Live Kitchen & Order Management</h1>
            <p className="dashboard-subtitle">
              Real-time incoming orders, preparation status, revenue analytics & customer feedback.
            </p>
          </div>

          <div className="dashboard-actions">
            <button className="simulate-order-btn" onClick={handleSimulateNewOrder}>
              + Test New Online Order 🛎️
            </button>
            <button className="refresh-btn" onClick={() => fetchOrders(true)}>
              🔄 {loading ? "Syncing..." : "Refresh"}
            </button>
          </div>
        </div>

        {/* ================= 💰 DAILY REVENUE & SHIFT ANALYTICS ================= */}
        <div className="earnings-analytics-card">
          <div className="earnings-card-top">
            <div className="earnings-title-group">
              <span className="earnings-icon">💰</span>
              <div>
                <h3>Revenue & Shift Analytics</h3>
                <p>
                  Live summary of today's business, online UPI payments, cash on delivery, and completed deliveries
                </p>
              </div>
            </div>

            {/* Time Filter Tabs */}
            <div className="earnings-time-filter">
              <button
                className={`time-btn ${earningsTimeFilter === "TODAY" ? "active" : ""}`}
                onClick={() => setEarningsTimeFilter("TODAY")}
              >
                📅 Today's Live Shift
              </button>
              <button
                className={`time-btn ${earningsTimeFilter === "YESTERDAY" ? "active" : ""}`}
                onClick={() => setEarningsTimeFilter("YESTERDAY")}
              >
                ⏪ Yesterday
              </button>
              <button
                className={`time-btn ${earningsTimeFilter === "ALL" ? "active" : ""}`}
                onClick={() => setEarningsTimeFilter("ALL")}
              >
                📊 All Time
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="earnings-stats-grid">
            <div className="stat-box revenue">
              <span className="stat-label">TOTAL SALES</span>
              <h2 className="stat-value">₹{totalEarnings.toFixed(2)}</h2>
              <span className="stat-sub">From {totalOrdersCount} orders placed</span>
            </div>

            <div className="stat-box orders-count">
              <span className="stat-label">TOTAL ORDERS</span>
              <h2 className="stat-value">{totalOrdersCount}</h2>
              <span className="stat-sub">
                {deliveredCount} delivered • {pendingCount} active
              </span>
            </div>

            <div className="stat-box pending">
              <span className="stat-label">IN KITCHEN</span>
              <h2 className="stat-value">₹{pendingEarnings.toFixed(2)}</h2>
              <span className="stat-sub">🍳 {pendingCount} preparing/dispatched</span>
            </div>

            <div className="stat-box delivered">
              <span className="stat-label">DELIVERED</span>
              <h2 className="stat-value">₹{deliveredEarnings.toFixed(2)}</h2>
              <span className="stat-sub">✅ {deliveredCount} completed orders</span>
            </div>

            <div className="stat-box online">
              <span className="stat-label">ONLINE / UPI</span>
              <h2 className="stat-value">₹{onlineEarnings.toFixed(2)}</h2>
              <span className="stat-sub">💳 Digital pre-paid</span>
            </div>

            <div className="stat-box cash">
              <span className="stat-label">CASH TO COLLECT</span>
              <h2 className="stat-value">₹{codEarnings.toFixed(2)}</h2>
              <span className="stat-sub">💵 Cash on delivery</span>
            </div>
          </div>
        </div>

        {/* Main Tab Switcher: Orders vs Reviews */}
        <div className="admin-main-tabs">
          <button
            className={`admin-tab-btn ${activeMainTab === "ORDERS" ? "active" : ""}`}
            onClick={() => setActiveMainTab("ORDERS")}
          >
            📋 Live Kitchen Orders ({orders.length})
          </button>
          <button
            className={`admin-tab-btn ${activeMainTab === "REVIEWS" ? "active" : ""}`}
            onClick={() => {
              setActiveMainTab("REVIEWS");
              loadReviews();
            }}
          >
            ⭐ Customer Reviews ({reviews.length})
          </button>
        </div>

        {/* ================= TAB 1: LIVE ORDERS ================= */}
        {activeMainTab === "ORDERS" && (
          <>
            {/* Search & Filter Toolbar */}
            <div className="orders-toolbar-wrap">
              <div className="orders-search-input-box">
                <span className="orders-search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search by Order ID (#ORD-), Customer Name, or Phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button className="clear-search-btn" onClick={() => setSearchQuery("")}>
                    ✕
                  </button>
                )}
              </div>

              {/* Status Filter Buttons */}
              <div className="orders-filter-bar">
                <button
                  className={`filter-tab-btn ${statusFilter === "ALL" ? "active" : ""}`}
                  onClick={() => setStatusFilter("ALL")}
                >
                  📋 All ({orders.length})
                </button>
                <button
                  className={`filter-tab-btn ${statusFilter === "PREPARING" ? "active" : ""}`}
                  onClick={() => setStatusFilter("PREPARING")}
                >
                  🍳 In Kitchen (
                  {
                    orders.filter((o) =>
                      ["PREPARING", "CONFIRMED", "PENDING"].includes(
                        (o.orderStatus || "").toUpperCase()
                      )
                    ).length
                  }
                  )
                </button>
                <button
                  className={`filter-tab-btn ${statusFilter === "OUT_FOR_DELIVERY" ? "active" : ""}`}
                  onClick={() => setStatusFilter("OUT_FOR_DELIVERY")}
                >
                  🛵 Out For Delivery (
                  {
                    orders.filter((o) =>
                      ["OUT_FOR_DELIVERY", "OUT FOR DELIVERY"].includes(
                        (o.orderStatus || "").toUpperCase()
                      )
                    ).length
                  }
                  )
                </button>
                <button
                  className={`filter-tab-btn ${statusFilter === "DELIVERED" ? "active" : ""}`}
                  onClick={() => setStatusFilter("DELIVERED")}
                >
                  ✅ Completed (
                  {
                    orders.filter(
                      (o) => (o.orderStatus || "").toUpperCase() === "DELIVERED"
                    ).length
                  }
                  )
                </button>
              </div>
            </div>

            {/* Orders Grid */}
            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Syncing live orders...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="no-orders-box">
                <div className="no-orders-icon">📦</div>
                <h3>No orders match your filter</h3>
                <p>
                  {searchQuery
                    ? `No orders matching "${searchQuery}". Try clearing search.`
                    : "Whenever a customer orders online, it will appear here automatically with sound alert."}
                </p>
                <button className="primary-btn" onClick={handleSimulateNewOrder}>
                  Simulate Test Online Order ⚡
                </button>
              </div>
            ) : (
              <div className="orders-grid">
                {filteredOrders.map((order) => {
                  const items = order.orderItems || [];
                  const status = (order.orderStatus || "CONFIRMED").toUpperCase();
                  const orderReview = getReviewForOrder(order);

                  return (
                    <div key={order.id} className="order-manage-card">
                      {/* Card Header */}
                      <div className="order-card-top">
                        <div className="order-card-id-block">
                          <div className="order-id-row">
                            <span className="order-number-tag">#ORD-{order.id}</span>
                            <span className="order-channel-tag">🌐 Web Direct</span>
                          </div>
                          <div className="order-time-row">
                            <span className="order-date-text">
                              {order.createdAt
                                ? new Date(order.createdAt).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "Just now"}
                            </span>
                            <span className="order-elapsed-pill">
                              ⏱️ {formatElapsedTime(order.createdAt)}
                            </span>
                          </div>
                        </div>

                        <div className="order-badges-wrap">
                          <span
                            className={`payment-chip ${
                              order.paymentMethod === "COD" ? "cod" : "online"
                            }`}
                          >
                            {order.paymentMethod === "COD"
                              ? "💵 Cash to Collect"
                              : "💳 UPI / Paid"}
                          </span>
                          <span className={`status-badge ${getStatusBadgeClass(status)}`}>
                            {status === "PREPARING"
                              ? "🍳 KITCHEN PREPARING"
                              : status === "OUT_FOR_DELIVERY" || status === "OUT FOR DELIVERY"
                              ? "🛵 OUT FOR DELIVERY"
                              : status === "DELIVERED"
                              ? "✅ DELIVERED"
                              : "🔔 ORDER CONFIRMED"}
                          </span>
                        </div>
                      </div>

                      {/* Customer Details */}
                      <div className="order-customer-box">
                        <div className="cust-row">
                          <div className="cust-avatar-circle">
                            {(order.customerName || "U").charAt(0).toUpperCase()}
                          </div>
                          <div className="cust-meta">
                            <strong>{order.customerName}</strong>
                            <a
                              href={`tel:${order.customerPhone}`}
                              className="cust-phone-link"
                              title="Click to call customer"
                            >
                              📞 {order.customerPhone}
                            </a>
                          </div>
                        </div>
                        <div className="cust-address">
                          <span className="cust-icon">📍</span>
                          <span>{order.deliveryAddress}</span>
                        </div>
                      </div>

                      {/* Items List (Kitchen Order Ticket Style) */}
                      <div className="order-items-summary">
                        <div className="items-list-header">
                          <span>Items Ordered ({items.length})</span>
                          <span>Subtotal</span>
                        </div>
                        <div className="items-scroll">
                          {items.map((item, idx) => (
                            <div key={idx} className="order-item-line">
                              <span className="item-name-qty">
                                <span className="kot-qty-tag">{item.quantity}x</span>
                                <span className="kot-item-name">{item.foodName}</span>
                              </span>
                              <span className="item-price">
                                ₹{(item.foodPrice * item.quantity).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Customer Feedback & Rating (Shows when reviewed!) */}
                      {orderReview ? (
                        <div className="order-customer-review-card">
                          <div className="review-card-head">
                            <span className="review-stars-pill">
                              {"★".repeat(Number(orderReview.rating) || 5)}
                              <span className="review-rating-digit">
                                ({orderReview.rating || 5}.0)
                              </span>
                            </span>
                            <span className="review-verified-label">✓ Customer Review</span>
                          </div>
                          <p className="order-review-quote">"{orderReview.comment}"</p>
                          <span className="review-author-date">
                            — {orderReview.customerName || order.customerName} • {formatElapsedTime(orderReview.createdAt)}
                          </span>
                        </div>
                      ) : (
                        <div className="order-review-pending-tag">
                          <span>⭐ Rating requested upon delivery</span>
                        </div>
                      )}

                      {/* Amount Total */}
                      <div className="order-total-bar">
                        <span>Total Payable:</span>
                        <strong className="order-grand-price">₹{order.totalAmount}</strong>
                      </div>

                      {/* Status Progress Stepper & Actions */}
                      <div className="order-card-actions">
                        <div className="status-button-group">
                          {status !== "PREPARING" &&
                            status !== "OUT_FOR_DELIVERY" &&
                            status !== "DELIVERED" && (
                              <button
                                className="status-next-btn prep"
                                disabled={isUpdating === order.id}
                                onClick={() => handleStatusChange(order.id, "PREPARING")}
                              >
                                👨‍🍳 Accept & Start Cooking
                              </button>
                            )}

                          {status === "PREPARING" && (
                            <button
                              className="status-next-btn out"
                              disabled={isUpdating === order.id}
                              onClick={() => handleStatusChange(order.id, "OUT_FOR_DELIVERY")}
                            >
                              🛵 Dispatch With Rider
                            </button>
                          )}

                          {status === "OUT_FOR_DELIVERY" && (
                            <button
                              className="status-next-btn deliver"
                              disabled={isUpdating === order.id}
                              onClick={() => handleStatusChange(order.id, "DELIVERED")}
                            >
                              ✅ Mark Order Delivered
                            </button>
                          )}

                          {status === "DELIVERED" && (
                            <span className="completed-label">✨ Order Completed & Delivered</span>
                          )}
                        </div>

                        <button
                          className="view-receipt-action-btn"
                          onClick={() => setSelectedReceiptOrder(order)}
                        >
                          🧾 View & Print Receipt
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ================= TAB 2: CUSTOMER REVIEWS ================= */}
        {activeMainTab === "REVIEWS" && (
          <div className="reviews-dashboard-section">
            <div className="reviews-summary-banner">
              <div className="rating-big-score">
                <span className="score-num">{avgRating}</span>
                <div className="score-stars">
                  {"★".repeat(Math.round(Number(avgRating)))}
                  {"☆".repeat(5 - Math.round(Number(avgRating)))}
                </div>
                <span className="total-reviews-count">{reviews.length} verified diner reviews</span>
              </div>
              <div className="rating-desc-text">
                <h3>Customer Satisfaction & Real Feedback</h3>
                <p>
                  Live customer experiences, taste quality, packaging hygiene, and delivery ratings from verified orders.
                </p>
              </div>
              <div className="reviews-banner-action">
                <button
                  className="write-review-hero-btn"
                  onClick={() => setShowTestReviewModal(true)}
                >
                  ✍️ Add Diner Review
                </button>
              </div>
            </div>

            {reviewsLoading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading customer reviews...</p>
              </div>
            ) : reviews.length === 0 ? (
              <div className="no-orders-box">
                <div className="no-orders-icon">⭐</div>
                <h3>No reviews submitted yet</h3>
                <p>When customers leave a rating and feedback after ordering, it will appear here.</p>
                <button className="primary-btn" onClick={() => setShowTestReviewModal(true)}>
                  Submit Test Customer Review ✍️
                </button>
              </div>
            ) : (
              <div className="reviews-grid">
                {reviews.map((rev) => (
                  <div key={rev.id} className="review-admin-card">
                    <div className="review-card-top">
                      <div className="reviewer-info">
                        <div className="reviewer-avatar">
                          {rev.customerName ? rev.customerName.charAt(0).toUpperCase() : "👤"}
                        </div>
                        <div>
                          <strong>{rev.customerName || "Anonymous Customer"}</strong>
                          <span className="review-date">
                            {formatElapsedTime(rev.createdAt)}
                          </span>
                        </div>
                      </div>

                      <div className="review-stars-badge">
                        {"★".repeat(Number(rev.rating) || 5)}
                        <span className="rating-digit">({rev.rating || 5}/5)</span>
                      </div>
                    </div>

                    <p className="review-comment-text">"{rev.comment}"</p>

                    <div className="review-card-bottom-row">
                      {rev.orderId && (
                        <div className="review-order-tag">
                          <span>📦 Order #ORD-{rev.orderId}</span>
                        </div>
                      )}

                      {kitchenReplies[rev.id] ? (
                        <div className="kitchen-replied-badge">
                          <span>💬 Kitchen Replied: {kitchenReplies[rev.id]}</span>
                        </div>
                      ) : (
                        <button
                          className="kitchen-reply-btn"
                          onClick={() => handleKitchenReply(rev.id)}
                        >
                          💬 Send Kitchen Thank You
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Itemized Printable Receipt Modal */}
      {selectedReceiptOrder && (
        <ReceiptModal
          order={selectedReceiptOrder}
          onClose={() => setSelectedReceiptOrder(null)}
        />
      )}

      {/* Review Modal for Admin to Test Customer Reviews */}
      {showTestReviewModal && (
        <ReviewModal
          isOpen={showTestReviewModal}
          onClose={() => setShowTestReviewModal(false)}
          defaultCustomerName="Vikram Malhotra"
          orderId="101"
          onReviewSubmitted={() => {
            loadReviews();
            fetchOrders(false);
          }}
        />
      )}
    </div>
  );
}
