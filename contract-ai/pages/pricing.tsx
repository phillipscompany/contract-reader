import Link from 'next/link';
import Head from 'next/head';

export default function Pricing() {
  return (
    <>
      <Head>
        <title>Pricing - Contract Explainer | Free during beta</title>
        <meta name="description" content="Use Contract Explainer completely free during our beta testing phase. Full contract analysis with plain-English reports at no cost. Paid subscriptions coming soon." />
      </Head>
      
      <main className="pricing-container">
        <div className="pricing-header">
          <h1 className="pricing-title">We're Free!</h1>
          <p className="pricing-subtitle">Upload your contract and recieve a free analysis.</p>
        </div>

        <div className="pricing-grid">
          <div className="pricing-card pricing-card--beta">
            <div className="pricing-badge">Beta</div>
            
            <div className="pricing-card-header">
              <h2 className="pricing-card-title">Free during beta</h2>
              <p className="pricing-card-subtitle">
              It's still early days, so using this service won’t cost you a penny. All we ask for in return is a little feedback — tell us what’s clear, what’s confusing, or what could be better.
              Your thoughts help us build something genuinely useful.
              </p>
            </div>

            <div className="pricing-urgency">
              <p className="pricing-urgency-text">
                Pricing will change when subscriptions go live. Try it now while it's free.
              </p>
            </div>

            <div className="pricing-features">
              <ul className="pricing-features-list">
                <li className="pricing-feature">
                  <span className="pricing-feature-icon">✓</span>
                  Full analysis with plain-English report
                </li>
                <li className="pricing-feature">
                  <span className="pricing-feature-icon">✓</span>
                  Risk coverage for supported contract types
                </li>
                <li className="pricing-feature">
                  <span className="pricing-feature-icon">✓</span>
                  Downloadable PDF
                </li>
                <li className="pricing-feature">
                  <span className="pricing-feature-icon">✓</span>
                  No document storage
                </li>
              </ul>
            </div>

            <div className="pricing-cta">
              <Link href="/" className="btn btn--primary pricing-cta-button" aria-label="Upload a contract to get started">
                Upload a contract
              </Link>
            </div>

            <div className="pricing-note">
              <p className="pricing-note-text">
                Paid plans will be introduced soon.
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
