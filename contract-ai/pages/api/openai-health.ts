import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if API key is available
    if (!process.env.OPENAI_API_KEY) {
      return res.status(200).json({ 
        ok: false, 
        error: 'OpenAI API key not configured' 
      });
    }

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Make a minimal test call
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: "Hello"
        }
      ],
      max_tokens: 5,
    });

    // Check if we got a valid response
    if (completion.choices[0]?.message?.content) {
      return res.status(200).json({ ok: true });
    } else {
      return res.status(200).json({ 
        ok: false, 
        error: 'No response from OpenAI API' 
      });
    }

  } catch (error) {
    // Handle different types of errors
    if (error instanceof Error) {
      if (error.message.includes('401') || error.message.includes('authentication')) {
        return res.status(200).json({ 
          ok: false, 
          error: 'Invalid OpenAI API key' 
        });
      } else if (error.message.includes('429')) {
        return res.status(200).json({ 
          ok: false, 
          error: 'OpenAI API rate limit exceeded' 
        });
      } else {
        return res.status(200).json({ 
          ok: false, 
          error: `OpenAI API error: ${error.message}` 
        });
      }
    }
    
    return res.status(200).json({ 
      ok: false, 
      error: 'Unknown error occurred' 
    });
  }
}
