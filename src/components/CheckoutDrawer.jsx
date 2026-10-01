import React, { useState } from "react";
import { useCart } from "../context/CartContext";
import { placeOrder } from "../services/api";

const PROMO_COUPONS = {
  WELCOME50: { code: "WELCOME50", discount: 50, minOrder: 150, type: "flat", desc: "₹50 FLAT OFF" },
  TASTY100: { code: "TASTY100", discount: 100, minOrder: 399, type: "flat", desc: "₹100 OFF on orders > ₹399" },
  FEAST20: { code: "FEAST20", discount: 0.2, minOrder: 299, type: "percent", maxDiscount: 150, desc: "20% OFF (Up to ₹150)" },
};

export default function CheckoutDrawer({
  isOpen = false,
  onClose,
  orderMode = "DELIVERY",
  deliveryAddress = "",
  onOrderSuccess,
}) {
  const { cart, totalAmount, clearCart } = useCart();

  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    deliveryAddress: deliveryAddress || "Flat 402, Sunshine Heights, Sector 18, Noida",
    addressType: "Home",
    landmark: "",
    paymentMethod: "UPI", // "UPI" | "COD" | "CARD"
    upiApp: "GPay", // GPay, PhonePe, Paytm
  });

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  // Base calculations
  const baseDeliveryFee = totalAmount > 499 || totalAmount === 0 || orderMode === "DINEIN" ? 0 : 40;

  // Discount
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
  const taxes = Math.round(taxableAmount * 0.05);
  const grandTotal = Math.max(0, taxableAmount + baseDeliveryFee + taxes);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    setCouponError("");
    const cleanCode = couponCode.trim().toUpperCase();
    if (!cleanCode) return;

    const promo = PROMO_COUPONS[cleanCode];
    if (!promo) {
      setCouponError("Invalid coupon code. Try WELCOME50 or TASTY100");
      return;
    }

    if (totalAmount < promo.minOrder) {
      setCouponError(`Min order of ₹${promo.minOrder} required for ${promo.code}`);
      return;
    }

    setAppliedCoupon(promo);
    setCouponCode("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.customerName.trim() || !formData.customerPhone.trim() || !formData.deliveryAddress.trim()) {
      setErrorMsg("Please fill in your Name, Phone Number, and Delivery Address.");
      return;
    }

    if (cart.length === 0) {
      setErrorMsg("Your cart is empty! Please add food items before ordering.");
      return;
    }

    setErrorMsg("");
    setSubmitting(true);

    try {
      const orderPayload = {
        customerName: formData.customerName.trim(),
        customerPhone: formData.customerPhone.trim(),
        customerEmail: formData.customerEmail.trim(),
        deliveryAddress: `${formData.deliveryAddress.trim()}${formData.landmark ? `, Landmark: ${formData.landmark.trim()}` : ""}`,
        addressType: formData.addressType,
        paymentMethod: formData.paymentMethod,
        orderMode: orderMode,
        totalAmount: grandTotal,
        orderItems: cart.map((item) => ({
          foodId: item.id,
          foodName: item.name,
          foodPrice: Number(item.price),
          quantity: Number(item.quantity),
          subtotal: Number(item.price * item.quantity),
        })),
        createdAt: new Date().toISOString(),
      };

      const result = await placeOrder(orderPayload);
      localStorage.setItem("food_customer_phone", formData.customerPhone.trim());
      localStorage.setItem("food_last_placed_order", JSON.stringify(result));
      clearCart();
      if (onOrderSuccess) {
        onOrderSuccess(result);
      }
    } catch (err) {
      setErrorMsg(err.message || "Failed to place order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="checkout-drawer-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="checkout-drawer-container" onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className="checkout-drawer-header">
          <div className="drawer-title-box">
            <span className="drawer-icon">🛍️</span>
            <div>
              <h2>Instant Checkout</h2>
              <p>Complete your delivery details & payment</p>
            </div>
          </div>
          <button className="drawer-close-btn" onClick={onClose} aria-label="Close checkout">
            ✕
          </button>
        </div>

        {/* Drawer Body */}
        <form onSubmit={handleSubmit} className="checkout-drawer-body">
          {errorMsg && (
            <div className="checkout-error-banner">
              <span>⚠️</span> {errorMsg}
            </div>
          )}

          {/* Customer Details */}
          <div className="checkout-form-section">
            <h3 className="section-title">
              <span>1</span> Customer Contact
            </h3>
            <div className="form-grid-2">
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  name="customerName"
                  placeholder="e.g. Rahul Sharma"
                  value={formData.customerName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Mobile Number *</label>
                <input
                  type="tel"
                  name="customerPhone"
                  placeholder="10-digit phone (e.g. 9876543210)"
                  value={formData.customerPhone}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          {/* Delivery Details */}
          <div className="checkout-form-section">
            <h3 className="section-title">
              <span>2</span> Delivery Location
            </h3>

            <div className="address-type-selector">
              {["Home", "Work", "Other"].map((type) => (
                <button
                  type="button"
                  key={type}
                  className={`addr-type-chip ${formData.addressType === type ? "active" : ""}`}
                  onClick={() => setFormData({ ...formData, addressType: type })}
                >
                  {type === "Home" ? "🏠 Home" : type === "Work" ? "🏢 Work" : "📍 Other"}
                </button>
              ))}
            </div>

            <div className="form-group">
              <label>Complete Address *</label>
              <textarea
                name="deliveryAddress"
                rows="2"
                placeholder="House / Flat No., Building, Street, Area"
                value={formData.deliveryAddress}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Landmark (Optional)</label>
              <input
                type="text"
                name="landmark"
                placeholder="Nearby metro station, mall, or school"
                value={formData.landmark}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Payment Method */}
          <div className="checkout-form-section">
            <h3 className="section-title">
              <span>3</span> Payment Option
            </h3>

            <div className="payment-options-grid">
              <label className={`payment-card-option ${formData.paymentMethod === "UPI" ? "selected" : ""}`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="UPI"
                  checked={formData.paymentMethod === "UPI"}
                  onChange={handleChange}
                />
                <div className="pay-option-content">
                  <span className="pay-icon">📱</span>
                  <div>
                    <strong>Instant UPI</strong>
                    <span>GPay, PhonePe, Paytm</span>
                  </div>
                </div>
              </label>

              <label className={`payment-card-option ${formData.paymentMethod === "COD" ? "selected" : ""}`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="COD"
                  checked={formData.paymentMethod === "COD"}
                  onChange={handleChange}
                />
                <div className="pay-option-content">
                  <span className="pay-icon">💵</span>
                  <div>
                    <strong>Cash on Delivery</strong>
                    <span>Pay cash / UPI upon arrival</span>
                  </div>
                </div>
              </label>

              <label className={`payment-card-option ${formData.paymentMethod === "CARD" ? "selected" : ""}`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="CARD"
                  checked={formData.paymentMethod === "CARD"}
                  onChange={handleChange}
                />
                <div className="pay-option-content">
                  <span className="pay-icon">💳</span>
                  <div>
                    <strong>Credit / Debit Card</strong>
                    <span>Visa, Mastercard, RuPay</span>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Summary Accordion */}
          <div className="checkout-order-summary-box">
            <div className="summary-title-row">
              <strong>Order Summary ({cart.length} items)</strong>
              <span>Subtotal: ₹{totalAmount}</span>
            </div>

            <div className="checkout-items-preview">
              {cart.map((item) => (
                <div key={item.id} className="preview-row">
                  <span>
                    {item.quantity}x {item.name}
                  </span>
                  <span>₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>

            <div className="checkout-bill-preview">
              <div className="calc-row">
                <span>Delivery Charge</span>
                <span>{baseDeliveryFee === 0 ? "FREE" : `₹${baseDeliveryFee}`}</span>
              </div>
              <div className="calc-row">
                <span>GST (5%)</span>
                <span>₹{taxes}</span>
              </div>
              {appliedCoupon && (
                <div className="calc-row discount">
                  <span>Coupon ({appliedCoupon.code})</span>
                  <span>-₹{discountAmount}</span>
                </div>
              )}
              <div className="calc-row total">
                <strong>GRAND TOTAL:</strong>
                <strong className="grand-total-highlight">₹{grandTotal}</strong>
              </div>
            </div>
          </div>

          {/* Drawer Actions */}
          <div className="checkout-drawer-footer">
            <button
              type="submit"
              className="confirm-order-submit-btn"
              disabled={submitting}
            >
              {submitting ? (
                <span>Placing Your Order... ⏳</span>
              ) : (
                <span>
                  CONFIRM & PLACE ORDER • ₹{grandTotal} 🚀
                </span>
              )}
            </button>
            <span className="secure-badge">🔒 256-Bit SSL Encrypted & 100% Safe</span>
          </div>
        </form>
      </div>
    </div>
  );
}
