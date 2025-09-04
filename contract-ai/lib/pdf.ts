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
    full
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
  let currentPage = 1;
  const maxPages = 2;

  // Helper function to add text with word wrapping and page management
  const addWrappedText = (text: string, y: number, fontSize: number = 12, maxWidth?: number): number => {
    const maxW = maxWidth || contentWidth;
    pdf.setFontSize(fontSize);
    
    const lines = pdf.splitTextToSize(text, maxW);
    
    // Check if we need a new page
    if (y + (lines.length * lineHeight) > pageHeight - margin - 20) {
      if (currentPage >= maxPages) {
        // Truncate with continuation note
        const truncatedText = text.substring(0, Math.floor(text.length * 0.8)) + '... [continued in full report]';
        const truncatedLines = pdf.splitTextToSize(truncatedText, maxW);
        pdf.text(truncatedLines, margin, y);
        return y + (truncatedLines.length * lineHeight);
      }
      
      pdf.addPage();
      currentPage++;
      y = margin;
    }
    
    pdf.text(lines, margin, y);
    return y + (lines.length * lineHeight);
  };

  // Helper function to add section heading with page management
  const addSectionHeading = (text: string, y: number): number => {
    if (y > pageHeight - margin - 30) {
      if (currentPage >= maxPages) {
        return y; // Skip if we're at page limit
      }
      pdf.addPage();
      currentPage++;
      y = margin;
    }
    
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

  // Helper function to add bullet list items
  const addBulletList = (items: string[], y: number, title?: string): number => {
    if (title) {
      y = addSubsectionHeading(title, y);
    }
    
    pdf.setFontSize(11);
    let currentY = y;
    
    items.forEach((item, index) => {
      if (currentY > pageHeight - margin - 20) {
        if (currentPage >= maxPages) {
          // Add continuation note and stop
          currentY = addWrappedText('... [continued in full report]', currentY, 11);
          return currentY;
        }
        pdf.addPage();
        currentPage++;
        currentY = margin;
      }
      
      const bulletText = `• ${item}`;
      currentY = addWrappedText(bulletText, currentY, 11);
      currentY += 3; // Add spacing between items
    });
    
    return currentY;
  };

  // Helper function to add explained terms
  const addExplainedTerms = (terms: Array<{ term: string; meaning: string }>, y: number): number => {
    if (terms.length === 0) return y;
    
    y = addSubsectionHeading('Legal Terms Explained', y);
    pdf.setFontSize(11);
    let currentY = y;
    
    terms.forEach((term, index) => {
      if (currentY > pageHeight - margin - 30) {
        if (currentPage >= maxPages) {
          currentY = addWrappedText('... [continued in full report]', currentY, 11);
          return currentY;
        }
        pdf.addPage();
        currentPage++;
        currentY = margin;
      }
      
      // Term
      pdf.setFont(undefined, 'bold');
      currentY = addWrappedText(`${term.term}:`, currentY, 11);
      pdf.setFont(undefined, 'normal');
      
      // Meaning
      currentY = addWrappedText(term.meaning, currentY, 11);
      currentY += 5; // Add spacing between terms
    });
    
    return currentY;
  };

  // Helper function to add detailed risks
  const addDetailedRisks = (risks: Array<{ title: string; whyItMatters: string; howItAppliesHere: string }>, y: number): number => {
    if (risks.length === 0) return y;
    
    y = addSubsectionHeading('Comprehensive Risk Analysis', y);
    pdf.setFontSize(11);
    let currentY = y;
    
    risks.forEach((risk, index) => {
      if (currentY > pageHeight - margin - 40) {
        if (currentPage >= maxPages) {
          currentY = addWrappedText('... [continued in full report]', currentY, 11);
          return currentY;
        }
        pdf.addPage();
        currentPage++;
        currentY = margin;
      }
      
      // Risk title
      pdf.setFont(undefined, 'bold');
      currentY = addWrappedText(risk.title, currentY, 11);
      pdf.setFont(undefined, 'normal');
      
      // Why it matters
      currentY = addWrappedText(`Why this matters: ${risk.whyItMatters}`, currentY, 11);
      
      // How it applies here
      currentY = addWrappedText(`How it applies here: ${risk.howItAppliesHere}`, currentY, 11);
      currentY += 8; // Add spacing between risks
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

  // Section 1: Extended Summary
  yPosition = addSectionHeading('Extended Summary', yPosition);
  yPosition = addContentText(full.extendedSummary, yPosition);
  yPosition += sectionSpacing;

  // Section 2: Explained Terms
  if (full.explainedTerms.length > 0) {
    yPosition = addExplainedTerms(full.explainedTerms, yPosition);
    yPosition += sectionSpacing;
  }

  // Section 3: Key Details
  yPosition = addSectionHeading('Key Details', yPosition);
  
  if (full.keyDetails.datesMentioned.length > 0) {
    yPosition = addBulletList(full.keyDetails.datesMentioned, yPosition, 'Important Dates');
    yPosition += 5;
  }
  
  if (full.keyDetails.amountsMentioned.length > 0) {
    yPosition = addBulletList(full.keyDetails.amountsMentioned, yPosition, 'Financial Amounts');
    yPosition += 5;
  }
  
  if (full.keyDetails.obligations.length > 0) {
    yPosition = addBulletList(full.keyDetails.obligations, yPosition, 'Your Obligations');
    yPosition += 5;
  }
  
  if (full.keyDetails.terminationOrRenewal.length > 0) {
    yPosition = addBulletList(full.keyDetails.terminationOrRenewal, yPosition, 'Termination & Renewal');
    yPosition += 5;
  }

  yPosition += sectionSpacing;

  // Section 4: Risks
  yPosition = addDetailedRisks(full.risks, yPosition);

  // Professional advice note
  if (full.professionalAdviceNote) {
    yPosition += sectionSpacing;
    yPosition = addSubsectionHeading('Professional Note', yPosition);
    pdf.setFont(undefined, 'italic');
    yPosition = addContentText(full.professionalAdviceNote, yPosition);
    pdf.setFont(undefined, 'normal');
  }

  // Footer disclaimer
  yPosition += sectionSpacing;
  
  // Check if we need a new page for the disclaimer
  if (yPosition > pageHeight - margin - 30) {
    if (currentPage < maxPages) {
      pdf.addPage();
      currentPage++;
      yPosition = margin;
    }
  }
  
  if (currentPage <= maxPages) {
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.setFont(undefined, 'italic');
    yPosition = addWrappedText('This tool provides AI-powered plain-English explanations. It is not legal advice.', yPosition, 10);
    pdf.setFont(undefined, 'normal');
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
