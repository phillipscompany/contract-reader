import OpenAI from 'openai';

// Types for Demo (short) analysis
export interface DemoResult {
  summary: string;
  parties: string;
  duration: string;
  risks: string[]; // 3–6 brief, concrete bullets
}

// Types for Full (detailed) analysis
export interface FullResult {
  extendedSummary: string; // 2–3 short paragraphs
  explainedTerms: Array<{ term: string; meaning: string }>; // non-obvious terms only
  keyDetails: {
    datesMentioned: string[]; // normalize to YYYY-MM-DD when possible
    amountsMentioned: string[]; // include currency symbols if present
    obligations: string[]; // specific duties the signer must perform
    terminationOrRenewal: string[]; // notice periods, auto-renew rules, termination conditions
  };
  risks: Array<{
    title: string;
    whyItMatters: string; // general risk rationale
    howItAppliesHere: string; // tie back to THIS document's text
  }>;
  professionalAdviceNote: string; // neutral suggestion to consult a qualified legal professional (no firm names)
}

interface ContractError {
  code: 'RATE_LIMIT' | 'AUTH' | 'TIMEOUT' | 'UNKNOWN';
  message: string;
}

// Shared system guardrails for both functions
const SHARED_SYSTEM_PROMPT = `You are a contract analysis expert. Follow these strict rules:
- Return JSON ONLY matching the schema provided.
- Use ONLY the provided contract text; if unknown, respond "Not specified in the provided text."
- Do NOT include any URLs or links.
- Do NOT name or recommend any law firms, lawyers, or legal services.
- Keep content concise, factual, and plain-English.
- Never include the original contract text in your response.`;

// Helper function to truncate text safely
function truncateText(text: string, maxChars: number = 50000): string {
  if (text.length <= maxChars) return text;
  return text.substring(0, maxChars) + '... [truncated]';
}

// Helper function to sanitize outputs
function sanitizeDemoResult(result: any): DemoResult {
  return {
    summary: (result.summary || 'Not specified in the provided text.').substring(0, 500).trim(),
    parties: (result.parties || 'Not specified in the provided text.').substring(0, 300).trim(),
    duration: (result.duration || 'Not specified in the provided text.').substring(0, 300).trim(),
    risks: Array.isArray(result.risks) 
      ? result.risks.slice(0, 6).map((r: any) => String(r || '').substring(0, 200).trim()).filter(Boolean)
      : ['Not specified in the provided text.']
  };
}

function sanitizeFullResult(result: any): FullResult {
  return {
    extendedSummary: (result.extendedSummary || 'Not specified in the provided text.').substring(0, 1000).trim(),
    explainedTerms: Array.isArray(result.explainedTerms) 
      ? result.explainedTerms.slice(0, 10).map((term: any) => ({
          term: String(term?.term || '').substring(0, 100).trim(),
          meaning: String(term?.meaning || '').substring(0, 300).trim()
        })).filter(t => t.term && t.meaning)
      : [],
    keyDetails: {
      datesMentioned: Array.isArray(result.keyDetails?.datesMentioned) 
        ? result.keyDetails.datesMentioned.slice(0, 10).map((d: any) => String(d || '').substring(0, 50).trim()).filter(Boolean)
        : [],
      amountsMentioned: Array.isArray(result.keyDetails?.amountsMentioned)
        ? result.keyDetails.amountsMentioned.slice(0, 10).map((a: any) => String(a || '').substring(0, 100).trim()).filter(Boolean)
        : [],
      obligations: Array.isArray(result.keyDetails?.obligations)
        ? result.keyDetails.obligations.slice(0, 15).map((o: any) => String(o || '').substring(0, 200).trim()).filter(Boolean)
        : [],
      terminationOrRenewal: Array.isArray(result.keyDetails?.terminationOrRenewal)
        ? result.keyDetails.terminationOrRenewal.slice(0, 10).map((t: any) => String(t || '').substring(0, 200).trim()).filter(Boolean)
        : []
    },
    risks: Array.isArray(result.risks)
      ? result.risks.slice(0, 8).map((risk: any) => ({
          title: String(risk?.title || '').substring(0, 150).trim(),
          whyItMatters: String(risk?.whyItMatters || '').substring(0, 300).trim(),
          howItAppliesHere: String(risk?.howItAppliesHere || '').substring(0, 400).trim()
        })).filter(r => r.title && r.whyItMatters && r.howItAppliesHere)
      : [],
    professionalAdviceNote: (result.professionalAdviceNote || 'This analysis is for informational purposes only. Consider consulting with a qualified legal professional for specific legal advice.').substring(0, 500).trim()
  };
}

