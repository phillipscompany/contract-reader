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

  // Initialize PDF with A4 portrait
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15; // Optimized margins for maximum content space
  const contentWidth = pageWidth - (margin * 2);
  
  let yPosition = margin;
  const lineHeight = 5.5; // Compact line height
  const sectionSpacing = 10; // Efficient spacing between sections
  const paragraphSpacing = 2; // Minimal spacing between paragraphs

  // Helper function to add text with word wrapping and natural page flow
  const addWrappedText = (text: string, y: number, fontSize: number = 11, maxWidth?: number, lineSpacing: number = 1.1): number => {
    const maxW = maxWidth || contentWidth;
    pdf.setFontSize(fontSize);
    
    const lines = pdf.splitTextToSize(text, maxW);
    const actualLineHeight = lineHeight * lineSpacing;
    
    // Check if we need a new page - allow natural flow
    if (y + (lines.length * actualLineHeight) > pageHeight - margin - 20) {
      pdf.addPage();
      y = margin;
    }
    
    pdf.text(lines, margin, y);
    return y + (lines.length * actualLineHeight);
  };

  // Helper function to add section heading with natural page flow
  const addSectionHeading = (text: string, y: number): number => {
    if (y > pageHeight - margin - 40) {
      pdf.addPage();
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

  // Helper function to add bullet list items with full content
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
      const bulletText = `• ${item}`;
      currentY = addWrappedText(bulletText, currentY, 11, contentWidth, 1.15);
      currentY += paragraphSpacing; // Add spacing between items
    });
    
    return currentY;
  };


  // Helper function to add explained terms/clauses with full content
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

  // Helper function to add detailed risks with full content
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
      // Risk clause (bold)
      pdf.setFont('helvetica', 'bold');
      currentY = addWrappedText(risk.clause, currentY, 11, contentWidth, 1.15);
      pdf.setFont('helvetica', 'normal');
      
      // Why it matters (indented)
      const indentWidth = 10;
      currentY = addWrappedText(`• Why this matters: ${risk.whyItMatters}`, currentY, 11, contentWidth - indentWidth, 1.15);
      
      // How it affects you (indented)
      currentY = addWrappedText(`• How it affects you: ${risk.howItAffectsYou}`, currentY, 11, contentWidth - indentWidth, 1.15);
      currentY += paragraphSpacing; // Add spacing between risks
    });
    
    return currentY;
  };

  // Helper function to add section divider with natural page flow
  const addSectionDivider = (y: number): number => {
    if (y > pageHeight - margin - 20) {
      pdf.addPage();
      y = margin;
    }
    
    // Draw a subtle horizontal line
    pdf.setDrawColor(220, 220, 220);
    pdf.setLineWidth(0.5);
    pdf.line(margin, y, pageWidth - margin, y);
    
    return y + 6; // Add spacing after divider
  };

  // Helper function to add comprehensive risk coverage table
  const addRiskCoverage = (coverage: FullResult['riskCoverage'], y: number): number => {
    if (!coverage || !coverage.matrix || coverage.matrix.length === 0) {
      return y;
    }

    let currentY = y;

    // Count statuses for summary
    const statusCounts = coverage.matrix.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Create summary line with consistent status labels
    const summaryParts: string[] = [];
    if (statusCounts.present_favourable) summaryParts.push(`${statusCounts.present_favourable} favourable`);
    if (statusCounts.present_unfavourable) summaryParts.push(`${statusCounts.present_unfavourable} unfavourable`);
    if (statusCounts.ambiguous) summaryParts.push(`${statusCounts.ambiguous} ambiguous`);
    if (statusCounts.not_mentioned) summaryParts.push(`${statusCounts.not_mentioned} not mentioned`);
    
    const summaryText = `Risk Coverage: ${summaryParts.join(', ')} (${coverage.reviewedCategories.length} categories reviewed)`;
    
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    currentY = addWrappedText(summaryText, currentY, 11, contentWidth, 1.15);
    currentY += paragraphSpacing;

    // Add top risks if available
    if (coverage.topRisks && coverage.topRisks.length > 0) {
      currentY = addSubsectionHeading('Top Risks', currentY);
      
      coverage.topRisks.forEach((risk, index) => {
        const riskText = `• ${risk.title} (${risk.potentialSeverity || risk.severity})`;
        currentY = addWrappedText(riskText, currentY, 11, contentWidth, 1.15);
        currentY += paragraphSpacing;
      });
      
      currentY += paragraphSpacing;
    }

    // Add comprehensive risk coverage table
    currentY = addSubsectionHeading('Risk Coverage by Category', currentY);
    
    
    // Create a detailed table with all information
    coverage.matrix.forEach((item, index) => {
      // Category header
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      currentY = addWrappedText(item.category, currentY, 11, contentWidth, 1.15);
      
      // Status and Severity on same line
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      const statusSeverity = `Status: ${item.status.replace('_', ' ')} | Potential Severity: ${item.potentialSeverity || item.severity}`;
      currentY = addWrappedText(statusSeverity, currentY, 10, contentWidth, 1.1);
      
      // Evidence (if present)
      if (item.evidence && item.evidence.trim()) {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        currentY = addWrappedText('Evidence:', currentY, 10, contentWidth, 1.1);
        pdf.setFont('helvetica', 'normal');
        
        // Ensure evidence is properly quoted
        let evidenceText = item.evidence.trim();
        if (evidenceText && !evidenceText.startsWith('"') && !evidenceText.endsWith('"')) {
          evidenceText = `"${evidenceText}"`;
        }
        
        currentY = addWrappedText(evidenceText, currentY, 10, contentWidth - 10, 1.1);
      }
      
      // Why it matters
      if (item.whyItMatters && item.whyItMatters.trim()) {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        currentY = addWrappedText('Why it matters:', currentY, 10, contentWidth, 1.1);
        pdf.setFont('helvetica', 'normal');
        currentY = addWrappedText(item.whyItMatters, currentY, 10, contentWidth - 10, 1.1);
      }
      
      // Add spacing between items
      currentY += 5;
    });

    return currentY;
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

  // E) Key Details (Combined section)
  if (full.obligations.length > 0 || full.paymentsAndCosts.length > 0 || full.renewalAndTermination.length > 0) {
    yPosition = addSectionHeading('Key Details', yPosition);
    
    if (full.obligations.length > 0) {
      yPosition = addSubsectionHeading('Obligations', yPosition);
      yPosition = addBulletList(full.obligations, yPosition);
    }
    
    if (full.paymentsAndCosts.length > 0) {
      yPosition = addSubsectionHeading('Payments and Costs', yPosition);
      yPosition = addBulletList(full.paymentsAndCosts, yPosition);
    }
    
    if (full.renewalAndTermination.length > 0) {
      yPosition = addSubsectionHeading('Renewal and Termination', yPosition);
      yPosition = addBulletList(full.renewalAndTermination, yPosition);
    }
    
    yPosition = addSectionDivider(yPosition);
  }

  // F) Risk Coverage
  if (full.riskCoverage && full.riskCoverage.matrix && full.riskCoverage.matrix.length > 0) {
    yPosition = addSectionHeading('Risk Coverage', yPosition);
    yPosition = addRiskCoverage(full.riskCoverage, yPosition);
    yPosition = addSectionDivider(yPosition);
  }

  // G) Liability and Risks
  yPosition = addSectionHeading('Liability and Risks', yPosition);
  yPosition = addDetailedRisks(full.liabilityAndRisks, yPosition);
  yPosition = addSectionDivider(yPosition);

  // H) Professional Advice Note
  yPosition = addSectionHeading('Professional Advice Note', yPosition);
  pdf.setFont('helvetica', 'italic');
  yPosition = addContentText(full.professionalAdviceNote, yPosition);
  pdf.setFont('helvetica', 'normal');
  yPosition = addSectionDivider(yPosition);

  // I) Footer disclaimer - always included
  // Check if we need a new page for the disclaimer
  if (yPosition > pageHeight - margin - 40) {
    pdf.addPage();
    yPosition = margin;
  }
  
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
