import React, { useState } from 'react';

export type FeedbackRating = 'HELPFUL' | 'COULD_BE_BETTER' | 'NOT_HELPFUL';

export interface UserFeedbackEntry {
  id: string;
  timestamp: string;
  caseId?: string;
  rating: FeedbackRating | null;
  categories: string[];
  comment: string;
}

const FEEDBACK_STORAGE_KEY = 'scamvera_user_feedback';

const QUICK_CATEGORIES = [
  'Detection was accurate',
  'False positive',
  'False negative',
  'Explanation was unclear',
  'UI was slow',
  'Something else',
];

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseId?: string;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose, caseId }) => {
  const [rating, setRating] = useState<FeedbackRating | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleToggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Privacy-preserving: zero personal info, zero examined message content
    const feedbackItem: UserFeedbackEntry = {
      id: `fb-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
      caseId: caseId ? caseId.slice(0, 16) : undefined,
      rating,
      categories: selectedCategories,
      comment: comment.trim(),
    };

    try {
      const existing = localStorage.getItem(FEEDBACK_STORAGE_KEY);
      const parsed: UserFeedbackEntry[] = existing ? JSON.parse(existing) : [];
      const updated = [feedbackItem, ...parsed].slice(0, 50);
      localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Gracefully handle if localStorage is disabled or full
    }

    setIsSubmitted(true);
    setTimeout(() => {
      handleClose();
    }, 1800);
  };

  const handleClose = () => {
    setIsSubmitted(false);
    setRating(null);
    setSelectedCategories([]);
    setComment('');
    onClose();
  };

  return (
    <div className="modal-overlay feedback-modal-overlay" onClick={handleClose}>
      <div
        className="modal-content feedback-modal-content"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-modal-title"
      >
        {isSubmitted ? (
          <div className="feedback-confirmation-box">
            <div className="feedback-confirm-icon">✓</div>
            <h3 className="feedback-confirm-title">Thanks — your feedback was recorded.</h3>
            <p className="feedback-confirm-sub">
              Your response was saved locally on your device to help improve Scamvera.
            </p>
            <button type="button" className="btn-secondary" onClick={handleClose} style={{ marginTop: '14px' }}>
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="feedback-form">
            <div className="feedback-header">
              <h3 id="feedback-modal-title" className="feedback-title">
                Share Feedback
              </h3>
              <button
                type="button"
                className="feedback-close-btn"
                onClick={handleClose}
                aria-label="Close feedback modal"
              >
                ✕
              </button>
            </div>

            {/* Question 1: Experience Rating */}
            <div className="feedback-section">
              <label className="feedback-section-label">How was your investigation experience?</label>
              <div className="feedback-rating-row" role="radiogroup" aria-label="Investigation experience rating">
                <button
                  type="button"
                  className={`feedback-rating-btn ${rating === 'HELPFUL' ? 'active helpful' : ''}`}
                  onClick={() => setRating('HELPFUL')}
                  aria-pressed={rating === 'HELPFUL'}
                >
                  <span className="rating-emoji">👍</span>
                  <span>Helpful</span>
                </button>
                <button
                  type="button"
                  className={`feedback-rating-btn ${rating === 'COULD_BE_BETTER' ? 'active better' : ''}`}
                  onClick={() => setRating('COULD_BE_BETTER')}
                  aria-pressed={rating === 'COULD_BE_BETTER'}
                >
                  <span className="rating-emoji">😐</span>
                  <span>Could be better</span>
                </button>
                <button
                  type="button"
                  className={`feedback-rating-btn ${rating === 'NOT_HELPFUL' ? 'active unhelpful' : ''}`}
                  onClick={() => setRating('NOT_HELPFUL')}
                  aria-pressed={rating === 'NOT_HELPFUL'}
                >
                  <span className="rating-emoji">👎</span>
                  <span>Not helpful</span>
                </button>
              </div>
            </div>

            {/* Question 2: Optional Categories */}
            <div className="feedback-section">
              <label className="feedback-section-label">
                Optional quick categories <span className="label-optional">(select all that apply)</span>
              </label>
              <div className="feedback-categories-wrap">
                {QUICK_CATEGORIES.map((cat) => {
                  const isChecked = selectedCategories.includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      className={`feedback-cat-pill ${isChecked ? 'active' : ''}`}
                      onClick={() => handleToggleCategory(cat)}
                      aria-pressed={isChecked}
                    >
                      {isChecked && <span className="cat-check">✓ </span>}
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Question 3: Comments */}
            <div className="feedback-section">
              <label htmlFor="feedback-comment" className="feedback-section-label">
                What would you like to tell us? <span className="label-optional">(optional)</span>
              </label>
              <textarea
                id="feedback-comment"
                className="feedback-textarea"
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your thoughts, suggestions, or what went well..."
                maxLength={1000}
              />
              <div className="feedback-privacy-note">
                🔒 Privacy guarantee: Stored locally in your browser. No personal information or examined messages are collected.
              </div>
            </div>

            {/* Actions */}
            <div className="feedback-actions-row">
              <button type="button" className="btn-secondary" onClick={handleClose}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary feedback-submit-btn"
                disabled={!rating && selectedCategories.length === 0 && !comment.trim()}
              >
                Submit Feedback
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
