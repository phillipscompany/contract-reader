import OpenAI from 'openai';

// Types for Demo (short) analysis
export interface DemoResult {
  summary: string;
  parties: string;
  duration: string;
  risks: string[]; // 3–6 brief, concrete bullets
}

// Types for Full (detailed) analysis - Lawyer's Memo Style
export interface FullResult {
  executiveSummary: string; // 2–3 paragraphs like a lawyer's note
  partiesAndPurpose: string; // Who is involved and why
  keyClauses: Array<{ clause: string, explanation: string }>; // Each important clause explained
  obligations: string[]; // Duties user must fulfill
  paymentsAndCosts: string[]; // Amounts, penalties, timing
  renewalAndTermination: string[]; // Renewal/termination rules
  liabilityAndRisks: Array<{
    clause: string,
    whyItMatters: string,
    howItAffectsYou: string
  }>; // Each risk with context
  recommendations: string[]; // Practical steps: clarify, renegotiate, ask
  professionalAdviceNote: string; // Reminder to seek legal counsel
}

interface ContractError {
  code: 'RATE_LIMIT' | 'AUTH' | 'TIMEOUT' | 'UNKNOWN';
  message: string;
}

// Shared system guardrails for both functions
const SHARED_SYSTEM_PROMPT = `You are an experienced contracts lawyer. Your job is to explain contracts in plain English, highlighting obligations, risks, and practical steps. Do not give jurisdiction-specific legal advice. Do not include any URLs or law firm names. Output valid JSON only, exactly matching the provided schema. Follow these strict rules:
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
    executiveSummary: (result.executiveSummary || 'Not specified in the provided text.').substring(0, 1200).trim(),
    partiesAndPurpose: (result.partiesAndPurpose || 'Not specified in the provided text.').substring(0, 800).trim(),
    keyClauses: Array.isArray(result.keyClauses) 
      ? result.keyClauses.slice(0, 12).map((clause: any) => ({
          clause: String(clause?.clause || '').substring(0, 150).trim(),
          explanation: String(clause?.explanation || '').substring(0, 400).trim()
        })).filter(c => c.clause && c.explanation)
      : [],
    obligations: Array.isArray(result.obligations)
      ? result.obligations.slice(0, 15).map((o: any) => String(o || '').substring(0, 250).trim()).filter(Boolean)
      : [],
    paymentsAndCosts: Array.isArray(result.paymentsAndCosts)
      ? result.paymentsAndCosts.slice(0, 12).map((p: any) => String(p || '').substring(0, 200).trim()).filter(Boolean)
      : [],
    renewalAndTermination: Array.isArray(result.renewalAndTermination)
      ? result.renewalAndTermination.slice(0, 10).map((r: any) => String(r || '').substring(0, 250).trim()).filter(Boolean)
      : [],
    liabilityAndRisks: Array.isArray(result.liabilityAndRisks)
      ? result.liabilityAndRisks.slice(0, 8).map((risk: any) => ({
          clause: String(risk?.clause || '').substring(0, 150).trim(),
          whyItMatters: String(risk?.whyItMatters || '').substring(0, 300).trim(),
          howItAffectsYou: String(risk?.howItAffectsYou || '').substring(0, 300).trim()
        })).filter(r => r.clause && r.whyItMatters && r.howItAffectsYou)
      : [],
    recommendations: Array.isArray(result.recommendations)
      ? result.recommendations.slice(0, 10).map((r: any) => String(r || '').substring(0, 200).trim()).filter(Boolean)
      : [],
    professionalAdviceNote: (result.professionalAdviceNote || 'This tool provides AI-powered plain-English explanations. It is not legal advice.').substring(0, 500).trim()
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

// Full function - lawyer's memo style analysis
export async function summarizeContractFull(text: string): Promise<FullResult> {
  const truncatedText = truncateText(text, 50000); // Larger limit for full analysis
  
  const prompt = `Analyze the following contract text and provide a structured legal memo-style analysis. Return ONLY valid JSON with this exact structure:

{
  "executiveSummary": "2-3 paragraphs like a lawyer's note summarizing the contract's purpose, key terms, and overall implications",
  "partiesAndPurpose": "Clear explanation of who is involved in this contract and what the main purpose is",
  "keyClauses": [
    {"clause": "Important clause name", "explanation": "Plain English explanation of what this clause means and its implications"},
    {"clause": "Another clause", "explanation": "What this clause does and why it matters"}
  ],
  "obligations": ["Specific duty 1 that the signer must fulfill", "Specific duty 2", "Other obligations"],
  "paymentsAndCosts": ["Payment amounts and timing", "Penalties or fees", "Cost structures"],
  "renewalAndTermination": ["Renewal terms and conditions", "Termination procedures", "Notice requirements"],
  "liabilityAndRisks": [
    {
      "clause": "Specific clause or section creating risk",
      "whyItMatters": "Why this type of risk is significant in contracts",
      "howItAffectsYou": "How this specific risk affects the signer in this contract"
    }
  ],
  "recommendations": ["Practical step 1: clarify or renegotiate", "Question to ask", "Thing to watch out for"],
  "professionalAdviceNote": "Reminder to seek qualified legal counsel for specific advice"
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
  "executiveSummary": "2-3 paragraphs like a lawyer's note",
  "partiesAndPurpose": "who is involved and why",
  "keyClauses": [{"clause": "clause1", "explanation": "explanation1"}],
  "obligations": ["obligation1", "obligation2"],
  "paymentsAndCosts": ["payment1", "cost1"],
  "renewalAndTermination": ["renewal1", "termination1"],
  "liabilityAndRisks": [{"clause": "clause1", "whyItMatters": "why1", "howItAffectsYou": "how1"}],
  "recommendations": ["recommendation1", "recommendation2"],
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
