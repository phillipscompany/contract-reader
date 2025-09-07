import { useState } from 'react';
import { ShieldAlert, Eye, EyeOff } from 'lucide-react';
import type { FullResult } from '../lib/summarizeContract';

interface RiskCoverageProps {
  coverage: FullResult['riskCoverage'];
}

export default function RiskCoverage({ coverage }: RiskCoverageProps) {
  const [showOnlyRisks, setShowOnlyRisks] = useState(false);

  // Count statuses for summary chips
  const statusCounts = coverage.matrix.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Filter matrix based on toggle
  const filteredMatrix = showOnlyRisks 
    ? coverage.matrix.filter(item => item.status !== 'present_favorable')
    : coverage.matrix;

  // Helper function to get status badge color class
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'present_favorable': return 'badge badge--status-favorable';
      case 'present_unfavorable': return 'badge badge--status-unfavorable';
      case 'ambiguous': return 'badge badge--status-ambiguous';
      case 'not_mentioned': return 'badge badge--status-not-mentioned';
      default: return 'badge badge--status-not-mentioned';
    }
  };

  // Helper function to get severity badge color class
  const getSeverityBadgeClass = (severity: string) => {
    switch (severity) {
      case 'high': return 'badge badge--sev-high';
      case 'medium': return 'badge badge--sev-medium';
      case 'low': return 'badge badge--sev-low';
      default: return 'badge badge--sev-medium';
    }
  };

  // Helper function to get status display text
  const getStatusDisplayText = (status: string) => {
    switch (status) {
      case 'present_favorable': return 'Favorable';
      case 'present_unfavorable': return 'Unfavorable';
      case 'ambiguous': return 'Ambiguous';
      case 'not_mentioned': return 'Not Mentioned';
      default: return 'Unknown';
    }
  };

  // Helper function to truncate text with tooltip
  const TruncatedText = ({ text, maxLength = 60 }: { text: string, maxLength?: number }) => {
    if (text.length <= maxLength) {
      return <span>{text}</span>;
    }
    
    return (
      <span title={text} className="truncated-text">
        {text.substring(0, maxLength)}...
      </span>
    );
  };

  return (
    <div className="results-section">
      {/* Section Header */}
      <div className="section-header">
        <ShieldAlert size={20} className="section-icon" />
        <h2 className="section-title">Risk Coverage</h2>
      </div>

      <div className="section-card">
        {/* Summary Chips */}
        <div className="coverage__summary">
          <div className="summary-chip">
            <span className="chip-label">Total Reviewed:</span>
            <span className="chip-value">{coverage.reviewedCategories.length}</span>
          </div>
          <div className="summary-chip">
            <span className="chip-label">Favorable:</span>
            <span className="chip-value chip-value--favorable">{statusCounts.present_favorable || 0}</span>
          </div>
          <div className="summary-chip">
            <span className="chip-label">Unfavorable:</span>
            <span className="chip-value chip-value--unfavorable">{statusCounts.present_unfavorable || 0}</span>
          </div>
          <div className="summary-chip">
            <span className="chip-label">Ambiguous:</span>
            <span className="chip-value chip-value--ambiguous">{statusCounts.ambiguous || 0}</span>
          </div>
          <div className="summary-chip">
            <span className="chip-label">Not Mentioned:</span>
            <span className="chip-value chip-value--not-mentioned">{statusCounts.not_mentioned || 0}</span>
          </div>
        </div>

        {/* Toggle for showing only risks */}
        <div className="coverage__toggle">
          <button 
            className="toggle"
            onClick={() => setShowOnlyRisks(!showOnlyRisks)}
            aria-label={showOnlyRisks ? "Show all categories" : "Show only risk categories"}
          >
            {showOnlyRisks ? <EyeOff size={16} /> : <Eye size={16} />}
            {showOnlyRisks ? 'Show all categories' : 'Show only risks'}
          </button>
        </div>

        {/* Coverage Table */}
        <div className="coverage__table">
          <div className="table-header">
            <div className="table-cell table-cell--category">Category</div>
            <div className="table-cell table-cell--status">Status</div>
            <div className="table-cell table-cell--severity">Severity</div>
            <div className="table-cell table-cell--evidence">Evidence</div>
            <div className="table-cell table-cell--action">Recommended Action</div>
          </div>
          
          <div className="table-body">
            {filteredMatrix.map((item, index) => (
              <div key={index} className="table-row">
                <div className="table-cell table-cell--category">
                  <strong>{item.category}</strong>
                </div>
                <div className="table-cell table-cell--status">
                  <span 
                    className={getStatusBadgeClass(item.status)}
                    aria-label={`Status: ${getStatusDisplayText(item.status)}`}
                  >
                    {getStatusDisplayText(item.status)}
                  </span>
                </div>
                <div className="table-cell table-cell--severity">
                  <span 
                    className={getSeverityBadgeClass(item.severity)}
                    aria-label={`Severity: ${item.severity}`}
                  >
                    {item.severity}
                  </span>
                </div>
                <div className="table-cell table-cell--evidence">
                  <TruncatedText text={item.evidence || 'No evidence provided'} />
                </div>
                <div className="table-cell table-cell--action">
                  <TruncatedText text={item.recommendedAction} maxLength={80} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Risks Summary */}
        {coverage.topRisks.length > 0 && (
          <div className="coverage__top-risks">
            <h4>Top Risks</h4>
            <div className="top-risks-list">
              {coverage.topRisks.map((risk, index) => (
                <div key={index} className="top-risk-item">
                  <span className={getSeverityBadgeClass(risk.severity)}>
                    {risk.severity}
                  </span>
                  <span className="risk-title">{risk.title}</span>
                  <span className="risk-action">{risk.action}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
