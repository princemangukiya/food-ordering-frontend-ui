import React, { useState } from "react";
import { submitReview } from "../services/api";

export default function ReviewModal({ isOpen, onClose, defaultCustomerName = "", orderId = null, onReviewSubmitted }) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [customerName, setCustomerName] = useState(defaultCustomerName);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerName.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!comment.trim()) {
      setError("Please write a few words about your food experience.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const reviewPayload = {
        customerName: customerName.trim(),
        rating,
        comment: comment.trim(),
        orderId: orderId || null,
        createdAt: new Date().toISOString(),
      };

      await submitReview(reviewPayload);
      setSubmitted(true);
      if (onReviewSubmitted) onReviewSubmitted(reviewPayload);
      setTimeout(() => {
        setSubmitted(false);
        onClose();
      }, 2000);
    } catch (err) {
      setError("Failed to submit review: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="review-modal-backdrop" onClick={onClose}>
      <div className="review-modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          ✕
        </button>

        {submitted ? (
          <div className="review-success-state">
            <div className="review-success-icon">🎉</div>
            <h3>Thank You for Your Review!</h3>
            <p>Your feedback helps us cook better and deliver faster.</p>
          </div>
        ) : (
          <>
            <div className="review-modal-header">
              <span className="review-badge">⭐ RATE YOUR EXPERIENCE</span>
              <h2>How was your food?</h2>
              <p>Share your review with the restaurant and chef!</p>
            </div>

            {/* Interactive Stars */}
            <div className="star-rating-selector">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={`star-btn ${
                    star <= (hoverRating || rating) ? "selected" : ""
                  }`}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  aria-label={`${star} star`}
                >
                  ★
                </button>
              ))}
              <span className="rating-text-label">
                {rating === 5 && "⭐ Excellent! Loved it"}
                {rating === 4 && "👍 Very Good"}
                {rating === 3 && "👌 Average"}
                {rating === 2 && "👎 Not so good"}
                {rating === 1 && "⚠️ Terrible"}
              </span>
            </div>

            <form onSubmit={handleSubmit} className="review-modal-form">
              <div className="review-input-group">
                <label>Your Name</label>
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                />
              </div>

              <div className="review-input-group">
                <label>Your Feedback / Review</label>
                <textarea
                  rows="3"
                  placeholder="What did you like about the food, taste, or delivery?"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  required
                ></textarea>
              </div>

              {error && <div className="review-error-box">{error}</div>}

              <div className="review-modal-actions">
                <button type="button" className="secondary-btn" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="primary-btn" disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit Review ⭐"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
