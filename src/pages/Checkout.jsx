import React, { useState } from "react";
import { useCart } from "../context/CartContext";
import { placeOrder } from "../services/api";

const PROMO_COUPONS = {
  WELCOME50: { code: "WELCOME50", discount: 50, minOrder: 150, type: "flat", desc: "₹50 FLAT OFF on your order" },
  TASTY100: { code: "TASTY100", discount: 100, minOrder: 399, type: "flat", desc: "₹100 OFF on orders above ₹399" },
  FEAST20: { code: "FEAST20", discount: 0.20, minOrder: 299, type: "percent", maxDiscount: 150, desc: "20% OFF (Up to ₹150)" },
};

export default function Checkout({ onNavigate, onOrderSuccess }) {
  const { cart, totalAmount, clearCart } = useCart();

  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    deliveryAddress: "",
    addressType: "Home", // Home, Office, Other
    landmark: "",
    cookingNotes: "",
    paymentMethod: "UPI", // "UPI" | "CARD" | "NETBANKING" | "COD"
    upiApp: "GPay", // GPay, PhonePe, Paytm
    upiId: "",
    cardNumber: "",
    cardExpiry: "",
    cardCvv: "",
  });

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [deliveryTip, setDeliveryTip] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [processStepText, setProcessStepText] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Base calculations
  const baseDeliveryFee = totalAmount > 499 || totalAmount === 0 ? 0 : 40;
  
  // Calculate discount
  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === "flat") {
      discountAmount = appliedCoupon.discount;
    } else if (appliedCoupon.type === "percent") {
      discountAmount = Math.min(Math.round(totalAmount * appliedCoupon.discount), appliedCoupon.maxDiscount || 150);
    }
  }

  const taxableAmount = Math.max(0, totalAmount - discountAmount);
  const taxes = Math.round(taxableAmount * 0.05); // 5% GST
  const grandTotal = Math.max(0, taxableAmount + baseDeliveryFee + taxes + deliveryTip);

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

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.customerName.trim() || !formData.customerPhone.trim() || !formData.deliveryAddress.trim()) {
      setErrorMsg("Please fill in required fields: Full Name, Phone Number, and Delivery Address.");
      return;
    }

    if (cart.length === 0) {
      setErrorMsg("Your cart is empty! Please add delicious food items before checkout.");
      return;
    }

    setErrorMsg("");
    setSubmitting(true);
    setProcessingPayment(true);

    // Multi-step realistic payment simulation
    if (formData.paymentMethod !== "COD") {
      setProcessStepText("Connecting to Secure Payment Gateway...");
      await new Promise((r) => setTimeout(r, 600));
      setProcessStepText("Verifying Payment Credentials with Bank...");
      await new Promise((r) => setTimeout(r, 800));
      setProcessStepText("Payment Confirmed! Generating Official Receipt...");
      await new Promise((r) => setTimeout(r, 600));
    } else {
      setProcessStepText("Verifying Order & Delivery Slot...");
      await new Promise((r) => setTimeout(r, 700));
      setProcessStepText("Order Confirmed! Generating Cash Receipt...");
      await new Promise((r) => setTimeout(r, 500));
    }

    const fullAddress = `${formData.deliveryAddress}${
      formData.landmark ? `, Landmark: ${formData.landmark}` : ""
    } (${formData.addressType})`;

    const orderPayload = {
      customerName: formData.customerName.trim(),
      customerPhone: formData.customerPhone.trim(),
      customerEmail: formData.customerEmail.trim() || "customer@example.com",
      deliveryAddress: fullAddress,
      paymentMethod: formData.paymentMethod,
      totalAmount: grandTotal,
      cookingNotes: formData.cookingNotes || "",
      orderItems: cart.map((item) => ({
        foodId: item.id,
        foodName: item.name,
        foodPrice: item.price,
        quantity: item.quantity,
      })),
    };

    try {
      const savedOrder = await placeOrder(orderPayload);
      localStorage.setItem("food_customer_phone", formData.customerPhone.trim());
      localStorage.setItem("food_last_placed_order", JSON.stringify(savedOrder));
      clearCart();
      setProcessingPayment(false);
      onOrderSuccess(savedOrder);
    } catch (err) {
      console.error("placeOrder failed:", err);
      setProcessingPayment(false);
      setSubmitting(false);
      setErrorMsg(
        "Failed to place order: " + (err.message || "Please try again.")
      );
      return;
    } finally {
      setSubmitting(false);
    }
  };


  if (cart.length === 0) {
    return (
      <div className="checkout-empty-container">
        <div className="empty-cart-card">
          <span className="empty-icon">🍽️</span>
          <h2>Your Food Basket is Empty</h2>
          <p>Add some delicious dishes from our menu to proceed with checkout.</p>
          <button className="primary-btn" onClick={() => onNavigate("menu")}>
            Browse Menu 📜
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      {/* Interactive Payment Processing Overlay */}
      {processingPayment && (
        <div className="payment-processing-overlay">
          <div className="processing-modal">
            <div className="processing-spinner"></div>
            <h3 className="processing-title">{processStepText}</h3>
            <p className="processing-sub">Please do not refresh or close this window.</p>
            <div className="processing-security-badge">
              <span>🔒 256-Bit SSL Encrypted Transaction</span>
            </div>
          </div>
        </div>
      )}

      <div className="checkout-container">
        <div className="checkout-header-bar">
          <button className="back-btn" onClick={() => onNavigate("menu")}>
            ← Back to Menu
          </button>
          <div className="checkout-steps-badge">
            <span>1. Basket</span> → <span className="active">2. Delivery & Payment</span> → <span>3. Receipt</span>
          </div>
        </div>

        <h1 className="checkout-heading">Complete Your Order</h1>

        {errorMsg && <div className="checkout-alert error">{errorMsg}</div>}

        <div className="checkout-grid">
          {/* Left Form: Address, Instructions & Payment */}
          <div className="checkout-form-card">
            {/* Step 1: Delivery Address */}
            <div className="checkout-section-header">
              <span className="step-circle">1</span>
              <div>
                <h2 className="form-title">Delivery Details</h2>
                <p className="form-desc">Where should we deliver your hot food?</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} id="checkout-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    name="customerName"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={formData.customerName}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label>Mobile Number *</label>
                  <input
                    type="tel"
                    name="customerPhone"
                    required
                    maxLength="10"
                    placeholder="e.g. 9876543210"
                    value={formData.customerPhone}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Email Address (For receipt)</label>
                <input
                  type="email"
                  name="customerEmail"
                  placeholder="e.g. rahul.sharma@gmail.com"
                  value={formData.customerEmail}
                  onChange={handleChange}
                />
              </div>

              {/* Address Tag Selector */}
              <div className="address-tags-wrap">
                <label>Save Address As:</label>
                <div className="tag-options">
                  {["Home", "Office", "Other"].map((tag) => (
                    <button
                      type="button"
                      key={tag}
                      className={`address-tag-btn ${formData.addressType === tag ? "active" : ""}`}
                      onClick={() => setFormData({ ...formData, addressType: tag })}
                    >
                      {tag === "Home" ? "🏠 Home" : tag === "Office" ? "🏢 Office" : "📍 Other"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Complete Delivery Address *</label>
                <textarea
                  name="deliveryAddress"
                  required
                  rows="2"
                  placeholder="Flat/House No., Building Name, Street, Colony..."
                  value={formData.deliveryAddress}
                  onChange={handleChange}
                ></textarea>
              </div>

              <div className="form-group">
                <label>Landmark / Nearby Famous Place (Optional)</label>
                <input
                  type="text"
                  name="landmark"
                  placeholder="e.g. Near HDFC Bank ATM, Opposite City Mall"
                  value={formData.landmark}
                  onChange={handleChange}
                />
              </div>

              {/* Special Cooking & Delivery Instructions */}
              <div className="form-group">
                <label>Cooking or Delivery Instructions (Optional)</label>
                <input
                  type="text"
                  name="cookingNotes"
                  placeholder="e.g. Less spicy, extra tissues, ring bell and leave outside..."
                  value={formData.cookingNotes}
                  onChange={handleChange}
                />
              </div>

              {/* Step 2: Payment Method */}
              <div className="checkout-section-header" style={{ marginTop: "2.5rem" }}>
                <span className="step-circle">2</span>
                <div>
                  <h2 className="form-title">Payment Method</h2>
                  <p className="form-desc">Choose your preferred payment option</p>
                </div>
              </div>

              <div className="payment-options">
                {/* UPI Option */}
                <label
                  className={`payment-option ${
                    formData.paymentMethod === "UPI" ? "selected" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="UPI"
                    checked={formData.paymentMethod === "UPI"}
                    onChange={handleChange}
                  />
                  <div className="payment-option-info">
                    <span className="payment-icon">⚡</span>
                    <div>
                      <strong>Instant UPI / QR Code</strong>
                      <p>Google Pay, PhonePe, Paytm, BHIM</p>
                    </div>
                  </div>
                  <span className="offer-tag">Fastest</span>
                </label>

                {/* Sub-options if UPI is selected */}
                {formData.paymentMethod === "UPI" && (
                  <div className="upi-details-subbox">
                    <div className="upi-app-selector">
                      {["GPay", "PhonePe", "Paytm", "BHIM QR"].map((app) => (
                        <button
                          type="button"
                          key={app}
                          className={`upi-pill ${formData.upiApp === app ? "active" : ""}`}
                          onClick={() => setFormData({ ...formData, upiApp: app })}
                        >
                          {app}
                        </button>
                      ))}
                    </div>

                    {formData.upiApp === "BHIM QR" ? (
                      <div className="upi-qr-card">
                        <div className="qr-image-mockup">
                          <img
                            src="https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=upi://pay?pa=foodexpress@upi&pn=FoodExpress&am="
                            alt="Scan & Pay QR"
                          />
                        </div>
                        <span>Scan with any UPI app to pay ₹{grandTotal}</span>
                      </div>
                    ) : (
                      <div className="upi-input-row">
                        <input
                          type="text"
                          placeholder="Enter your UPI ID (e.g. 9876543210@okaxis)"
                          value={formData.upiId}
                          onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Credit / Debit Card Option */}
                <label
                  className={`payment-option ${
                    formData.paymentMethod === "CARD" ? "selected" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="CARD"
                    checked={formData.paymentMethod === "CARD"}
                    onChange={handleChange}
                  />
                  <div className="payment-option-info">
                    <span className="payment-icon">💳</span>
                    <div>
                      <strong>Credit / Debit Card</strong>
                      <p>Visa, MasterCard, RuPay, Maestro</p>
                    </div>
                  </div>
                </label>

                {formData.paymentMethod === "CARD" && (
                  <div className="card-details-subbox">
                    <div className="form-group">
                      <label>Card Number</label>
                      <input
                        type="text"
                        placeholder="4532 •••• •••• 8892"
                        maxLength="19"
                        value={formData.cardNumber}
                        onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value })}
                      />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Expiry (MM/YY)</label>
                        <input
                          type="text"
                          placeholder="08/28"
                          maxLength="5"
                          value={formData.cardExpiry}
                          onChange={(e) => setFormData({ ...formData, cardExpiry: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>CVV</label>
                        <input
                          type="password"
                          placeholder="•••"
                          maxLength="3"
                          value={formData.cardCvv}
                          onChange={(e) => setFormData({ ...formData, cardCvv: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Cash on Delivery Option */}
                <label
                  className={`payment-option ${
                    formData.paymentMethod === "COD" ? "selected" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="COD"
                    checked={formData.paymentMethod === "COD"}
                    onChange={handleChange}
                  />
                  <div className="payment-option-info">
                    <span className="payment-icon">💵</span>
                    <div>
                      <strong>Cash on Delivery (COD)</strong>
                      <p>Pay cash or scan QR when your food arrives</p>
                    </div>
                  </div>
                </label>
              </div>
            </form>
          </div>

          {/* Right Column: Order Summary, Coupons & Bill Breakdown */}
          <div className="checkout-summary-card">
            <h2 className="summary-title">Order Items ({cart.length})</h2>

            {/* Items scroll */}
            <div className="summary-items-list">
              {cart.map((item) => (
                <div key={item.id} className="summary-item-row">
                  <div className="summary-item-main">
                    <span className="summary-item-qty">{item.quantity}x</span>
                    <span className="summary-item-name">{item.name}</span>
                  </div>
                  <span className="summary-item-price">
                    ₹{item.price * item.quantity}
                  </span>
                </div>
              ))}
            </div>

            {/* Coupon Code Section */}
            <div className="coupon-box">
              <label className="coupon-label">Apply Promo Code</label>
              {appliedCoupon ? (
                <div className="applied-coupon-pill">
                  <div className="coupon-info">
                    <span className="code-tag">🎉 {appliedCoupon.code}</span>
                    <span className="code-saved">Saved ₹{discountAmount}</span>
                  </div>
                  <button type="button" className="remove-coupon-btn" onClick={handleRemoveCoupon}>
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="coupon-input-group">
                  <input
                    type="text"
                    placeholder="Enter WELCOME50 or TASTY100"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                  />
                  <button type="submit" className="apply-coupon-btn">
                    Apply
                  </button>
                </form>
              )}
              {couponError && <p className="coupon-error-text">{couponError}</p>}
            </div>

            {/* Tip Delivery Partner */}
            <div className="tip-partner-box">
              <span className="tip-label">🛵 Tip your delivery partner</span>
              <div className="tip-options">
                {[0, 20, 30, 50].map((amount) => (
                  <button
                    type="button"
                    key={amount}
                    className={`tip-btn ${deliveryTip === amount ? "active" : ""}`}
                    onClick={() => setDeliveryTip(amount)}
                  >
                    {amount === 0 ? "No Tip" : `₹${amount}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Bill Breakdown */}
            <div className="summary-breakdown">
              <div className="breakdown-row">
                <span>Items Subtotal</span>
                <span>₹{totalAmount}</span>
              </div>

              {appliedCoupon && (
                <div className="breakdown-row discount-row">
                  <span>Coupon Discount ({appliedCoupon.code})</span>
                  <span className="discount-val">-₹{discountAmount}</span>
                </div>
              )}

              <div className="breakdown-row">
                <span>Delivery Charge</span>
                <span>
                  {baseDeliveryFee === 0 ? (
                    <span className="free-tag">FREE</span>
                  ) : (
                    `₹${baseDeliveryFee}`
                  )}
                </span>
              </div>

              <div className="breakdown-row">
                <span>GST & Restaurant Taxes (5%)</span>
                <span>₹{taxes}</span>
              </div>

              {deliveryTip > 0 && (
                <div className="breakdown-row">
                  <span>Delivery Partner Tip</span>
                  <span>₹{deliveryTip}</span>
                </div>
              )}

              <div className="breakdown-row total-row">
                <span>Total Payable</span>
                <span className="grand-price">₹{grandTotal}</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              form="checkout-form"
              className="confirm-order-btn"
              disabled={submitting}
            >
              {submitting
                ? "Processing..."
                : formData.paymentMethod === "COD"
                ? `Place Cash Order (₹${grandTotal})`
                : `Pay Securely (₹${grandTotal}) →`}
            </button>

            <div className="trust-badges-row">
              <span>🛡️ 100% Secure Checkout</span>
              <span>•</span>
              <span>⚡ 30 Mins Guaranteed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
