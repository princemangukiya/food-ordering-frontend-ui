import React, { useState } from "react";
import { useCart } from "../context/CartContext";

const AVAILABLE_COUPONS = {
  WELCOME50: { code: "WELCOME50", discount: 50, minOrder: 150, type: "flat", desc: "₹50 FLAT OFF" },
  TASTY100: { code: "TASTY100", discount: 100, minOrder: 399, type: "flat", desc: "₹100 OFF on orders > ₹399" },
  FEAST20: { code: "FEAST20", discount: 0.2, minOrder: 299, type: "percent", maxDiscount: 150, desc: "20% OFF (Up to ₹150)" },
};

export default function OrderSidebar({
  isOpen = true,
  onClose,
  orderMode = "DELIVERY",
  onOpenCheckout,
  deliveryAddress = "Sector 18, Noida",
}) {
  const { cart, totalAmount, totalCount, updateQuantity, removeFromCart, clearCart } = useCart();
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponMsg, setCouponMsg] = useState({ text: "", type: "" });
  const [orderNotes, setOrderNotes] = useState("");

  // Base calculations
  const deliveryThreshold = 499;
  const isFreeDelivery = totalAmount >= deliveryThreshold || totalAmount === 0 || orderMode === "DINEIN";
  const deliveryFee = isFreeDelivery ? 0 : 40;
  const amountNeededForFree = Math.max(0, deliveryThreshold - totalAmount);
  const freeDeliveryProgress = Math.min(100, Math.round((totalAmount / deliveryThreshold) * 100));

  // Coupon discount calculation
  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === "flat") {
      discountAmount = appliedCoupon.discount;
    } else if (appliedCoupon.type === "percent") {
      discountAmount = Math.min(
        Math.round(totalAmount * appliedCoupon.discount),
        appliedCoupon.maxDiscount || 150
      );
    }
  }

  const taxableAmount = Math.max(0, totalAmount - discountAmount);
  const taxes = Math.round(taxableAmount * 0.05); // 5% GST
  const grandTotal = Math.max(0, taxableAmount + deliveryFee + taxes);

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    const clean = couponCode.trim().toUpperCase();
    if (!clean) return;

    const promo = AVAILABLE_COUPONS[clean];
    if (!promo) {
      setCouponMsg({ text: "Invalid coupon. Try WELCOME50 or TASTY100", type: "error" });
      return;
    }

    if (totalAmount < promo.minOrder) {
      setCouponMsg({
        text: `Min order ₹${promo.minOrder} required for ${promo.code}`,
        type: "error",
      });
      return;
    }

    setAppliedCoupon(promo);
    setCouponMsg({ text: `Coupon ${promo.code} applied successfully!`, type: "success" });
    setCouponCode("");
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponMsg({ text: "", type: "" });
  };

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        className={`order-sidebar-backdrop ${isOpen ? "open" : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className={`order-summary-sidebar ${isOpen ? "open" : "collapsed"}`}>
        {/* Ticket Header */}
        <div className="order-sidebar-header">
          <div className="order-header-left">
            <span className="order-header-icon">📋</span>
            <div>
              <h3 className="order-header-title">CURRENT ORDER</h3>
              <span className="order-header-mode">
                {orderMode === "DELIVERY"
                  ? "🛵 Home Delivery (25m)"
                  : orderMode === "TAKEAWAY"
                  ? "🥡 Self Takeaway (15m)"
                  : "🍽️ Table Dine-In"}
              </span>
            </div>
          </div>

          <div className="order-header-actions">
            {totalCount > 0 && (
              <button className="order-clear-btn" onClick={clearCart} title="Clear all items">
                Clear
              </button>
            )}
            {onClose && (
              <button className="order-mobile-close-btn" onClick={onClose} title="Close order panel">
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Empty State */}
        {cart.length === 0 ? (
          <div className="order-empty-state">
            <div className="order-empty-icon-wrap">
              <span className="order-empty-icon">🛍️</span>
            </div>
            <h4>Your Cart Is Empty</h4>
            <p>Pick tasty items from the menu categories on the left to start your order!</p>
            <div className="order-empty-suggestions">
              <span className="suggestion-label">Popular now:</span>
              <span className="suggestion-chip">Super Saver Combos 🔥</span>
              <span className="suggestion-chip">Dum Biryani 🍛</span>
              <span className="suggestion-chip">Farmhouse Pizza 🍕</span>
            </div>
          </div>
        ) : (
          <div className="order-content-scroll">
            {/* Free Delivery Meter */}
            {orderMode === "DELIVERY" && (
              <div className="free-delivery-tracker">
                <div className="tracker-text-row">
                  {isFreeDelivery ? (
                    <span className="free-success-msg">
                      🎉 <strong>You unlocked FREE Delivery!</strong>
                    </span>
                  ) : (
                    <span>
                      Add <strong>₹{amountNeededForFree}</strong> more for <strong>FREE Delivery</strong>
                    </span>
                  )}
                  <span className="tracker-val">{freeDeliveryProgress}%</span>
                </div>
                <div className="tracker-progress-track">
                  <div
                    className={`tracker-progress-bar ${isFreeDelivery ? "complete" : ""}`}
                    style={{ width: `${freeDeliveryProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Items Table Header */}
            <div className="order-items-table-header">
              <span>ITEM ({totalCount})</span>
              <span>QTY</span>
              <span>PRICE</span>
            </div>

            {/* Items List */}
            <div className="order-items-list">
              {cart.map((item) => {
                const isNonVeg =
                  item.isVeg === false ||
                  (item.name && (
                    item.name.toLowerCase().includes("chicken") ||
                    item.name.toLowerCase().includes("murgh") ||
                    item.name.toLowerCase().includes("pepperoni")
                  ));
                const isVeg = !isNonVeg;

                return (
                  <div key={item.id} className="order-item-card">
                    <div className="order-item-left">
                      <span className={`diet-box mini ${isVeg ? "veg" : "non-veg"}`}>
                        <span className="diet-circle"></span>
                      </span>
                      <div className="order-item-details">
                        <span className="order-item-name">{item.name}</span>
                        <span className="order-item-unit-price">₹{item.price} each</span>
                      </div>
                    </div>

                    <div className="order-item-qty-controls">
                      <button
                        className="qty-btn-mini minus"
                        onClick={() => updateQuantity(item.id, -1)}
                        title="Reduce quantity"
                      >
                        -
                      </button>
                      <span className="qty-val-mini">{item.quantity}</span>
                      <button
                        className="qty-btn-mini plus"
                        onClick={() => updateQuantity(item.id, 1)}
                        title="Increase quantity"
                      >
                        +
                      </button>
                    </div>

                    <div className="order-item-price-col">
                      <span className="order-item-subtotal">₹{item.price * item.quantity}</span>
                      <button
                        className="order-item-del-btn"
                        onClick={() => removeFromCart(item.id)}
                        title="Remove from cart"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Special Instructions Note */}
            <div className="order-special-notes-box">
              <span className="notes-icon">📝</span>
              <input
                type="text"
                placeholder="Cooking instructions (e.g. Less spicy, extra tissues)..."
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
              />
            </div>

            {/* Promo Code Box */}
            <div className="order-coupon-container">
              {appliedCoupon ? (
                <div className="applied-coupon-pill">
                  <div className="coupon-pill-left">
                    <span className="coupon-tag-icon">🏷️</span>
                    <div>
                      <strong>{appliedCoupon.code}</strong> Applied
                      <span className="coupon-saving-text"> (Save ₹{discountAmount})</span>
                    </div>
                  </div>
                  <button className="remove-coupon-btn" onClick={handleRemoveCoupon}>
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="coupon-input-form">
                  <input
                    type="text"
                    placeholder="Enter Coupon (e.g. WELCOME50)"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  />
                  <button type="submit" className="apply-coupon-btn">
                    APPLY
                  </button>
                </form>
              )}
              {couponMsg.text && (
                <span className={`coupon-feedback-msg ${couponMsg.type}`}>{couponMsg.text}</span>
              )}
            </div>

            {/* Bill Breakdown */}
            <div className="order-bill-card">
              <div className="bill-row">
                <span>Item Subtotal</span>
                <span>₹{totalAmount}</span>
              </div>

              {appliedCoupon && (
                <div className="bill-row discount-row">
                  <span>Coupon Discount ({appliedCoupon.code})</span>
                  <span className="discount-val">-₹{discountAmount}</span>
                </div>
              )}

              <div className="bill-row">
                <span>Delivery Fee</span>
                <span>
                  {deliveryFee === 0 ? (
                    <strong className="free-text">FREE</strong>
                  ) : (
                    `₹${deliveryFee}`
                  )}
                </span>
              </div>

              <div className="bill-row">
                <span>Taxes & GST (5%)</span>
                <span>₹{taxes}</span>
              </div>

              <div className="bill-total-row">
                <div className="total-label-box">
                  <span className="grand-total-label">TO PAY:</span>
                  <span className="total-items-sub">({totalCount} items included)</span>
                </div>
                <span className="grand-total-val">₹{grandTotal}</span>
              </div>
            </div>

            {/* Delivery address snippet */}
            <div className="order-delivery-location-chip">
              <span className="chip-icon">📍</span>
              <span className="chip-address">{deliveryAddress}</span>
            </div>

            {/* Submit / Proceed to Checkout */}
            <div className="order-sidebar-footer">
              <button
                className="order-proceed-btn"
                onClick={() => onOpenCheckout && onOpenCheckout()}
              >
                <span>PROCEED TO CHECKOUT</span>
                <span className="proceed-btn-arrow">→</span>
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
