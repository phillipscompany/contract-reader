import type { FullResult } from './summarizeContract';

/**
 * Derives up to 5 concise highlight badges from the full analysis result
 * for instant scannability at the top of the results page.
 */
export function deriveHighlights(full: FullResult): string[] {
  const highlights: string[] = [];
  const maxLength = 40; // Maximum characters per badge

  // Helper function to truncate and clean text
  const truncate = (text: string): string => {
    return text.length > maxLength 
      ? text.substring(0, maxLength - 3) + '...'
      : text;
  };

  // Helper function to add highlight if not too long
  const addHighlight = (text: string): void => {
    if (text && text.length <= maxLength && highlights.length < 5) {
      highlights.push(text);
    }
  };

  // 1. Add first 1-2 payment/cost items
  if (full.paymentsAndCosts.length > 0) {
    const firstPayment = full.paymentsAndCosts[0];
    addHighlight(truncate(firstPayment));
    
    if (full.paymentsAndCosts.length > 1 && highlights.length < 5) {
      const secondPayment = full.paymentsAndCosts[1];
      addHighlight(truncate(secondPayment));
    }
  }

  // 2. Add first 1-2 renewal/termination items
  if (full.renewalAndTermination.length > 0) {
    const firstRenewal = full.renewalAndTermination[0];
    addHighlight(truncate(firstRenewal));
    
    if (full.renewalAndTermination.length > 1 && highlights.length < 5) {
      const secondRenewal = full.renewalAndTermination[1];
      addHighlight(truncate(secondRenewal));
    }
  }

  // 3. Add first 1-2 top risks from risk coverage
  if (full.riskCoverage.topRisks.length > 0) {
    const firstRisk = full.riskCoverage.topRisks[0].title;
    addHighlight(truncate(firstRisk));
    
    if (full.riskCoverage.topRisks.length > 1 && highlights.length < 5) {
      const secondRisk = full.riskCoverage.topRisks[1].title;
      addHighlight(truncate(secondRisk));
    }
  }

  // 4. Add first key clause if present
  if (full.keyClauses.length > 0 && highlights.length < 5) {
    const firstClause = full.keyClauses[0].clause;
    addHighlight(truncate(firstClause));
  }

  // 5. Add first obligation if present
  if (full.obligations.length > 0 && highlights.length < 5) {
    const firstObligation = full.obligations[0];
    addHighlight(truncate(firstObligation));
  }

  return highlights;
}
