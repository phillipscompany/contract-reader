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

  // 1. Add first 1-2 amounts mentioned
  if (full.keyDetails.amountsMentioned.length > 0) {
    const firstAmount = full.keyDetails.amountsMentioned[0];
    addHighlight(truncate(firstAmount));
    
    if (full.keyDetails.amountsMentioned.length > 1 && highlights.length < 5) {
      const secondAmount = full.keyDetails.amountsMentioned[1];
      addHighlight(truncate(secondAmount));
    }
  }

  // 2. Add first 1-2 dates mentioned
  if (full.keyDetails.datesMentioned.length > 0) {
    const firstDate = full.keyDetails.datesMentioned[0];
    addHighlight(truncate(firstDate));
    
    if (full.keyDetails.datesMentioned.length > 1 && highlights.length < 5) {
      const secondDate = full.keyDetails.datesMentioned[1];
      addHighlight(truncate(secondDate));
    }
  }

  // 3. Add first 1-2 risk titles
  if (full.risks.length > 0) {
    const firstRisk = full.risks[0].title;
    addHighlight(truncate(firstRisk));
    
    if (full.risks.length > 1 && highlights.length < 5) {
      const secondRisk = full.risks[1].title;
      addHighlight(truncate(secondRisk));
    }
  }

  // 4. Add first termination/renewal snippet if present
  if (full.keyDetails.terminationOrRenewal.length > 0 && highlights.length < 5) {
    const firstTermination = full.keyDetails.terminationOrRenewal[0];
    addHighlight(truncate(firstTermination));
  }

  return highlights;
}
