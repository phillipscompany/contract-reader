import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import { extractTextFromBuffer } from '../../lib/extractText';
import { summarizeContractDemo, summarizeContractFull, sanitizeFullResult, type DemoResult, type FullResult } from '../../lib/summarizeContract';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper function to extract first page text for demo mode
function extractFirstPageText(text: string, fileType: string): string {
  if (fileType === 'application/pdf') {
    // For PDFs, try to extract first page by looking for page breaks
    // This is a simple heuristic - split by common page break indicators
    const lines = text.split('\n');
    const firstPageLines = lines.slice(0, Math.min(50, lines.length)); // First 50 lines as approximation
    return firstPageLines.join('\n');
  } else {
    // For DOCX, use first N characters as approximation of first page
    const firstPageChars = Math.min(3000, text.length);
    return text.substring(0, firstPageChars);
  }
}

// Helper function to sanitize text content (remove links and law firm names)
function sanitizeText(text: string): string {
  // Remove URLs
  text = text.replace(/https?:\/\/[^\s]+/g, '[URL removed]');
  text = text.replace(/www\.[^\s]+/g, '[URL removed]');
  
  // Remove email addresses
  text = text.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[email removed]');
  
  // Remove common law firm patterns (case insensitive)
  text = text.replace(/\b[A-Z][a-z]+ & [A-Z][a-z]+ (LLP|LLC|P\.?C\.?|Inc\.?|Corp\.?)\b/gi, '[law firm removed]');
  text = text.replace(/\b[A-Z][a-z]+ [A-Z][a-z]+ (LLP|LLC|P\.?C\.?|Inc\.?|Corp\.?)\b/gi, '[law firm removed]');
  text = text.replace(/\b[A-Z][a-z]+ (LLP|LLC|P\.?C\.?|Inc\.?|Corp\.?)\b/gi, '[law firm removed]');
  
  return text;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const form = formidable({
      maxFileSize: 5 * 1024 * 1024, // 5MB
      keepExtensions: true,
    });

    const [fields, files] = await form.parse(req);
    
    if (!files.file || !Array.isArray(files.file) || files.file.length === 0) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = files.file[0];
    
    // Check file size
    if (file.size > 5 * 1024 * 1024) {
      return res.status(400).json({ error: 'File too large' });
    }
    
    // Validate file type
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.mimetype || '')) {
      return res.status(400).json({ error: 'Invalid file type' });
    }

    // Always use full mode for now (demo mode commented out for future payment integration)
    const mode = 'full' as const;
    // const mode = (fields.mode?.[0] || req.query.mode || 'demo') as 'demo' | 'full';
    // if (mode !== 'demo' && mode !== 'full') {
    //   return res.status(400).json({ error: 'Invalid mode. Use "demo" or "full".' });
    // }

    // Parse intake data from form fields (do not log or store)
    const intakeEmail = fields.intakeEmail?.[0] || '';
    const intakeCountry = fields.intakeCountry?.[0] || '';
    const intakeRegion = fields.intakeRegion?.[0] || '';
    const intakeContractType = fields.intakeContractType?.[0] || '';

    // Extract text for PDF and DOCX files
    let extractedText = '';
    if (file.mimetype === 'application/pdf' || file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      try {
        const buffer = fs.readFileSync(file.filepath);
        const fullText = await extractTextFromBuffer(buffer, file.originalFilename || '');
        extractedText = fullText;
      } catch (error) {
        return res.status(500).json({ error: 'Failed to extract text' });
      }
    }

    // Process text - always use full mode
    let fullResult: FullResult | null = null;

    if (extractedText) {
      try {
        // Sanitize text to remove links and law firm names
        const sanitizedText = sanitizeText(extractedText);

        // Always use full analysis mode
        const cappedText = sanitizedText.length > 50000 ? sanitizedText.substring(0, 50000) + '... [truncated]' : sanitizedText;
        fullResult = await summarizeContractFull(cappedText, { contractTypeHint: intakeContractType });

        // Demo mode logic commented out for future payment integration
        // if (mode === 'demo') {
        //   // For demo mode, use first page text
        //   const firstPageText = extractFirstPageText(sanitizedText, file.mimetype || '');
        //   demoResult = await summarizeContractDemo(firstPageText);
        // } else {
        //   // For full mode, use capped full text
        //   const cappedText = sanitizedText.length > 50000 ? sanitizedText.substring(0, 50000) + '... [truncated]' : sanitizedText;
        //   fullResult = await summarizeContractFull(cappedText);
        // }
      } catch (error: any) {
        // Handle standardized errors from summarization functions
        if (error.code && error.message) {
          let statusCode = 500;
          
          switch (error.code) {
            case 'RATE_LIMIT':
              statusCode = 429;
              break;
            case 'AUTH':
              statusCode = 401;
              break;
            case 'TIMEOUT':
              statusCode = 504;
              break;
            default:
              statusCode = 500;
          }
          
          return res.status(statusCode).json({ 
            error: { 
              code: error.code, 
              message: error.message 
            } 
          });
        }
        
        // Fallback for unexpected errors
        return res.status(500).json({ 
          error: { 
            code: 'UNKNOWN', 
            message: 'We couldn\'t complete the analysis right now. Please try again.' 
          } 
        });
      }
    }

    // Sanitize response to remove any unexpected keys that might have been added by the model
    const sanitizedFullResult = sanitizeFullResult(fullResult);

    // Return unified response shape - only full mode
    return res.status(200).json({
      name: file.originalFilename || 'unknown',
      size: file.size,
      type: file.mimetype,
      mode: mode,
      full: sanitizedFullResult,
      meta: {
        email: intakeEmail || undefined,
        location: {
          country: intakeCountry || undefined,
          region: intakeRegion || undefined
        },
        contractType: intakeContractType || undefined,
        intakeContractType: intakeContractType || undefined,
        detectedContractType: sanitizedFullResult.detectedContractType || undefined,
        finalContractType: sanitizedFullResult.finalContractType || undefined,
        // Note: pages count could be added here if needed in the future
      },
    });
  } catch (error) {
    console.error('File upload error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
