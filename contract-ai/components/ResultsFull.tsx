import { downloadFullAnalysisPdf } from '../lib/pdf';
import type { FullResult } from '../lib/summarizeContract';

interface ResultsFullProps {
  fullResult: FullResult;
  sourceFilename?: string;
}

export default function ResultsFull({ fullResult, sourceFilename }: ResultsFullProps) {
  return (
    <div className="results-container">
      {/* Full Analysis Label */}
      <div className="full-label">
        <span className="full-badge">FULL ANALYSIS</span>
        <span className="full-text">Complete Contract Review</span>
      </div>

      <div className="results-grid">
        {/* Left Column - Extended Summary */}
        <div className="results-card results-summary">
          <h2 className="results-heading">Extended Summary</h2>
          <div className="results-content">
            <div className="summary-section">
              <h3>What This Contract Is About</h3>
              <p>{fullResult.extendedSummary}</p>
            </div>
          </div>
        </div>

        {/* Right Column - Key Details */}
        <div className="results-card results-details">
          <h2 className="results-heading">Key Details</h2>
          <div className="results-content">
            {fullResult.keyDetails.datesMentioned.length > 0 && (
              <div className="detail-section">
                <h3>Important Dates</h3>
                <ul className="detail-list">
                  {fullResult.keyDetails.datesMentioned.map((date, index) => (
                    <li key={index} className="detail-item">
                      {date}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {fullResult.keyDetails.amountsMentioned.length > 0 && (
              <div className="detail-section">
                <h3>Financial Amounts</h3>
                <ul className="detail-list">
                  {fullResult.keyDetails.amountsMentioned.map((amount, index) => (
                    <li key={index} className="detail-item">
                      {amount}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Second Row - Explained Terms and Obligations */}
      <div className="results-grid">
        {/* Left Column - Explained Terms */}
        {fullResult.explainedTerms.length > 0 && (
          <div className="results-card results-terms">
            <h2 className="results-heading">Legal Terms Explained</h2>
            <div className="results-content">
              {fullResult.explainedTerms.map((term, index) => (
                <div key={index} className="term-section">
                  <h3>{term.term}</h3>
                  <p>{term.meaning}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Right Column - Obligations */}
        {fullResult.keyDetails.obligations.length > 0 && (
          <div className="results-card results-obligations">
            <h2 className="results-heading">Your Obligations</h2>
            <div className="results-content">
              <ul className="obligations-list">
                {fullResult.keyDetails.obligations.map((obligation, index) => (
                  <li key={index} className="obligation-item">
                    {obligation}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Third Row - Termination/Renewal and Risks */}
      <div className="results-grid">
        {/* Left Column - Termination/Renewal */}
        {fullResult.keyDetails.terminationOrRenewal.length > 0 && (
          <div className="results-card results-termination">
            <h2 className="results-heading">Termination & Renewal</h2>
            <div className="results-content">
              <ul className="termination-list">
                {fullResult.keyDetails.terminationOrRenewal.map((term, index) => (
                  <li key={index} className="termination-item">
                    {term}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Right Column - Professional Advice Note */}
        <div className="results-card results-advice">
          <h2 className="results-heading">Professional Note</h2>
          <div className="results-content">
            <p className="advice-text">{fullResult.professionalAdviceNote}</p>
          </div>
        </div>
      </div>

      {/* Comprehensive Risks Section */}
      {fullResult.risks.length > 0 && (
        <div className="results-risks-comprehensive">
          <h2 className="results-heading">Comprehensive Risk Analysis</h2>
          <div className="risks-grid">
            {fullResult.risks.map((risk, index) => (
              <div key={index} className="risk-card">
                <h3 className="risk-title">{risk.title}</h3>
                <div className="risk-content">
                  <div className="risk-why">
                    <h4>Why This Matters</h4>
                    <p>{risk.whyItMatters}</p>
                  </div>
                  <div className="risk-how">
                    <h4>How It Applies Here</h4>
                    <p>{risk.howItAppliesHere}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Download Buttons */}
      <div className="results-download">
        <button 
          onClick={() => downloadFullAnalysisPdf({
            siteTitle: 'CONTRACT EXPLAINER - FULL ANALYSIS',
            sourceFilename: sourceFilename,
            analyzedAt: new Date().toLocaleString(),
            full: fullResult
          })}
          className="btn btn--primary"
        >
          Download Full Report (PDF)
        </button>
      </div>

      {/* Footer Disclaimer */}
      <div className="results-disclaimer">
        <small>This tool provides AI-powered plain-English explanations. It is not legal advice.</small>
      </div>
    </div>
  );
}
