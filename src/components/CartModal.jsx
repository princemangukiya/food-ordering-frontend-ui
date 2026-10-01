import React from "react";
import { useCart } from "../context/CartContext";

export default function CartModal({ onNavigate }) {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeFromCart,
    totalAmount,
    clearCart,
  } = useCart();

  if (!isCartOpen) return null;

  const deliveryFee = totalAmount > 499 || totalAmount === 0 ? 0 : 40;
  const taxes = Math.round(totalAmount * 0.05); // 5% GST
  const grandTotal = totalAmount + (totalAmount > 0 ? deliveryFee + taxes : 0);

  const handleCheckout = () => {
    setIsCartOpen(false);
    onNavigate("checkout");
  };

  return (
    <div className="cart-overlay" onClick={() => setIsCartOpen(false)}>
      <div className="cart-drawer" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="cart-drawer-header">
          <div className="cart-header-title">
            <h3>Your Food Cart</h3>
            <span className="cart-count-badge">{cart.length} items</span>
          </div>
          <button
            className="close-drawer-btn"
            onClick={() => setIsCartOpen(false)}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="cart-drawer-body">
          {cart.length === 0 ? (
            <div className="empty-cart-state">
              <div className="empty-cart-icon">🛒</div>
              <h4>Your cart is empty</h4>
              <p>Looks like you haven't added anything delicious yet!</p>
              <button
                className="browse-menu-btn"
                onClick={() => setIsCartOpen(false)}
              >
                Explore Menu
              </button>
            </div>
          ) : (
            <div className="cart-items-list">
              {cart.map((item) => (
                <div key={item.id} className="cart-item-row">
                  <img
                    src={
                      item.imageUrl ||
                      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=120"
                    }
                    alt={item.name}
                    className="cart-item-thumb"
                  />
                  <div className="cart-item-info">
                    <h4 className="cart-item-title">{item.name}</h4>
                    <span className="cart-item-price">
                      ₹{item.price} each
                    </span>
                    <div className="cart-item-actions">
                      <div className="qty-control-inline mini">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                        >
                          -
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                        >
                          +
                        </button>
                      </div>
                      <button
                        className="remove-item-btn"
                        onClick={() => removeFromCart(item.id)}
                        title="Remove item"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  <div className="cart-item-subtotal">
                    ₹{item.price * item.quantity}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Bill */}
        {cart.length > 0 && (
          <div className="cart-drawer-footer">
            <div className="bill-summary">
              <div className="bill-row">
                <span>Items Subtotal</span>
                <span>₹{totalAmount}</span>
              </div>
              <div className="bill-row">
                <span>Delivery Fee</span>
                <span>
                  {deliveryFee === 0 ? (
                    <span className="free-tag">FREE</span>
                  ) : (
                    `₹${deliveryFee}`
                  )}
                </span>
              </div>
              <div className="bill-row">
                <span>Taxes & Charges (5%)</span>
                <span>₹{taxes}</span>
              </div>
              <div className="bill-row grand-total">
                <span>To Pay</span>
                <span>₹{grandTotal}</span>
              </div>
            </div>

            <div className="drawer-actions">
              <button className="clear-cart-link" onClick={clearCart}>
                Clear Cart
              </button>
              <button className="proceed-btn" onClick={handleCheckout}>
                Proceed to Checkout (₹{grandTotal}) →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