// Helper function to make OpenAI API call with retry logic
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

// Helper function to parse JSON with retry logic
function parseJSONWithRetry(responseText: string, isRetry: boolean = false): any {
  try {
    return JSON.parse(responseText);
  } catch (error) {
    if (!isRetry) {
      // Retry once with stricter instruction
      throw new Error('JSON_PARSE_RETRY');
    }
    throw new Error('Invalid JSON response from OpenAI API');
  }
}

// Demo function - fast, light preview
export async function summarizeContractDemo(text: string): Promise<DemoResult> {
  const truncatedText = truncateText(text, 25000); // Smaller limit for demo
  
  const prompt = `Analyze the following contract text and provide a brief summary. Return ONLY valid JSON with this exact structure:

{
  "summary": "Brief explanation of what this contract is about (4-5 sentences)",
  "parties": "Who is involved in this contract (1-2 sentences)",
  "duration": "Length of contract or renewal terms (2-3 sentences)",
  "risks": ["3-6 brief, concrete risk points", "focus on fees, auto-renewals", "restrictions, penalties"]
}

Contract text to analyze:
${truncatedText}

Return ONLY the JSON object, no additional text.`;

  try {
    const responseText = await makeOpenAICall([
      { role: "system", content: SHARED_SYSTEM_PROMPT },
      { role: "user", content: prompt }
    ], 800);

    const result = parseJSONWithRetry(responseText);
    return sanitizeDemoResult(result);
    
  } catch (error: any) {
    if (error.message === 'JSON_PARSE_RETRY') {
      // Retry with stricter instruction
      try {
        const retryPrompt = `Return valid JSON exactly matching this schema - no extra text:

{
  "summary": "Brief explanation of what this contract is about",
  "parties": "Who is involved in this contract", 
  "duration": "Length of contract or renewal terms",
  "risks": ["risk1", "risk2", "risk3"]
}

Contract text: ${truncatedText}`;

        const retryResponse = await makeOpenAICall([
          { role: "system", content: SHARED_SYSTEM_PROMPT + " Return ONLY valid JSON matching the exact schema." },
          { role: "user", content: retryPrompt }
        ], 600);

        const retryResult = parseJSONWithRetry(retryResponse, true);
        return sanitizeDemoResult(retryResult);
      } catch (retryError: any) {
        console.log({ scope: "openai", code: "JSON_PARSE_FAILED", httpStatus: "parse_error", tokenCount: truncatedText.length });
        throw { code: "UNKNOWN", message: "We couldn't complete the analysis right now. Please try again." };
      }
    }

    // Handle other OpenAI API errors
    if (error?.status === 429) {
      console.log({ scope: "openai", code: "RATE_LIMIT", httpStatus: 429, tokenCount: truncatedText.length });
      throw { code: "RATE_LIMIT", message: "Too many requests — please try again in a minute." };
    }
    
    if (error?.status === 401 || error?.status === 403) {
      console.log({ scope: "openai", code: "AUTH", httpStatus: error.status, tokenCount: truncatedText.length });
      throw { code: "AUTH", message: "API authorization failed. Please try again later." };
    }
    
    if (error?.status === 408 || error?.status === 504 || error?.name === 'AbortError') {
      console.log({ scope: "openai", code: "TIMEOUT", httpStatus: error.status || 'timeout', tokenCount: truncatedText.length });
      throw { code: "TIMEOUT", message: "The analysis is taking too long. Please retry." };
    }
    
    console.log({ scope: "openai", code: "UNKNOWN", httpStatus: error?.status || "unknown", tokenCount: truncatedText.length });
    throw { code: "UNKNOWN", message: "We couldn't complete the analysis right now. Please try again." };
  }
}

