import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import { extractTextFromBuffer } from '../../lib/extractText';
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

    if (!extractedText) {
      return res.status(400).json({ error: 'No text could be extracted from the file' });
    }

    // Sanitize text to remove links and law firm names
    const sanitizedText = sanitizeText(extractedText);

    // Return the extracted and sanitized text
    return res.status(200).json({
      success: true,
      text: sanitizedText,
      originalLength: extractedText.length,
      sanitizedLength: sanitizedText.length,
      filename: file.originalFilename || 'unknown',
      fileSize: file.size,
      fileType: file.mimetype
    });

  } catch (error) {
    console.error('Text extraction error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
