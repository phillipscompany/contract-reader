import { useState } from 'react';
import { downloadFullAnalysisPdf } from '../lib/pdf';
import type { FullResult } from '../lib/summarizeContract';
import BucketPreview from './BucketPreview';
import { 
  FileText, 
  Users, 
  BookOpen, 
  ClipboardCheck, 
  AlertTriangle, 
  Scale,
  ChevronDown,
  ChevronUp,
  X,
  Info
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
    intakeContractType?: string;
    detectedContractType?: { label: string; confidence: number };
    finalContractType?: string;
    pages?: number;
  };
}

export default function ResultsFull({ fullResult, sourceFilename, meta }: ResultsFullProps) {
  const [bannerDismissed, setBannerDismissed] = useState(false);

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

  // Check for contract type mismatch and determine banner type
  const intakeType = meta?.intakeContractType || fullResult.intakeContractType;
  const detectedType = meta?.detectedContractType || fullResult.detectedContractType;
  const finalType = meta?.finalContractType || fullResult.finalContractType;
  
  const showMismatchBanner = !bannerDismissed && 
    intakeType && 
    detectedType && 
    intakeType !== detectedType.label && 
    intakeType !== "Other";

  const didSwitch = finalType === detectedType.label;
  const confidencePercent = Math.round((detectedType.confidence || 0) * 100);

  return (
    <div className="results-container">
      {/* Contract Type Mismatch Banner */}
      {showMismatchBanner && (
        <div 
          className={`contract-type-banner ${didSwitch ? 'banner-info' : 'banner-warning'}`}
          role="status"
          aria-live="polite"
        >
          <div className="banner-content">
            {didSwitch ? (
              <Info size={20} className="banner-icon" />
            ) : (
              <AlertTriangle size={20} className="banner-icon" />
            )}
            <div className="banner-text">
              {didSwitch ? (
                <>
                  <strong>Note:</strong> You selected <strong>'{intakeType}'</strong>, but we're confident this is a <strong>'{detectedType.label}'</strong> (confidence {confidencePercent}%). We've used that for the analysis.
                </>
              ) : (
                <>
                  You selected <strong>'{intakeType}'</strong>, but this may be a <strong>'{detectedType.label}'</strong> (confidence {confidencePercent}%). We analysed it as <strong>'{intakeType}'</strong> as requested.
                </>
              )}
            </div>
          </div>
          <button 
            className="banner-dismiss"
            onClick={() => setBannerDismissed(true)}
            aria-label="Dismiss banner"
          >
            <X size={16} />
          </button>
        </div>
      )}

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

      {/* D) Key Details Section */}
      {(fullResult.obligations.length > 0 || fullResult.paymentsAndCosts.length > 0 || fullResult.renewalAndTermination.length > 0) && (
        <div className="results-section">
          <SectionHeader icon={ClipboardCheck} title="Key Details" />
          <SectionCard>
            {fullResult.obligations.length > 0 && (
              <div className="detail-subsection">
                <h4>Obligations</h4>
                <ul className="detail-list">
                  {fullResult.obligations.map((obligation, index) => (
                    <li key={index} className="detail-item">{obligation}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {fullResult.paymentsAndCosts.length > 0 && (
              <div className="detail-subsection">
                <h4>Payments and Costs</h4>
                <ul className="detail-list">
                  {fullResult.paymentsAndCosts.map((payment, index) => (
                    <li key={index} className="detail-item">{payment}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {fullResult.renewalAndTermination.length > 0 && (
              <div className="detail-subsection">
                <h4>Renewal and Termination</h4>
                <ul className="detail-list">
                  {fullResult.renewalAndTermination.map((term, index) => (
                    <li key={index} className="detail-item">{term}</li>
                  ))}
                </ul>
              </div>
            )}
          </SectionCard>
        </div>
      )}

      {/* E) Risk Coverage Section */}
      {(() => {
        console.log('ResultsFull - fullResult.buckets:', fullResult.buckets);
        console.log('ResultsFull - buckets length:', fullResult.buckets?.length);
        return null;
      })()}
      {fullResult.buckets && fullResult.buckets.length > 0 && (
        <div className="results-section">
          <BucketPreview buckets={fullResult.buckets} />
        </div>
      )}
      {(!fullResult.buckets || fullResult.buckets.length === 0) && (
        <div className="results-section">
          <p>Debug: No buckets found. fullResult.buckets = {JSON.stringify(fullResult.buckets)}</p>
        </div>
      )}

      {/* F) Liability and Risks Section */}
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

      {/* G) Professional Advice Note Section */}
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
