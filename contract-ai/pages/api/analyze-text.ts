import type { NextApiRequest, NextApiResponse } from 'next';
import { summarizeContractFull, sanitizeFullResult, type FullResult } from '../../lib/summarizeContract';

interface AnalyzeTextRequest {
  text: string;
  contractTypeHint?: string;
  email?: string;
  country?: string;
  region?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, contractTypeHint, email, country, region }: AnalyzeTextRequest = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required' });
    }

    if (text.length === 0) {
      return res.status(400).json({ error: 'Text cannot be empty' });
    }

    // Process text - always use full mode
    let fullResult: FullResult | null = null;

    try {
      // Cap text length for analysis
      const cappedText = text.length > 50000 ? text.substring(0, 50000) + '... [truncated]' : text;
      fullResult = await summarizeContractFull(cappedText, { contractTypeHint });

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
        email: email || undefined,
        location: {
          country: country || undefined,
          region: region || undefined
        }
      },
      // Keep full result for backward compatibility
      full: sanitizedFullResult
    });

  } catch (error) {
    console.error('Text analysis error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
