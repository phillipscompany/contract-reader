import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function Feedback() {
  const [feedback, setFeedback] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      // Simulate API call - in production, you'd send this to your backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsSubmitted(true);
    } catch (err) {
      setError('Something went wrong — please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <>
        <Head>
          <title>Feedback Submitted - Contract Explainer</title>
          <meta name="description" content="Thank you for your feedback on Contract Explainer." />
        </Head>
        
        <main className="container" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '32px', marginBottom: '20px', color: 'var(--text)' }}>
            Thank you - your feedback has been received.
          </h1>
          <p style={{ fontSize: '18px', color: 'var(--muted)', marginBottom: '30px' }}>
            We'll read it, learn from it, and keep improving our service for you.
          </p>
          <Link href="/" className="btn btn--primary">
            Back to Home
          </Link>
        </main>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Give Feedback - Contract Explainer</title>
        <meta name="description" content="Share your feedback to help us improve Contract Explainer." />
      </Head>
      
      <main className="feedback-container">
        <div className="feedback-header">
          <h1 className="feedback-title">We need your feedback.</h1>
          <p className="feedback-subtitle">We're building this tool for people like you. Please tell us what's working and what isn't — we'll listen to you and act fast.</p>
        </div>

        <div className="feedback-grid">
          <div className="feedback-card">
            {error && (
              <div className="feedback-error">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="feedback-form">
              <div className="feedback-field">
                <label htmlFor="feedback" className="feedback-label">
                  Your feedback
                </label>
                <textarea
                  id="feedback"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Type your thoughts here…"
                  required
                  rows={6}
                  className="feedback-textarea"
                />
              </div>

              <div className="feedback-field">
                <label htmlFor="email" className="feedback-label">
                  Email (optional)
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email"
                  className="feedback-input"
                />
                <p className="feedback-help">
                  We'll only use this to follow up on your feedback if needed.
                </p>
              </div>

              <div className="feedback-actions">
                <Link href="/" className="btn">
                  Cancel
                </Link>
                <button 
                  type="submit" 
                  className="btn btn--primary feedback-submit"
                  disabled={isLoading}
                >
                  {isLoading ? 'Sending…' : 'Send it over!'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </>
  );
}
