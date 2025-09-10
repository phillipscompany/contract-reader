import OpenAI from 'openai';

// Helper function to make OpenAI API call
async function makeOpenAICall(messages: any[], maxTokens: number): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
    temperature: 0.3,
    max_tokens: maxTokens,
  });

  const responseText = completion.choices[0]?.message?.content;
  if (!responseText) {
    throw new Error('No response from OpenAI API');
  }

  return responseText;
}

/**
 * Simplifies text to secondary school reading level while preserving all facts, dates, and numbers
 * @param text - The text to simplify
 * @returns Promise<string> - The simplified text
 */
export async function simplifyToSchoolEnglish(text: string): Promise<string> {
  if (!text || text.trim().length <= 20) {
    return text; // Skip very short text to save API calls
  }

  const prompt = `Rewrite the following text in simple British English at a secondary school reading level. Keep all facts, dates, and numbers exactly. Use short sentences and clear words. Replace legal jargon with everyday language.

Original text:
${text}

Simplified text:`;

  try {
    const responseText = await makeOpenAICall([
      { 
        role: "system", 
        content: "You are a text simplification expert. Rewrite complex text in simple, clear English while keeping all important information exactly the same. Use short sentences and everyday words instead of formal or legal language." 
      },
      { role: "user", content: prompt }
    ], 500);

    return responseText.trim();
  } catch (error) {
    console.error('Text simplification failed:', error);
    // Return original text if simplification fails
    return text;
  }
}

/**
 * Simplifies multiple text fields in parallel for efficiency
 * @param texts - Array of text strings to simplify
 * @returns Promise<string[]> - Array of simplified texts in the same order
 */
export async function simplifyMultipleTexts(texts: string[]): Promise<string[]> {
  if (!texts || texts.length === 0) {
    return texts;
  }

  // Filter out short texts and create promises for the rest
  const promises = texts.map(async (text, index) => {
    if (!text || text.trim().length <= 20) {
      return { index, text };
    }
    
    try {
      const simplified = await simplifyToSchoolEnglish(text);
      return { index, text: simplified };
    } catch (error) {
      console.error(`Failed to simplify text at index ${index}:`, error);
      return { index, text }; // Return original on error
    }
  });

  // Wait for all simplifications to complete
  const results = await Promise.all(promises);
  
  // Sort by original index and extract texts
  return results
    .sort((a, b) => a.index - b.index)
    .map(result => result.text);
}
