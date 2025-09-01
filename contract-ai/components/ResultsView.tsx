interface ResultsViewProps {
  summary: string;
  parties: string;
  duration: string;
  risks: string[];
}

export default function ResultsView({ summary, parties, duration, risks }: ResultsViewProps) {
  return (
    <div className="results-container">
      <div className="results-grid">
        {/* Left Column - Plain-English Summary */}
        <div className="results-card results-summary">
          <h2 className="results-heading">Plain-English Summary</h2>
          <div className="results-content">
            <div className="summary-section">
              <h3>What This Contract Is About</h3>
              <p>{summary}</p>
            </div>
            <div className="summary-section">
              <h3>Who's Involved</h3>
              <p>{parties}</p>
            </div>
            <div className="summary-section">
              <h3>How Long It Lasts</h3>
              <p>{duration}</p>
            </div>
          </div>
        </div>

        {/* Right Column - Key Risks */}
        <div className="results-card results-risks">
          <h2 className="results-heading">Key Things to Watch Out For</h2>
          <div className="results-content">
            <ul className="risks-list">
              {risks.map((risk, index) => (
                <li key={index} className="risk-item">
                  {risk}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Footer Disclaimer */}
      <div className="results-disclaimer">
        <small>This tool provides AI-powered plain-English explanations. It is not legal advice.</small>
      </div>
    </div>
  );
}
