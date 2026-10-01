import React, { useState, useEffect } from "react";
import { getOrdersByPhone, getOrderById, getReviews } from "../services/api";
import ReviewModal from "../components/ReviewModal";

export default function TrackOrder({ latestOrder, onNavigate }) {
  const [phoneNumber, setPhoneNumber] = useState(() => {
    return latestOrder?.customerPhone || localStorage.getItem("food_customer_phone") || "";
  });
  const [searchedOrders, setSearchedOrders] = useState(() => {
    if (latestOrder) return [latestOrder];
    try {
      const saved = localStorage.getItem("food_last_placed_order");
      if (saved) return [JSON.parse(saved)];
    } catch {
      // ignore
    }
    return [];
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [orderReviews, setOrderReviews] = useState({});
  const [activeTrackingId, setActiveTrackingId] = useState(() => {
    if (latestOrder?.id) return latestOrder.id;
    try {
      const saved = localStorage.getItem("food_last_placed_order");
      if (saved) return JSON.parse(saved).id;
    } catch {
      // ignore
    }
    return null;
  });
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Load reviews on mount
  useEffect(() => {
    getReviews().then((revs) => {
      if (Array.isArray(revs)) {
        const map = {};
        revs.forEach((r) => {
          if (r.orderId) map[r.orderId] = r;
        });
        setOrderReviews(map);
      }
    });
  }, []);

  // Sync latestOrder if passed dynamically
  useEffect(() => {
    if (latestOrder && latestOrder.id) {
      setSearchedOrders((prev) => {
        const filtered = prev.filter((o) => o.id !== latestOrder.id);
        return [latestOrder, ...filtered];
      });
      setActiveTrackingId(latestOrder.id);
      if (latestOrder.customerPhone) {
        setPhoneNumber(latestOrder.customerPhone);
      }
    }
  }, [latestOrder]);

  // If no order yet, auto-search by saved phone number
  useEffect(() => {
    const savedPhone = localStorage.getItem("food_customer_phone");
    if (savedPhone && searchedOrders.length === 0) {
      handleSearch(null, savedPhone);
    }
  }, []);

  const handleSearch = async (e, phoneOverride) => {
    if (e) e.preventDefault();
    const cleanPhone = (phoneOverride || phoneNumber).trim();
    if (!cleanPhone) {
      setError("Please enter your registered 10-digit mobile number.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const orders = await getOrdersByPhone(cleanPhone);
      if (Array.isArray(orders) && orders.length > 0) {
        setSearchedOrders(orders);
        setActiveTrackingId(orders[0].id);
        localStorage.setItem("food_customer_phone", cleanPhone);
      } else {
        setSearchedOrders([]);
        setError("No orders found for this phone number. Please check the number or place a new order.");
      }
    } catch (err) {
      setError("No orders found for " + cleanPhone + ". Please check the mobile number.");
    } finally {
      setLoading(false);
    }
  };

  // Poll active order status every 3.5 seconds for live status changes
  useEffect(() => {
    if (!activeTrackingId) return;

    const interval = setInterval(async () => {
      try {
        const updated = await getOrderById(activeTrackingId);
        if (updated) {
          setSearchedOrders((prev) =>
            prev.map((o) => (o.id === activeTrackingId ? updated : o))
          );
        }
      } catch {
        // ignore background polling errors
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [activeTrackingId]);

  const activeOrder = searchedOrders.find((o) => o.id === activeTrackingId) || searchedOrders[0];

  const getStepStatus = (orderStatus, stepName) => {
    const s = (orderStatus || "CONFIRMED").toUpperCase();
    const sequence = ["CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED"];

    let normalized = s;
    if (s === "PENDING") normalized = "CONFIRMED";
    if (s === "OUT FOR DELIVERY") normalized = "OUT_FOR_DELIVERY";

    const currentIndex = sequence.indexOf(normalized);
    const stepIndex = sequence.indexOf(stepName);

    if (currentIndex > stepIndex) return "completed";
    if (currentIndex === stepIndex) return "active";
    return "pending";
  };

  return (
    <div className="track-order-page">
      <div className="track-order-container">
        <div className="track-header">
          <span className="track-badge">LIVE TRACKING 🛵</span>
          <h1 className="track-title">Track Your Food Order</h1>
          <p className="track-subtitle">
            Live updates on your food preparation, packing, and doorstep delivery.
          </p>
        </div>

        {/* Search Phone Bar */}
        <form onSubmit={handleSearch} className="track-search-bar">
          <input
            type="tel"
            placeholder="Enter your 10-digit mobile number (e.g. 9876543210)"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />
          <button type="submit" className="primary-btn" disabled={loading}>
            {loading ? "Searching..." : "Track Status 🔍"}
          </button>
        </form>

        {error && <div className="track-error-box">{error}</div>}

        {/* Active Order Details */}
        {activeOrder ? (
          <div className="track-card">
            <div className="track-card-header">
              <div>
                <span className="track-order-num">#ORD-{activeOrder.id}</span>
                <span className="track-order-time">
                  Placed on {new Date(activeOrder.createdAt || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <div className="track-live-pulse-badge">
                <span className="pulse-circle"></span> Live Updates Active
              </div>
            </div>

            {/* Status Highlight Banner */}
            <div className="track-status-highlight">
              <span className="status-highlight-icon">
                {activeOrder.orderStatus === "DELIVERED"
                  ? "🏡"
                  : activeOrder.orderStatus === "OUT_FOR_DELIVERY"
                  ? "🛵"
                  : activeOrder.orderStatus === "PREPARING"
                  ? "🍳"
                  : "✓"}
              </span>
              <div>
                <h3 className="status-highlight-title">
                  {activeOrder.orderStatus === "DELIVERED"
                    ? "Order Delivered Successfully!"
                    : activeOrder.orderStatus === "OUT_FOR_DELIVERY"
                    ? "Out for Delivery — Rider On the Way"
                    : activeOrder.orderStatus === "PREPARING"
                    ? "Kitchen is Cooking & Packing Your Food"
                    : "Order Confirmed & Sent to Restaurant"}
                </h3>
                <p className="status-highlight-sub">
                  {activeOrder.orderStatus === "DELIVERED"
                    ? "Delivered to your address. Hope you enjoyed the meal!"
                    : "Estimated Delivery Time: 20-25 Mins"}
                </p>
              </div>
            </div>

            {/* Stepper */}
            <div className="track-stepper-box">
              <div className={`stepper-node ${getStepStatus(activeOrder.orderStatus, "CONFIRMED")}`}>
                <div className="stepper-circle">✓</div>
                <div className="stepper-label">
                  <strong>Order Received</strong>
                  <span>Confirmed & Sent to Kitchen</span>
                </div>
              </div>

              <div className={`stepper-connector ${getStepStatus(activeOrder.orderStatus, "PREPARING") !== "pending" ? "filled" : ""}`}></div>

              <div className={`stepper-node ${getStepStatus(activeOrder.orderStatus, "PREPARING")}`}>
                <div className="stepper-circle">🍳</div>
                <div className="stepper-label">
                  <strong>Cooking & Packing</strong>
                  <span>Chefs are preparing your meal</span>
                </div>
              </div>

              <div className={`stepper-connector ${getStepStatus(activeOrder.orderStatus, "OUT_FOR_DELIVERY") !== "pending" ? "filled" : ""}`}></div>

              <div className={`stepper-node ${getStepStatus(activeOrder.orderStatus, "OUT_FOR_DELIVERY")}`}>
                <div className="stepper-circle">🛵</div>
                <div className="stepper-label">
                  <strong>Out For Delivery</strong>
                  <span>Rider is on the way to you</span>
                </div>
              </div>

              <div className={`stepper-connector ${getStepStatus(activeOrder.orderStatus, "DELIVERED") === "active" || getStepStatus(activeOrder.orderStatus, "DELIVERED") === "completed" ? "filled" : ""}`}></div>

              <div className={`stepper-node ${getStepStatus(activeOrder.orderStatus, "DELIVERED")}`}>
                <div className="stepper-circle">🏡</div>
                <div className="stepper-label">
                  <strong>Delivered</strong>
                  <span>Enjoy your delicious food!</span>
                </div>
              </div>
            </div>

            {/* Driver & Details Grid */}
            <div className="track-details-grid">
              <div className="track-detail-col">
                <span className="col-label">Delivery Destination</span>
                <p className="col-val">📍 {activeOrder.deliveryAddress}</p>
                
                <span className="col-label" style={{ marginTop: "0.8rem" }}>Customer Contact</span>
                <p className="col-val">👤 {activeOrder.customerName} (📞 +91 {activeOrder.customerPhone})</p>

                <div className="track-driver-box">
                  <span className="driver-avatar">🛵</span>
                  <div className="driver-info">
                    <strong>Delivery Partner: Vikram Singh</strong>
                    <span>Contact: +91 98765 43210 • Thermal Insulated Bag</span>
                  </div>
                </div>
              </div>

              <div className="track-detail-col">
                <span className="col-label">Items Ordered ({(activeOrder.orderItems || []).length})</span>
                <div className="track-items-list">
                  {(activeOrder.orderItems || []).map((item, i) => (
                    <div key={i} className="track-item-line">
                      <span>{item.quantity}x {item.foodName || item.name}</span>
                      <strong>₹{Number((item.foodPrice || item.price || 0) * (item.quantity || 1)).toFixed(2)}</strong>
                    </div>
                  ))}
                </div>
                
                <div className="track-total-row">
                  <span>Grand Total:</span>
                  <span className="track-total-amt">₹{activeOrder.totalAmount}</span>
                </div>

                {(() => {
                  const existingReview = activeOrder.review || orderReviews[String(activeOrder.id)];
                  if (existingReview) {
                    return (
                      <div className="track-reviewed-box">
                        <div className="track-reviewed-head">
                          <span className="track-reviewed-stars">
                            {"★".repeat(Number(existingReview.rating) || 5)}
                          </span>
                          <span className="track-reviewed-badge">✓ Your Feedback Recorded</span>
                        </div>
                        <p className="track-reviewed-comment">"{existingReview.comment}"</p>
                        <button
                          type="button"
                          className="track-edit-review-btn"
                          onClick={() => setShowReviewModal(true)}
                        >
                          ✏️ Edit Your Review
                        </button>
                      </div>
                    );
                  }
                  return (
                    <button
                      type="button"
                      className="track-review-btn"
                      onClick={() => setShowReviewModal(true)}
                    >
                      ⭐ Rate & Review This Food
                    </button>
                  );
                })()}
              </div>
            </div>

            {/* If user has multiple past orders */}
            {searchedOrders.length > 1 && (
              <div className="past-orders-section">
                <h4>Other orders found for this phone:</h4>
                <div className="past-orders-chips">
                  {searchedOrders.map((ord) => (
                    <button
                      key={ord.id}
                      className={`past-order-chip ${ord.id === activeOrder.id ? "active" : ""}`}
                      onClick={() => setActiveTrackingId(ord.id)}
                    >
                      #ORD-{ord.id} (₹{ord.totalAmount} - {ord.orderStatus})
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="track-empty-box">
            <div className="empty-icon">📦</div>
            <h3>No active orders to track</h3>
            <p>Enter your 10-digit mobile number above or order delicious meals from our menu.</p>
            <button className="primary-btn" onClick={() => onNavigate("menu")}>
              Browse Food Menu 📜
            </button>
          </div>
        )}
      </div>

      {activeOrder && (
        <ReviewModal
          isOpen={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          defaultCustomerName={activeOrder.customerName}
          orderId={activeOrder.id}
          onReviewSubmitted={(newRev) => {
            setOrderReviews((prev) => ({ ...prev, [String(activeOrder.id)]: newRev }));
            setSearchedOrders((prev) =>
              prev.map((o) => (o.id === activeOrder.id ? { ...o, review: newRev } : o))
            );
          }}
        />
      )}
    </div>
  );
}
