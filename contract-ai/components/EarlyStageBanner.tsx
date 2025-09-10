import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function EarlyStageBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if banner was previously dismissed
    const dismissed = localStorage.getItem('earlyBannerDismissed');
    if (!dismissed) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('earlyBannerDismissed', 'true');
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div 
      className="early-banner" 
      role="region" 
      aria-label="Early-stage notice"
    >
      <div className="container">
        <div className="early-banner__content">
          <p className="early-banner__text">
            <span className="early-banner__icon">⚠️</span>
            Contract Explainer is still in its early stages. We're working hard to make it amazing for you. If something isn't working or could be improved, please tell us here and we'll fix it for you.{' '}
            <Link 
              href="/feedback" 
              className="early-banner__link"
              aria-label="Give feedback"
            >
              Give feedback
            </Link>
          </p>
          <button
            onClick={handleDismiss}
            className="early-banner__dismiss"
            aria-label="Dismiss notice"
            type="button"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
