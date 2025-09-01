import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import { extractTextFromBuffer } from '../../lib/extractText';
import { summarizeContract } from '../../lib/summarizeContract';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

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

    // Summarize the contract using AI
    let summary = null;
    if (extractedText) {
      try {
        summary = await summarizeContract(extractedText);
      } catch (error) {
        return res.status(500).json({ error: 'Failed to summarize contract' });
      }
    }

    return res.status(200).json({
      name: file.originalFilename || 'unknown',
      size: file.size,
      type: file.mimetype,
      ...summary,
    });
  } catch (error) {
    console.error('File upload error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
