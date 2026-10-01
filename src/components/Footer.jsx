import React from "react";

export default function Footer() {
  return (
    <footer className="footer-wrap">
      <div className="footer-container">
        <div className="footer-col">
          <div className="footer-logo">
            <span className="logo-icon">🍔</span>
            <span className="logo-text">FoodExpress</span>
          </div>
          <p className="footer-tagline">
            Delivering your favorite fresh meals hot & fast to your doorstep.
          </p>
        </div>

        <div className="footer-col">
          <h4 className="footer-heading">Top Categories</h4>
          <ul className="footer-links">
            <li>Pizzas</li>
            <li>Burgers</li>
            <li>Biryanis</li>
            <li>Desserts

            & Drinks</li>
          </ul>
        </div>

        <div className="footer-col">
          <h4 className="footer-heading">Customer Support</h4>
          <ul className="footer-links">
            <li>Help & FAQs</li>
            <li>Track Order</li>
            <li>Terms & Conditions</li>
            <li>Privacy Policy</li>
          </ul>
        </div>

        <div className="footer-col">
          <h4 className="footer-heading">Contact Us</h4>
          <p className="footer-contact">📍Kondhwa Near Closed VIT Collage</p>
          <p className="footer-contact">📞 +91 9377370277</p>
          <p className="footer-contact">✉️ madhav@gmails.com</p>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} FoodExpress. All rights reserved.</p>
      </div>
    </footer>
  );
}
