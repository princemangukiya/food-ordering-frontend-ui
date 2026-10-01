import React, { useState } from "react";

export default function AdminLoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    // Default secret admin PIN is 1234
    if (pin.trim() === "1234") {
      setError("");
      setPin("");
      onLoginSuccess();
    } else {
      setError("Incorrect Admin PIN! (Default is 1234)");
    }
  };

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          ✕
        </button>

        <div className="admin-modal-header">
          <div className="admin-icon-circle">🔐</div>
          <h2>Restaurant Staff / Admin Login</h2>
          <p>Enter the security PIN to access the kitchen display, manage live orders, and change dish availability.</p>
        </div>

        <form onSubmit={handleSubmit} className="admin-modal-form">
          <div className="admin-input-group">
            <label htmlFor="adminPin">Admin Security PIN</label>
            <input
              id="adminPin"
              type="password"
              maxLength="6"
              autoFocus
              placeholder="Enter PIN (Default: 1234)"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                if (error) setError("");
              }}
            />
          </div>

          {error && <div className="admin-error-box">{error}</div>}

          <div className="admin-modal-actions">
            <button type="button" className="secondary-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary-btn">
              Unlock Admin Panel 🔓
            </button>
          </div>
        </form>

        <div className="admin-modal-hint">
          <span>💡 Default Admin PIN is <strong>1234</strong></span>
        </div>
      </div>
    </div>
  );
}
