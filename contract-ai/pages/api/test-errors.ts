import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { errorType } = req.query;

  switch (errorType) {
    case 'rate-limit':
      return res.status(429).json({ 
        error: { 
          code: 'RATE_LIMIT', 
          message: 'Too many requests' 
        } 
      });
    
    case 'timeout':
      return res.status(504).json({ 
        error: { 
          code: 'TIMEOUT', 
          message: 'Request timeout' 
        } 
      });
    
    case 'auth':
      return res.status(401).json({ 
        error: { 
          code: 'AUTH', 
          message: 'Unauthorized' 
        } 
      });
    
    case 'success':
      return res.status(200).json({ 
        message: 'Success after retries!',
        timestamp: new Date().toISOString()
      });
    
    default:
      return res.status(400).json({ 
        error: { 
          code: 'UNKNOWN', 
          message: 'Invalid error type. Use: rate-limit, timeout, auth, or success' 
        } 
      });
  }
}
