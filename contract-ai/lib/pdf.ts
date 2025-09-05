import jsPDF from 'jspdf';
import type { FullResult } from './summarizeContract';

interface DownloadResultsPdfOptions {
  siteTitle: string;
  sourceFilename?: string;
  summary: string;
  parties?: string;
  duration?: string;
  risks: string[];
  analyzedAt?: string;
}

interface DownloadFullAnalysisPdfOptions {
  siteTitle: string;
  sourceFilename?: string;
  analyzedAt?: string;
  full: FullResult;
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

export function downloadResultsPdf(options: DownloadResultsPdfOptions): void {
  const {
    siteTitle,
    sourceFilename,
    summary,
    parties,
    duration,
    risks,
    analyzedAt = new Date().toLocaleString()
  } = options;

  // Initialize PDF with A4 portrait
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  
  let yPosition = margin;
  const lineHeight = 7;
  const sectionSpacing = 15;

  // Helper function to add text with word wrapping
  const addWrappedText = (text: string, y: number, fontSize: number = 12, maxWidth?: number): number => {
    const maxW = maxWidth || contentWidth;
    pdf.setFontSize(fontSize);
    
    const lines = pdf.splitTextToSize(text, maxW);
    pdf.text(lines, margin, y);
    
    return y + (lines.length * lineHeight);
  };

  // Helper function to add section heading
  const addSectionHeading = (text: string, y: number): number => {
    pdf.setFontSize(16);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(70, 99, 217); // Primary color
    const newY = addWrappedText(text, y, 16);
    pdf.setTextColor(0, 0, 0); // Reset to black
    pdf.setFont(undefined, 'normal');
    return newY + 5;
  };

  // Helper function to add subsection heading
  const addSubsectionHeading = (text: string, y: number): number => {
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(70, 99, 217); // Primary color
    const newY = addWrappedText(text, y, 14);
    pdf.setTextColor(0, 0, 0); // Reset to black
    pdf.setFont(undefined, 'normal');
    return newY + 3;
  };

  // Helper function to add content text
  const addContentText = (text: string, y: number): number => {
    pdf.setFontSize(11);
    return addWrappedText(text, y, 11);
  };

  // Helper function to add risk items
  const addRiskItems = (risks: string[], y: number): number => {
    pdf.setFontSize(11);
    let currentY = y;
    
    risks.forEach((risk, index) => {
      // Check if we need a new page
      if (currentY > pageHeight - margin - 20) {
        pdf.addPage();
        currentY = margin;
      }
      
      const bulletText = `• ${risk}`;
      currentY = addWrappedText(bulletText, currentY, 11);
      currentY += 3; // Add spacing between items
    });
    
    return currentY;
  };

  // Title
  pdf.setFontSize(24);
  pdf.setFont(undefined, 'bold');
  pdf.setTextColor(70, 99, 217); // Primary color
  yPosition = addWrappedText(siteTitle, yPosition, 24);
  pdf.setTextColor(0, 0, 0); // Reset to black
  pdf.setFont(undefined, 'normal');
  
  // Subtitle with date and filename
  pdf.setFontSize(12);
  pdf.setTextColor(100, 100, 100);
  let subtitle = `Analyzed on: ${analyzedAt}`;
  if (sourceFilename) {
    subtitle += ` | Source: ${sourceFilename}`;
  }
  yPosition = addWrappedText(subtitle, yPosition + 5, 12);
  pdf.setTextColor(0, 0, 0); // Reset to black
  
  yPosition += sectionSpacing;

  // Plain-English Summary section
  yPosition = addSectionHeading('Plain-English Summary', yPosition);
  
  if (summary) {
    yPosition = addSubsectionHeading('What This Contract Is About', yPosition);
    yPosition = addContentText(summary, yPosition);
    yPosition += 5;
  }
  
  if (parties) {
    yPosition = addSubsectionHeading('Who\'s Involved', yPosition);
    yPosition = addContentText(parties, yPosition);
    yPosition += 5;
  }
  
  if (duration) {
    yPosition = addSubsectionHeading('How Long It Lasts', yPosition);
    yPosition = addContentText(duration, yPosition);
    yPosition += 5;
  }

  yPosition += sectionSpacing;

  // Key Risks section
  yPosition = addSectionHeading('Key Things to Watch Out For', yPosition);
  yPosition = addRiskItems(risks, yPosition);

  // Footer disclaimer
  yPosition += sectionSpacing;
  
  // Check if we need a new page for the disclaimer
  if (yPosition > pageHeight - margin - 30) {
    pdf.addPage();
    yPosition = margin;
  }
  
  pdf.setFontSize(10);
  pdf.setTextColor(100, 100, 100);
  pdf.setFont(undefined, 'italic');
  yPosition = addWrappedText('This tool provides AI-powered plain-English explanations. It is not legal advice.', yPosition, 10);
  pdf.setFont(undefined, 'normal');
  pdf.setTextColor(0, 0, 0);

  // Generate filename
  const dateStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  let filename = 'contract-summary';
  
  if (sourceFilename) {
    // Create a slug from the filename
    const slug = sourceFilename
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase();
    filename += `-${slug}`;
  }
  
  filename += `-${dateStr}.pdf`;

  // Save the PDF
  pdf.save(filename);
}

export function downloadFullAnalysisPdf(options: DownloadFullAnalysisPdfOptions): void {
  const {
    siteTitle,
    sourceFilename,
    analyzedAt = new Date().toLocaleString(),
    full,
    meta
  } = options;

  // Highlights section removed - no longer needed

  // Initialize PDF with A4 portrait
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 25.4; // ~1 inch margins
  const contentWidth = pageWidth - (margin * 2);
  
  let yPosition = margin;
  const lineHeight = 7; // Optimized for better content density
  const sectionSpacing = 15; // Reduced spacing between sections
  const paragraphSpacing = 4; // Reduced spacing between paragraphs
  let currentPage = 1;
  const maxPages = 4; // Increased from 2 to 4 pages

  // Helper function to add text with word wrapping and page management
  const addWrappedText = (text: string, y: number, fontSize: number = 12, maxWidth?: number, lineSpacing: number = 1.2): number => {
    const maxW = maxWidth || contentWidth;
    pdf.setFontSize(fontSize);
    
    const lines = pdf.splitTextToSize(text, maxW);
    const actualLineHeight = lineHeight * lineSpacing;
    
    // Check if we need a new page
    if (y + (lines.length * actualLineHeight) > pageHeight - margin - 30) {
      if (currentPage >= maxPages) {
        // Truncate with continuation note
        const truncatedText = text.substring(0, Math.floor(text.length * 0.8)) + '... [continued]';
        const truncatedLines = pdf.splitTextToSize(truncatedText, maxW);
        pdf.text(truncatedLines, margin, y);
        return y + (truncatedLines.length * actualLineHeight);
      }
      
      pdf.addPage();
      currentPage++;
      y = margin;
    }
    
    pdf.text(lines, margin, y);
    return y + (lines.length * actualLineHeight);
  };

  // Helper function to add section heading with page management
  const addSectionHeading = (text: string, y: number): number => {
    if (y > pageHeight - margin - 40) {
      if (currentPage >= maxPages) {
        return y; // Skip if we're at page limit
      }
      pdf.addPage();
      currentPage++;
      y = margin;
    }
    
    // Add spacing above section heading
    y += 5;
    
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(70, 99, 217); // Primary color
    const newY = addWrappedText(text, y, 18, contentWidth, 1.2);
    pdf.setTextColor(0, 0, 0); // Reset to black
    pdf.setFont('helvetica', 'normal');
    
    // Add spacing below section heading
    return newY + 5;
  };

  // Helper function to add subsection heading
  const addSubsectionHeading = (text: string, y: number): number => {
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(70, 99, 217); // Primary color
    const newY = addWrappedText(text, y, 14, contentWidth, 1.1);
    pdf.setTextColor(0, 0, 0); // Reset to black
    pdf.setFont('helvetica', 'normal');
    return newY + 3;
  };

  // Helper function to add content text
  const addContentText = (text: string, y: number): number => {
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    return addWrappedText(text, y, 11, contentWidth, 1.15);
  };

  // Helper function to add bullet list items
  const addBulletList = (items: string[], y: number, title?: string): number => {
    if (title) {
      y = addSubsectionHeading(title, y);
    }
    
    if (items.length === 0) {
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(120, 120, 120);
      y = addWrappedText('Not specified in the provided text.', y, 11, contentWidth, 1.15);
      pdf.setTextColor(0, 0, 0);
      return y + paragraphSpacing;
    }
    
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    let currentY = y;
    
    items.forEach((item, index) => {
      if (currentY > pageHeight - margin - 30) {
        if (currentPage >= maxPages) {
          // Add continuation note and stop
          currentY = addWrappedText('... [continued]', currentY, 11, contentWidth, 1.15);
          return currentY;
        }
        pdf.addPage();
        currentPage++;
        currentY = margin;
      }
      
      const bulletText = `• ${item}`;
      currentY = addWrappedText(bulletText, currentY, 11, contentWidth, 1.15);
      currentY += paragraphSpacing; // Add spacing between items
    });
    
    return currentY;
  };


  // Helper function to add explained terms/clauses
  const addExplainedTerms = (terms: Array<{ clause: string; explanation: string }>, y: number): number => {
    if (terms.length === 0) {
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(120, 120, 120);
      y = addWrappedText('Not specified in the provided text.', y, 11, contentWidth, 1.15);
      pdf.setTextColor(0, 0, 0);
      return y + paragraphSpacing;
    }
    
    pdf.setFontSize(11);
    let currentY = y;
    
    terms.forEach((term, index) => {
      if (currentY > pageHeight - margin - 40) {
        if (currentPage >= maxPages) {
          currentY = addWrappedText('... [continued]', currentY, 11, contentWidth, 1.15);
          return currentY;
        }
        pdf.addPage();
        currentPage++;
        currentY = margin;
      }
      
      // Clause
      pdf.setFont('helvetica', 'bold');
      currentY = addWrappedText(`${term.clause}:`, currentY, 11, contentWidth, 1.15);
      pdf.setFont('helvetica', 'normal');
      
      // Explanation
      currentY = addWrappedText(term.explanation, currentY, 11, contentWidth, 1.15);
      currentY += paragraphSpacing; // Add spacing between terms
    });
    
    return currentY;
  };

  // Helper function to add detailed risks
  const addDetailedRisks = (risks: Array<{ clause: string; whyItMatters: string; howItAffectsYou: string }>, y: number): number => {
    if (risks.length === 0) {
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(120, 120, 120);
      y = addWrappedText('Not specified in the provided text.', y, 11, contentWidth, 1.15);
      pdf.setTextColor(0, 0, 0);
      return y + paragraphSpacing;
    }
    
    pdf.setFontSize(11);
    let currentY = y;
    
    risks.forEach((risk, index) => {
      if (currentY > pageHeight - margin - 50) {
        if (currentPage >= maxPages) {
          currentY = addWrappedText('... [continued]', currentY, 11, contentWidth, 1.15);
          return currentY;
        }
        pdf.addPage();
        currentPage++;
        currentY = margin;
      }
      
      // Risk clause (bold and slightly indented)
      pdf.setFont('helvetica', 'bold');
      currentY = addWrappedText(risk.clause, currentY, 11, contentWidth, 1.15);
      pdf.setFont('helvetica', 'normal');
      
      // Why it matters (indented further)
      const indentWidth = 10;
      currentY = addWrappedText(`• Why this matters: ${risk.whyItMatters}`, currentY, 11, contentWidth - indentWidth, 1.15);
      
      // How it affects you (indented further)
      currentY = addWrappedText(`• How it affects you: ${risk.howItAffectsYou}`, currentY, 11, contentWidth - indentWidth, 1.15);
      currentY += paragraphSpacing; // Add spacing between risks
    });
    
    return currentY;
  };

  // Helper function to add section divider
  const addSectionDivider = (y: number): number => {
    if (y > pageHeight - margin - 20) {
      if (currentPage < maxPages) {
        pdf.addPage();
        currentPage++;
        y = margin;
      } else {
        return y;
      }
    }
    
    // Draw a subtle horizontal line
    pdf.setDrawColor(220, 220, 220);
    pdf.setLineWidth(0.5);
    pdf.line(margin, y, pageWidth - margin, y);
    
    return y + 6; // Add spacing after divider
  };

  // A) Title and Meta Information
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(70, 99, 217); // Primary color
  yPosition = addWrappedText(siteTitle, yPosition, 24, contentWidth, 1.3);
  pdf.setTextColor(0, 0, 0); // Reset to black
  pdf.setFont('helvetica', 'normal');
  
  // Meta information (Location, Contract Type, Email, Timestamp, Filename)
  yPosition += 8;
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 100, 100);
  