// Full function - deep, structured analysis suitable for 2-page PDF
export async function summarizeContractFull(text: string): Promise<FullResult> {
  const truncatedText = truncateText(text, 50000); // Larger limit for full analysis
  
  const prompt = `Analyze the following contract text and provide a comprehensive analysis. Return ONLY valid JSON with this exact structure:

{
  "extendedSummary": "2-3 short paragraphs explaining what this contract is about, key terms, and overall purpose",
  "explainedTerms": [
    {"term": "legal term", "meaning": "plain English explanation"},
    {"term": "another term", "meaning": "what it means in context"}
  ],
  "keyDetails": {
    "datesMentioned": ["YYYY-MM-DD format when possible", "other date references"],
    "amountsMentioned": ["$100", "€500", "other amounts with currency"],
    "obligations": ["specific duty 1", "specific duty 2", "what signer must do"],
    "terminationOrRenewal": ["30 days notice", "auto-renewal clause", "termination conditions"]
  },
  "risks": [
    {
      "title": "Risk title",
      "whyItMatters": "General explanation of why this type of risk matters",
      "howItAppliesHere": "Specific application to THIS contract's text"
    }
  ],
  "professionalAdviceNote": "Neutral suggestion to consult qualified legal professional (no firm names)"
}

Contract text to analyze:
${truncatedText}

Return ONLY the JSON object, no additional text.`;

  try {
    const responseText = await makeOpenAICall([
      { role: "system", content: SHARED_SYSTEM_PROMPT },
      { role: "user", content: prompt }
    ], 2000);

    const result = parseJSONWithRetry(responseText);
    return sanitizeFullResult(result);
    
  } catch (error: any) {
    if (error.message === 'JSON_PARSE_RETRY') {
      // Retry with stricter instruction
      try {
        const retryPrompt = `Return valid JSON exactly matching this schema - no extra text:

{
  "extendedSummary": "2-3 paragraphs about the contract",
  "explainedTerms": [{"term": "term1", "meaning": "meaning1"}],
  "keyDetails": {
    "datesMentioned": ["date1"],
    "amountsMentioned": ["amount1"],
    "obligations": ["obligation1"],
    "terminationOrRenewal": ["term1"]
  },
  "risks": [{"title": "title1", "whyItMatters": "why1", "howItAppliesHere": "how1"}],
  "professionalAdviceNote": "advice note"
}

Contract text: ${truncatedText}`;

        const retryResponse = await makeOpenAICall([
          { role: "system", content: SHARED_SYSTEM_PROMPT + " Return ONLY valid JSON matching the exact schema." },
          { role: "user", content: retryPrompt }
        ], 1500);

        const retryResult = parseJSONWithRetry(retryResponse, true);
        return sanitizeFullResult(retryResult);
      } catch (retryError: any) {
        console.log({ scope: "openai", code: "JSON_PARSE_FAILED", httpStatus: "parse_error", tokenCount: truncatedText.length });
        throw { code: "UNKNOWN", message: "We couldn't complete the analysis right now. Please try again." };
      }
    }

    // Handle other OpenAI API errors
    if (error?.status === 429) {
      console.log({ scope: "openai", code: "RATE_LIMIT", httpStatus: 429, tokenCount: truncatedText.length });
      throw { code: "RATE_LIMIT", message: "Too many requests — please try again in a minute." };
    }
    
    if (error?.status === 401 || error?.status === 403) {
      console.log({ scope: "openai", code: "AUTH", httpStatus: error.status, tokenCount: truncatedText.length });
      throw { code: "AUTH", message: "API authorization failed. Please try again later." };
    }
    
    if (error?.status === 408 || error?.status === 504 || error?.name === 'AbortError') {
      console.log({ scope: "openai", code: "TIMEOUT", httpStatus: error.status || 'timeout', tokenCount: truncatedText.length });
      throw { code: "TIMEOUT", message: "The analysis is taking too long. Please retry." };
    }
    
    console.log({ scope: "openai", code: "UNKNOWN", httpStatus: error?.status || "unknown", tokenCount: truncatedText.length });
    throw { code: "UNKNOWN", message: "We couldn't complete the analysis right now. Please try again." };
  }
}

// Legacy function - keeping for backward compatibility
export async function summarizeContract(text: string): Promise<DemoResult> {
  return summarizeContractDemo(text);
}
