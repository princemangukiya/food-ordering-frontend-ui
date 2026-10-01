import React from "react";

export default function ReceiptModal({ order, onClose }) {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return new Date().toLocaleString();
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  // Calculate item total
  const items = order.orderItems || [];
  const itemsTotal = items.reduce(
    (acc, item) => acc + (item.foodPrice || 0) * (item.quantity || 1),
    0
  );
  const deliveryFee = itemsTotal > 499 || itemsTotal === 0 ? 0 : 40;
  const taxes = Math.round(itemsTotal * 0.05);
  const totalAmount = order.totalAmount || (itemsTotal + deliveryFee + taxes);

  return (
    <div className="receipt-modal-backdrop" onClick={onClose}>
      <div
        className="receipt-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Actions at top */}
        <div className="receipt-modal-top-actions no-print">
          <button className="receipt-action-btn print" onClick={handlePrint}>
            🖨️ Print / Download Receipt
          </button>
          <button className="receipt-action-btn close" onClick={onClose}>
            ✕ Close
          </button>
        </div>

        {/* Printable Receipt Paper */}
        <div className="printable-receipt" id="printable-receipt">
          {/* Header */}
          <div className="receipt-header-branding">
            <div className="receipt-brand-logo">
              <span className="brand-icon">🍔</span>
              <div>
                <h1 className="brand-name">FoodExpress</h1>
                <p className="brand-subtitle">Delicious Delivered Superfast</p>
              </div>
            </div>
            <div className="invoice-meta">
              <span className="invoice-tag">TAX INVOICE</span>
              <div className="invoice-number">#ORD-{order.id}</div>
              <div className="invoice-date">{formatDate(order.createdAt)}</div>
            </div>
          </div>

          <div className="receipt-legal-line">
            <span>FSSAI Lic. No: 11522026000124</span>
            <span>•</span>
            <span>GSTIN: 27AABCF1234F1Z8</span>
            <span>•</span>
            <span>Order Type: Online Delivery</span>
          </div>

          <div className="receipt-section-divider"></div>

          {/* Customer & Order Details Grid */}
          <div className="receipt-info-grid">
            <div className="info-block">
              <span className="info-title">CUSTOMER DETAILS</span>
              <p className="info-name"><strong>{order.customerName}</strong></p>
              <p className="info-phone">📞 +91 {order.customerPhone}</p>
              {order.customerEmail && (
                <p className="info-email">✉️ {order.customerEmail}</p>
              )}
            </div>

            <div className="info-block">
              <span className="info-title">DELIVERY ADDRESS</span>
              <p className="info-address">{order.deliveryAddress}</p>
            </div>

            <div className="info-block">
              <span className="info-title">PAYMENT STATUS</span>
              <div className="payment-status-pill">
                <span className={`status-dot ${order.paymentMethod === "COD" ? "cod" : "paid"}`}></span>
                <strong>
                  {order.paymentMethod === "COD"
                    ? "Cash on Delivery (Pending)"
                    : "Paid Online (Success)"}
                </strong>
              </div>
              <p className="payment-time">Mode: {order.paymentMethod || "ONLINE"}</p>
            </div>

            <div className="info-block">
              <span className="info-title">CURRENT STATUS</span>
              <div className={`order-status-badge ${order.orderStatus ? order.orderStatus.toLowerCase() : "confirmed"}`}>
                {order.orderStatus || "CONFIRMED"}
              </div>
            </div>
          </div>

          <div className="receipt-section-divider"></div>

          {/* Items Table */}
          <table className="receipt-items-table">
            <thead>
              <tr>
                <th className="th-num">#</th>
                <th className="th-item">Item Description</th>
                <th className="th-qty text-center">Qty</th>
                <th className="th-price text-right">Price</th>
                <th className="th-total text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index}>
                  <td className="text-muted">{index + 1}</td>
                  <td>
                    <strong>{item.foodName}</strong>
                  </td>
                  <td className="text-center">{item.quantity}</td>
                  <td className="text-right">₹{item.foodPrice}</td>
                  <td className="text-right">
                    ₹{(item.foodPrice * item.quantity).toFixed(2)}
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center text-muted">
                    No items found in this order.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Bill Calculation */}
          <div className="receipt-calc-wrap">
            <div className="receipt-notes">
              <strong>Order Instructions / Notes:</strong>
              <p>{order.cookingNotes || "Standard preparation with authentic ingredients & hot packaging."}</p>
              <div className="barcode-mockup">
                <div className="barcode-lines">||||| | |||| ||| ||||| || |||||| | ||||</div>
                <span>*ORD-{order.id}*</span>
              </div>
            </div>

            <div className="receipt-totals-table">
              <div className="total-row">
                <span>Items Subtotal:</span>
                <span>₹{itemsTotal.toFixed(2)}</span>
              </div>
              <div className="total-row">
                <span>Delivery Fee:</span>
                <span>{deliveryFee === 0 ? "FREE" : `₹${deliveryFee.toFixed(2)}`}</span>
              </div>
              <div className="total-row">
                <span>CGST (2.5%):</span>
                <span>₹{(taxes / 2).toFixed(2)}</span>
              </div>
              <div className="total-row">
                <span>SGST (2.5%):</span>
                <span>₹{(taxes / 2).toFixed(2)}</span>
              </div>
              <div className="total-row grand-total-highlight">
                <span>Grand Total:</span>
                <span className="total-amount">₹{totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="receipt-footer-stamp">
            <div className="stamp-box">
              <span className="stamp-text">
                {order.paymentMethod === "COD" ? "COD VERIFIED" : "PAID & VERIFIED"}
              </span>
            </div>
            <div className="receipt-footer-text">
              <p>Thank you for choosing FoodExpress! Bon Appétit! 🍕🍔</p>
              <small>For queries or support, reach us at support@foodexpress.in or 1800-FOOD-EXP</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
