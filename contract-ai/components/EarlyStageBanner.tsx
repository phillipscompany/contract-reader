import { useState, useEffect } from 'react';

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
      <div className="early-banner__content">
        <p className="early-banner__text">
          We're an early-stage start-up and constantly improving. The service may not be perfect yet — please share feedback and we'll fix things quickly.{' '}
          <a 
            href="mailto:feedback@yourdomain.com?subject=Feedback" 
            className="early-banner__link"
            aria-label="Send feedback via email"
          >
            Give feedback
          </a>
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
  );
}
