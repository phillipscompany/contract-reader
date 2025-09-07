import { useState } from 'react';
import { downloadFullAnalysisPdf } from '../lib/pdf';
import type { FullResult } from '../lib/summarizeContract';
import RiskCoverage from './RiskCoverage';
import { 
  FileText, 
  Users, 
  BookOpen, 
  ClipboardCheck, 
  BadgeDollarSign, 
  RefreshCw, 
  AlertTriangle, 
  Lightbulb,
  Scale,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface ResultsFullProps {
  fullResult: FullResult;
  sourceFilename?: string;
  meta?: {
    email?: string;
    location?: {
      country?: string;
      region?: string;
    };
    contractType?: string;
    pages?: number;
  };
}

export default function ResultsFull({ fullResult, sourceFilename, meta }: ResultsFullProps) {

  // Helper component for section headers
  const SectionHeader = ({ icon: Icon, title }: { icon: any, title: string }) => (
    <div className="section-header">
      <Icon size={20} className="section-icon" />
      <h2 className="section-title">{title}</h2>
    </div>
  );

  // Helper component for section cards
  const SectionCard = ({ children }: { children: React.ReactNode }) => (
    <div className="section-card">
      {children}
    </div>
  );

  // Helper component for expandable text
  const ExpandableText = ({ text, maxLines = 6 }: { text: string, maxLines?: number }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const shouldTruncate = text.length > 300; // Rough estimate for ~6 lines

    if (!shouldTruncate) {
      return <p>{text}</p>;
    }

    return (
      <div>
        <p className={isExpanded ? '' : 'text-truncated'}>
          {text}
        </p>
        <button 
          className="expand-toggle"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <>
              Show less <ChevronUp size={14} />
            </>
          ) : (
            <>
              Show more <ChevronDown size={14} />
            </>
          )}
        </button>
      </div>
    );
  };

  return (
    <div className="results-container">
      {/* A) Executive Summary Section */}
      <div className="results-section">
        <SectionHeader icon={FileText} title="Executive Summary" />
        <SectionCard>
          <div className="summary-content">
            <p>{fullResult.executiveSummary}</p>
          </div>
        </SectionCard>
      </div>

      {/* B) Parties and Purpose Section */}
      <div className="results-section">
        <SectionHeader icon={Users} title="Parties and Purpose" />
        <SectionCard>
          <div className="summary-content">
            <p>{fullResult.partiesAndPurpose}</p>
          </div>
        </SectionCard>
      </div>

      {/* C) Key Clauses Section */}
      {fullResult.keyClauses.length > 0 && (
        <div className="results-section">
          <SectionHeader icon={BookOpen} title="Key Clauses" />
          <SectionCard>
            <div className="terms-content">
              {fullResult.keyClauses.map((clause, index) => (
                <div key={index} className="term-item">
                  <h4 className="term-name">{clause.clause}</h4>
                  <p className="term-meaning">{clause.explanation}</p>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* D) Risk Coverage Section */}
      {fullResult.riskCoverage && fullResult.riskCoverage.matrix.length > 0 && (
        <RiskCoverage coverage={fullResult.riskCoverage} />
      )}

      {/* E) Obligations Section */}
      {fullResult.obligations.length > 0 && (
        <div className="results-section">
          <SectionHeader icon={ClipboardCheck} title="Obligations" />
          <SectionCard>
            <ul className="detail-list">
              {fullResult.obligations.map((obligation, index) => (
                <li key={index} className="detail-item">{obligation}</li>
              ))}
            </ul>
          </SectionCard>
        </div>
      )}

      {/* F) Payments and Costs Section */}
      {fullResult.paymentsAndCosts.length > 0 && (
        <div className="results-section">
          <SectionHeader icon={BadgeDollarSign} title="Payments and Costs" />
          <SectionCard>
            <ul className="detail-list">
              {fullResult.paymentsAndCosts.map((payment, index) => (
                <li key={index} className="detail-item">{payment}</li>
              ))}
            </ul>
          </SectionCard>
        </div>
      )}

      {/* G) Renewal and Termination Section */}
      {fullResult.renewalAndTermination.length > 0 && (
        <div className="results-section">
          <SectionHeader icon={RefreshCw} title="Renewal and Termination" />
          <SectionCard>
            <ul className="detail-list">
              {fullResult.renewalAndTermination.map((term, index) => (
                <li key={index} className="detail-item">{term}</li>
              ))}
            </ul>
          </SectionCard>
        </div>
      )}

      {/* H) Liability and Risks Section */}
      {fullResult.liabilityAndRisks.length > 0 && (
        <div className="results-section">
          <SectionHeader icon={AlertTriangle} title="Liability and Risks" />
          <SectionCard>
            <div className="risks-content">
              {fullResult.liabilityAndRisks.map((risk, index) => (
                <div key={index} className="risk-item">
                  <h4 className="risk-title">{risk.clause}</h4>
                  <div className="risk-details">
                    <div className="risk-section">
                      <h5>Why this matters</h5>
                      <ExpandableText text={risk.whyItMatters} />
                    </div>
                    <div className="risk-section">
                      <h5>How it affects you</h5>
                      <ExpandableText text={risk.howItAffectsYou} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* I) Recommendations Section */}
      {fullResult.recommendations.length > 0 && (
        <div className="results-section">
          <SectionHeader icon={Lightbulb} title="Recommendations" />
          <SectionCard>
            <ul className="detail-list">
              {fullResult.recommendations.map((recommendation, index) => (
                <li key={index} className="detail-item">{recommendation}</li>
              ))}
            </ul>
          </SectionCard>
        </div>
      )}

      {/* J) Professional Advice Note Section */}
      <div className="results-section">
        <SectionHeader icon={Scale} title="Professional Advice Note" />
        <SectionCard>
          <div className="advice-content">
            <p>{fullResult.professionalAdviceNote}</p>
          </div>
        </SectionCard>
      </div>

      {/* Footer Disclaimer */}
      <div className="results-disclaimer">
        <small>This tool provides AI-powered plain-English explanations. It is not legal advice.</small>
      </div>
    </div>
  );
}