  const metaLines: string[] = [];
  if (meta?.location && (meta.location.country || meta.location.region)) {
    const locationText = meta.location.region && meta.location.country
      ? `${meta.location.region}, ${meta.location.country}`
      : meta.location.country || meta.location.region;
    metaLines.push(`Location: ${locationText}`);
  }
  if (meta?.contractType) {
    metaLines.push(`Contract Type: ${meta.contractType}`);
  }
  if (meta?.email) {
    metaLines.push(`Email: ${meta.email}`);
  }
  metaLines.push(`Analyzed: ${analyzedAt}`);
  if (sourceFilename) {
    metaLines.push(`Source: ${sourceFilename}`);
  }
  
  yPosition = addWrappedText(metaLines.join(' | '), yPosition, 11, contentWidth, 1.2);
  pdf.setTextColor(0, 0, 0); // Reset to black
  
  yPosition += sectionSpacing;

  // B) Executive Summary
  yPosition = addSectionHeading('Executive Summary', yPosition);
  yPosition = addContentText(full.executiveSummary, yPosition);
  yPosition = addSectionDivider(yPosition);

  // C) Parties and Purpose
  yPosition = addSectionHeading('Parties and Purpose', yPosition);
  yPosition = addContentText(full.partiesAndPurpose, yPosition);
  yPosition = addSectionDivider(yPosition);

