import React, { useState, useEffect } from "react";
import { getReviews } from "../services/api";
import ReviewModal from "../components/ReviewModal";

export default function ReviewsFeed({ onNavigate }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterRating, setFilterRating] = useState(0); // 0 means all

  const loadReviews = async () => {
    setLoading(true);
    try {
      const data = await getReviews();
      if (Array.isArray(data)) {
        setReviews(data);
      }
    } catch (e) {
      console.warn("Failed to load reviews:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();

    const handleEvent = (e) => {
      if (e.detail) {
        setReviews((prev) => [e.detail, ...prev.filter((r) => r.id !== e.detail.id)]);
      } else {
        loadReviews();
      }
    };

    window.addEventListener("food_express_review_added", handleEvent);
    window.addEventListener("storage", loadReviews);

    return () => {
      window.removeEventListener("food_express_review_added", handleEvent);
      window.removeEventListener("storage", loadReviews);
    };
  }, []);

  const handleReviewSubmitted = (newRev) => {
    setReviews((prev) => [newRev, ...prev.filter((r) => r.id !== newRev.id)]);
  };

  const filtered = filterRating > 0 ? reviews.filter((r) => r.rating === filterRating) : reviews;

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + (r.rating || 5), 0) / reviews.length).toFixed(1)
      : "4.9";

  return (
    <div className="reviews-page-wrap">
      {/* Header Banner */}
      <div className="reviews-header-banner">
        <div className="reviews-header-left">
          <span className="reviews-crown-badge">⭐ VERIFIED DINER REVIEWS</span>
          <h1 className="reviews-title">Customer Feedback & Ratings</h1>
          <p className="reviews-desc">
            Read what our food lovers say about our fresh meals, lightning delivery, and authentic taste.
          </p>
          <div className="reviews-rating-score-box">
            <span className="big-score">{avgRating}</span>
            <div className="score-details">
              <div className="score-stars">★★★★★</div>
              <span className="score-count">Based on {reviews.length}+ happy foodies</span>
            </div>
          </div>
        </div>

        <div className="reviews-header-right">
          <button className="write-review-hero-btn" onClick={() => setShowModal(true)}>
            ✍️ Write a Review
          </button>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="reviews-filter-strip">
        <button
          className={`rev-filter-btn ${filterRating === 0 ? "active" : ""}`}
          onClick={() => setFilterRating(0)}
        >
          All Reviews ({reviews.length})
        </button>
        <button
          className={`rev-filter-btn ${filterRating === 5 ? "active" : ""}`}
          onClick={() => setFilterRating(5)}
        >
          ⭐ 5 Stars Only
        </button>
        <button
          className={`rev-filter-btn ${filterRating === 4 ? "active" : ""}`}
          onClick={() => setFilterRating(4)}
        >
          ⭐ 4 Stars
        </button>
      </div>

      {/* Reviews List */}
      <div className="reviews-cards-grid">
        {loading ? (
          <div className="reviews-loading">
            <div className="feed-spinner"></div>
            <p>Loading customer reviews...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="reviews-empty">
            <span>🍽️</span>
            <h3>No reviews yet for this filter</h3>
            <button className="primary-btn" onClick={() => setShowModal(true)}>
              Be the first to review!
            </button>
          </div>
        ) : (
          filtered.map((rev) => (
            <div key={rev.id} className="review-card-item">
              <div className="rev-card-top">
                <div className="rev-user-info">
                  <div className="rev-avatar">
                    {(rev.customerName || "U").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="rev-user-name">{rev.customerName || "Valued Customer"}</h4>
                    <span className="rev-verified-tag">✓ Verified Food Order</span>
                  </div>
                </div>

                <div className="rev-stars-box">
                  {"★".repeat(rev.rating || 5)}
                  {"☆".repeat(5 - (rev.rating || 5))}
                </div>
              </div>

              <p className="rev-comment-text">"{rev.comment}"</p>

              <div className="rev-card-footer">
                <span className="rev-time-ago">
                  {rev.createdAt
                    ? new Date(rev.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "Recently"}
                </span>
                <span className="rev-helpful-tag">👍 FoodExpress Verified</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Review Modal */}
      <ReviewModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onReviewSubmitted={handleReviewSubmitted}
      />
    </div>
  );
}
