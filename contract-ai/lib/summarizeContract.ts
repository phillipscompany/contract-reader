import OpenAI from 'openai';

interface ContractSummary {
  summary: string;
  parties: string;
  duration: string;
  risks: string[];
}

export async function summarizeContract(text: string): Promise<ContractSummary> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const prompt = `Analyze the following contract text and provide a structured summary. Return ONLY valid JSON with the following structure:

{
  "summary": "Plain-English explanation of what this contract is about",
  "parties": "Who is involved in this contract",
  "duration": "Length of contract or renewal terms",
  "risks": ["List of key risks such as unusual fees", "auto-renewals", "restrictions", "penalties", "obligations"]
}

Contract text to analyze:
${text}

Remember: Return ONLY the JSON object, no additional text or explanations.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a contract analysis expert. Analyze contracts and return structured JSON summaries. Never include the original contract text in your response."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    const responseText = completion.choices[0]?.message?.content;
    
    if (!responseText) {
      throw new Error('No response from OpenAI API');
    }

    // Parse the JSON response
    const summary = JSON.parse(responseText) as ContractSummary;
    
    // Validate the response structure
    if (!summary.summary || !summary.parties || !summary.duration || !Array.isArray(summary.risks)) {
      throw new Error('Invalid response structure from OpenAI API');
    }

    return summary;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Failed to parse OpenAI API response');
    }
    throw new Error('Failed to analyze contract with OpenAI API');
  }
}
