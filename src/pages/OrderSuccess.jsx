import React, { useState } from "react";
import ReceiptModal from "../components/ReceiptModal";
import ReviewModal from "../components/ReviewModal";

export default function OrderSuccess({ order, onNavigate }) {
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [orderReview, setOrderReview] = useState(null);

  if (!order) {
    return (
      <div className="order-success-wrap">
        <div className="order-success-card">
          <h2>No recent order found</h2>
          <button className="primary-btn" onClick={() => onNavigate("menu")}>
            Go to Menu
          </button>
        </div>
      </div>
    );
  }

  const items = order.orderItems || [];

  return (
    <div className="order-success-wrap">
      <div className="order-success-card">
        {/* Animated Checkmark */}
        <div className="success-icon-wrap">
          <div className="success-circle">
            <svg
              width="44"
              height="44"
              fill="none"
              stroke="white"
              strokeWidth="3"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        <span className="success-tag">
          {order.paymentMethod === "COD" ? "Order Confirmed (Cash on Delivery)" : "Payment Confirmed & Verified"}
        </span>
        <h1 className="success-title">Order Placed Successfully!</h1>
        <p className="success-subtitle">
          Thank you, <strong>{order.customerName}</strong>! Your order is being prepared hot & fresh.
        </p>

        {/* Live Delivery Progress Tracker */}
        <div className="delivery-tracker">
          <div className="tracker-step completed">
            <div className="step-dot">✓</div>
            <span className="step-label">Order Received</span>
          </div>
          <div className="tracker-line active"></div>
          <div className="tracker-step active">
            <div className="step-dot">🍳</div>
            <span className="step-label">Kitchen Preparing</span>
          </div>
          <div className="tracker-line"></div>
          <div className="tracker-step">
            <div className="step-dot">🛵</div>
            <span className="step-label">Out For Delivery</span>
          </div>
          <div className="tracker-line"></div>
          <div className="tracker-step">
            <div className="step-dot">🏡</div>
            <span className="step-label">Delivered</span>
          </div>
        </div>

        {/* Receipt Quick Summary Card */}
        <div className="receipt-box">
          <div className="receipt-header">
            <div>
              <span className="receipt-label">Order Number</span>
              <h3 className="receipt-id">#ORD-{order.id}</h3>
            </div>
            <div className="receipt-time">
              <span className="receipt-label">Estimated Delivery</span>
              <h3 className="time-badge">30-35 Mins</h3>
            </div>
          </div>

          <div className="receipt-divider"></div>

          <div className="receipt-details">
            <div className="receipt-detail-item">
              <strong>Delivery To:</strong>
              <p>{order.deliveryAddress}</p>
            </div>
            <div className="receipt-detail-item">
              <strong>Contact Phone:</strong>
              <p>+91 {order.customerPhone}</p>
            </div>
            <div className="receipt-detail-item">
              <strong>Payment Method:</strong>
              <p>{order.paymentMethod === "COD" ? "Cash on Delivery" : "Online / UPI (Paid)"}</p>
            </div>
            <div className="receipt-detail-item">
              <strong>Date & Time:</strong>
              <p>{new Date(order.createdAt || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
            </div>
          </div>

          {items.length > 0 && (
            <>
              <div className="receipt-divider"></div>
              <div className="receipt-items">
                <strong>Items Ordered ({items.length}):</strong>
                {items.map((item, idx) => (
                  <div key={idx} className="receipt-item-row">
                    <span>
                      <span className="order-item-badge">{item.quantity}x</span> {item.foodName}
                    </span>
                    <span>₹{item.foodPrice * item.quantity}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="receipt-divider"></div>

          <div className="receipt-total-row">
            <span>Total Amount Paid / Payable</span>
            <span className="total-val">₹{order.totalAmount}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="success-actions-grid">
          <button
            className="print-receipt-btn"
            onClick={() => setShowReceiptModal(true)}
          >
            🧾 Print / Download Itemized Receipt
          </button>

          <button
            className="track-orders-btn"
            onClick={() => onNavigate("track")}
          >
            🛵 Track My Order Live
          </button>

          {orderReview ? (
            <div className="success-reviewed-pill">
              <span className="reviewed-stars">{"★".repeat(orderReview.rating || 5)}</span>
              <span>Feedback Recorded: "{orderReview.comment}"</span>
            </div>
          ) : (
            <button
              className="review-open-btn"
              onClick={() => setShowReviewModal(true)}
            >
              ⭐ Rate & Review Food
            </button>
          )}

          <button
            className="secondary-btn"
            onClick={() => onNavigate("menu")}
          >
            Explore More Food 🍔
          </button>
        </div>
      </div>

      {/* Printable Receipt Modal */}
      {showReceiptModal && (
        <ReceiptModal
          order={order}
          onClose={() => setShowReceiptModal(false)}
        />
      )}

      {/* Customer Review Modal */}
      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        defaultCustomerName={order.customerName}
        orderId={order.id}
        onReviewSubmitted={(newRev) => setOrderReview(newRev)}
      />
    </div>
  );
}
