import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import { extractTextFromBuffer } from '../../lib/extractText';
import { summarizeContractFull, sanitizeFullResult, type FullResult } from '../../lib/summarizeContract';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};


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

    // Always use full mode
    const mode = 'full' as const;

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

        // Use full analysis mode
        const cappedText = sanitizedText.length > 50000 ? sanitizedText.substring(0, 50000) + '... [truncated]' : sanitizedText;
        fullResult = await summarizeContractFull(cappedText, { contractTypeHint: intakeContractType });
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

    // Return structured response with detection metadata and buckets
    return res.status(200).json({
      ok: true,
      intakeContractType: sanitizedFullResult.intakeContractType,
      detectedContractType: sanitizedFullResult.detectedContractType,
      finalContractType: sanitizedFullResult.finalContractType,
      buckets: sanitizedFullResult.buckets,
      // Keep additional metadata for backward compatibility
      meta: {
        name: file.originalFilename || 'unknown',
        size: file.size,
        type: file.mimetype,
        mode: mode,
        email: intakeEmail || undefined,
        location: {
          country: intakeCountry || undefined,
          region: intakeRegion || undefined
        }
      },
      // Keep full result for backward compatibility
      full: sanitizedFullResult
    });
  } catch (error) {
    console.error('File upload error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
