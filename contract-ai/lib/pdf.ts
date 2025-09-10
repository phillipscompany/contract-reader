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
  let subtitle = `Analysed on: ${analyzedAt}`;
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

  // Helper function to add continuous table with repeating headers
  const addContinuousTable = (headers: string[], rows: string[][], y: number, columnWidths: number[]): number => {
    const tableWidth = columnWidths.reduce((sum, width) => sum + width, 0);
    const startX = margin; // Left-align table instead of centering
    
    let currentY = y;
    const cellPaddingV = 8; // Vertical padding (6-8pt as specified)
    const cellPaddingH = 10; // Horizontal padding (8-10pt as specified)
    const headerHeight = 14;
    const lineHeight = 4.5;
    
    // Helper function to draw header row
    const drawHeader = (yPos: number) => {
      // Draw header background - slightly darker grey
      pdf.setFillColor(240, 240, 240);
      pdf.rect(startX, yPos - headerHeight + 2, tableWidth, headerHeight, 'F');
      
      // Draw header text with bold font
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      let xPos = startX;
      headers.forEach((header, index) => {
        const maxWidth = columnWidths[index] - (cellPaddingH * 2);
        const lines = pdf.splitTextToSize(header, maxWidth);
        lines.forEach((line, lineIndex) => {
          pdf.text(line, xPos + cellPaddingH, yPos + (lineIndex * lineHeight));
        });
        xPos += columnWidths[index];
      });
      return yPos + 2;
    };
    
    // Draw initial header
    currentY = drawHeader(currentY);
    
    // Process all rows in a single continuous table
    rows.forEach((row, rowIndex) => {
      // Calculate row height first - ensure all text fits within cell bounds
      let maxLinesInRow = 1;
      row.forEach((cell, cellIndex) => {
        const maxWidth = columnWidths[cellIndex] - (cellPaddingH * 2);
        const lines = pdf.splitTextToSize(cell, maxWidth);
        maxLinesInRow = Math.max(maxLinesInRow, lines.length);
      });
      
      const rowHeight = Math.max(10, maxLinesInRow * lineHeight + cellPaddingV);
      
      // Check if we need a new page (allow splitting to avoid large gaps)
      if (currentY + rowHeight > pageHeight - margin - 15) {
        pdf.addPage();
        currentY = margin;
        
        // Redraw header on new page
        currentY = drawHeader(currentY);
      }
      
      // Zebra striping with very light grey on even rows
      if (rowIndex % 2 === 1) {
        pdf.setFillColor(248, 248, 248);
        pdf.rect(startX, currentY - rowHeight + 2, tableWidth, rowHeight, 'F');
      }
      
      // Draw row text with smaller font (1pt smaller than body text)
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      let xPos = startX;
      
      row.forEach((cell, cellIndex) => {
        // Split long text to fit in column - clamp to cell bounds
        const maxWidth = columnWidths[cellIndex] - (cellPaddingH * 2);
        const lines = pdf.splitTextToSize(cell, maxWidth);
        
        // Draw all lines for this cell - ensure no overflow
        lines.forEach((line, lineIndex) => {
          // Clamp drawing area to cell bounds
          const textX = xPos + cellPaddingH;
          const textY = currentY + (lineIndex * lineHeight);
          pdf.text(line, textX, textY);
        });
        
        xPos += columnWidths[cellIndex];
      });
      
      currentY += rowHeight;
    });
    
    return currentY + 3; // Reduced spacing after table
  };

  // Helper function to add risk coverage with polished design
  const addRiskCoverage = (coverage: FullResult['riskCoverage'], y: number): number => {
    if (!coverage || !coverage.matrix || coverage.matrix.length === 0) {
      return y;
    }

    let currentY = y;

    // A) Risk Coverage Summary Table - single continuous table with proper column widths
    const headers = ['Category', 'Status', 'Potential Severity'];
    
    // Calculate table width and column widths as specified
    const tableWidth = contentWidth; // Use full content width
    const categoryWidth = tableWidth * 0.5; // 50% of table width
    const statusWidth = tableWidth * 0.25; // 25% of table width  
    const severityWidth = tableWidth * 0.25; // 25% of table width
    const columnWidths = [categoryWidth, statusWidth, severityWidth];
    
    // Prepare table data with status mapping and non-breaking spaces
    const tableRows: string[][] = [];
    
    // Sort so "Not mentioned" items appear after "Mentioned" items
    const sortedMatrix = [...coverage.matrix].sort((a, b) => {
      const aMentioned = a.status !== 'not_mentioned';
      const bMentioned = b.status !== 'not_mentioned';
      if (aMentioned === bMentioned) return 0;
      return aMentioned ? -1 : 1;
    });
    
    sortedMatrix.forEach((item) => {
      // Map status for PDF with non-breaking space to prevent line breaks
      const mappedStatus = item.status === 'not_mentioned' ? 'Not\u00A0mentioned' : 'Mentioned';
      
      // Capitalize first letter of severity
      const severity = (item.potentialSeverity || item.severity || 'medium').charAt(0).toUpperCase() + 
                      (item.potentialSeverity || item.severity || 'medium').slice(1);
      
      tableRows.push([
        item.category,
        mappedStatus,
        severity
      ]);
    });
    
    currentY = addContinuousTable(headers, tableRows, currentY, columnWidths);
    
    // B) Things we couldn't find in your contract (renamed section)
    const notMentionedItems = coverage.matrix.filter(item => item.status === 'not_mentioned');
    
    if (notMentionedItems.length > 0) {
      currentY = addSubsectionHeading('Things we couldn\'t find in your contract', currentY);
      
      notMentionedItems.forEach((item, index) => {
        // Smart pagination - allow notes to flow across pages to avoid large gaps
        if (currentY > pageHeight - margin - 30) {
          pdf.addPage();
          currentY = margin;
        }
        
        // Title with severity - cleaner format
        const severity = (item.potentialSeverity || item.severity || 'medium').charAt(0).toUpperCase() + 
                        (item.potentialSeverity || item.severity || 'medium').slice(1);
        const title = `${item.category} — Potential severity: ${severity}`;
        
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        currentY = addWrappedText(title, currentY, 11, contentWidth, 1.15);
        
        // Why it matters - short paragraph (2-3 sentences max) - ONLY this section
        if (item.whyItMatters && item.whyItMatters.trim()) {
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(10);
          let whyItMattersText = item.whyItMatters.trim();
          
          // Soft trim by sentence count (don't truncate mid-sentence)
          const sentences = whyItMattersText.split(/[.!?]+/).filter(s => s.trim());
          if (sentences.length > 3) {
            whyItMattersText = sentences.slice(0, 3).join('. ') + '.';
          }
          
          currentY = addWrappedText(whyItMattersText, currentY, 10, contentWidth, 1.1);
        }
        
        // Tightened vertical rhythm - smaller spacing between notes
        currentY += 6;
      });
    }

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
  metaLines.push(`Analysed: ${analyzedAt}`);
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
