import jsPDF from 'jspdf';

interface DownloadResultsPdfOptions {
  siteTitle: string;
  sourceFilename?: string;
  summary: string;
  parties?: string;
  duration?: string;
  risks: string[];
  analyzedAt?: string;
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