  // D) Key Clauses
  yPosition = addSectionHeading('Key Clauses', yPosition);
  yPosition = addExplainedTerms(full.keyClauses, yPosition);
  yPosition = addSectionDivider(yPosition);

  // E) Obligations
  if (full.obligations.length > 0) {
    yPosition = addSectionHeading('Obligations', yPosition);
    yPosition = addBulletList(full.obligations, yPosition);
    yPosition = addSectionDivider(yPosition);
  }

  // F) Payments and Costs
  if (full.paymentsAndCosts.length > 0) {
    yPosition = addSectionHeading('Payments and Costs', yPosition);
    yPosition = addBulletList(full.paymentsAndCosts, yPosition);
    yPosition = addSectionDivider(yPosition);
  }

  // G) Renewal and Termination
  if (full.renewalAndTermination.length > 0) {
    yPosition = addSectionHeading('Renewal and Termination', yPosition);
    yPosition = addBulletList(full.renewalAndTermination, yPosition);
    yPosition = addSectionDivider(yPosition);
  }

  // H) Liability and Risks
  yPosition = addSectionHeading('Liability and Risks', yPosition);
  yPosition = addDetailedRisks(full.liabilityAndRisks, yPosition);
  yPosition = addSectionDivider(yPosition);

  // I) Recommendations
  if (full.recommendations.length > 0) {
    yPosition = addSectionHeading('Recommendations', yPosition);
    yPosition = addBulletList(full.recommendations, yPosition);
    yPosition = addSectionDivider(yPosition);
  }

