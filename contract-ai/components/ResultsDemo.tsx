import { downloadResultsPdf } from '../lib/pdf';
import type { DemoResult } from '../lib/summarizeContract';

interface ResultsDemoProps {
  demoResult: DemoResult | null;
  sourceFilename?: string;
}

export default function ResultsDemo({ demoResult, sourceFilename }: ResultsDemoProps) {
  if (!demoResult) {
    return (
      <div className="results-container">
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <p>No demo results available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="results-container">
      {/* Demo Label */}
      <div className="demo-label">
        <span className="demo-badge">DEMO</span>
        <span className="demo-text">First Page Analysis</span>
      </div>

      {/* Upsell Banner */}
      <div className="upsell-banner">
        <div className="upsell-content">
          <h3>🔍 Want a Complete Analysis?</h3>
          <p>This demo shows only the first page. Get a full contract analysis including:</p>
          <ul>
            <li>Complete document review</li>
            <li>Detailed term explanations</li>
            <li>Comprehensive risk assessment</li>
            <li>Key dates and amounts</li>
            <li>Your specific obligations</li>
          </ul>
          <p className="upsell-note">Full analysis coming soon - stay tuned!</p>
        </div>
      </div>

      <div className="results-grid">
        {/* Left Column - Plain-English Summary */}
        <div className="results-card results-summary">
          <h2 className="results-heading">Plain-English Summary</h2>
          <div className="results-content">
            <div className="summary-section">
              <h3>What This Contract Is About</h3>
              <p>{demoResult.summary}</p>
            </div>
            <div className="summary-section">
              <h3>Who's Involved</h3>
              <p>{demoResult.parties}</p>
            </div>
            <div className="summary-section">
              <h3>How Long It Lasts</h3>
              <p>{demoResult.duration}</p>
            </div>
          </div>
        </div>

        {/* Right Column - Key Risks */}
        <div className="results-card results-risks">
          <h2 className="results-heading">Key Things to Watch Out For</h2>
          <div className="results-content">
            <ul className="risks-list">
              {demoResult.risks.map((risk, index) => (
                <li key={index} className="risk-item">
                  {risk}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Download Buttons */}
      <div className="results-download">
        <button 
          onClick={() => downloadResultsPdf({
            siteTitle: 'CONTRACT EXPLAINER - DEMO',
            sourceFilename: sourceFilename,
            summary: demoResult.summary,
            parties: demoResult.parties,
            duration: demoResult.duration,
            risks: demoResult.risks,
            analyzedAt: new Date().toLocaleString()
          })}
          className="btn btn--primary"
        >
          Download Demo Summary as PDF
        </button>
      </div>

      {/* Footer Disclaimer */}
      <div className="results-disclaimer">
        <small>This tool provides AI-powered plain-English explanations. It is not legal advice.</small>
      </div>
    </div>
  );
}