  // J) Professional Advice Note
  yPosition = addSectionHeading('Professional Advice Note', yPosition);
  pdf.setFont('helvetica', 'italic');
  yPosition = addContentText(full.professionalAdviceNote, yPosition);
  pdf.setFont('helvetica', 'normal');
  yPosition = addSectionDivider(yPosition);

  // K) Footer disclaimer
  // Check if we need a new page for the disclaimer
  if (yPosition > pageHeight - margin - 40) {
    if (currentPage < maxPages) {
      pdf.addPage();
      currentPage++;
      yPosition = margin;
    }
  }
  
  if (currentPage <= maxPages) {
    // Add some spacing before footer
    yPosition += 10;
    
    // Draw a subtle line above footer
    pdf.setDrawColor(220, 220, 220);
    pdf.setLineWidth(0.5);
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 8;
    
    // Disclaimer text
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'italic');
    pdf.setTextColor(100, 100, 100);
    yPosition = addWrappedText('This tool provides AI-powered plain-English explanations. It is not legal advice.', yPosition, 9, contentWidth, 1.2);
    
    // Add timestamp
    const generatedAt = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
    yPosition += 3;
    pdf.setFontSize(8);
    pdf.setTextColor(120, 120, 120);
    yPosition = addWrappedText(`Generated on ${generatedAt}`, yPosition, 8, contentWidth, 1.2);
    
    // Reset formatting
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);
  }

  // Generate filename
  const dateStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  let filename = 'contract-full-analysis';
  
  if (sourceFilename) {
    // Create a slug from the filename
    const slug = sourceFilename
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase();
    filename += `-${slug}`;
  }
  
  filename += `-${dateStr}.pdf`;

  // Save the PDF
  pdf.save(filename);
}
