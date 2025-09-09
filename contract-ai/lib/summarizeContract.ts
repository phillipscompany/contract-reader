import OpenAI from 'openai';
import { loadRiskCategories, type RiskCategory } from './riskTaxonomy';

// Risk coverage types
export type CoverageStatus = "present_favourable" | "present_unfavourable" | "ambiguous" | "not_mentioned";
export type PotentialSeverity = "high" | "medium" | "low";

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
  professionalAdviceNote: string; // Reminder to seek legal counsel
  riskCoverage: {
    contractTypes: string[]; // detected or from intake
    reviewedCategories: string[]; // labels of categories provided to the model
    unreviewedCategories: string[]; // if any were skipped
    matrix: Array<{
      category: string; // label
      status: CoverageStatus;
      potentialSeverity: PotentialSeverity;
      severity?: PotentialSeverity; // backward compatibility
      evidence: string; // MUST be a direct quote: "…"
      whyItMatters: string;
    }>;
    topRisks: Array<{ title: string; potentialSeverity: PotentialSeverity; severity?: PotentialSeverity }>; // backward compatibility
  };
  intakeContractType: string;
  detectedContractType: string;
  finalContractType: string;
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

// Helper function to detect contract type from text
async function detectContractType(text: string): Promise<string> {
  const truncatedText = truncateText(text, 10000); // Smaller limit for classification
  
  const prompt = `Classify this contract as one of: Residential Lease, Freelance / Services, NDA (Non-Disclosure Agreement), Employment Contract, Business Services, Other. Respond with only the label.

Contract text:
${truncatedText}

Respond with only the label.`;

  try {
    const responseText = await makeOpenAICall([
      { role: "system", content: "You are a contract classification expert. Respond with only the contract type label." },
      { role: "user", content: prompt }
    ], 50);

    // Normalize the response to match our taxonomy keys
    const detectedType = responseText.trim().toLowerCase();
    
    // Map AI response to our taxonomy keys
    const typeMapping: Record<string, string> = {
      'residential lease': 'Residential Lease',
      'freelance/services': 'Freelance / Services',
      'freelance': 'Freelance / Services',
      'services': 'Freelance / Services',
      'nda': 'NDA (Non-Disclosure Agreement)',
      'employment contract': 'Employment Contract',
      'employment': 'Employment Contract',
      'business services': 'Business Services',
      'business': 'Business Services',
      'vendor': 'Business Services',
      'msa': 'Business Services',
      'saas': 'Business Services',
      'b2b services': 'Business Services',
      'b2b': 'Business Services',
      'vendor agreement': 'Business Services',
      'master service agreement': 'Business Services',
      'software as a service': 'Business Services',
      'professional services': 'Business Services',
      'consulting agreement': 'Business Services',
      'service agreement': 'Business Services',
      'other': 'Other'
    };

    // Find the best match
    for (const [key, value] of Object.entries(typeMapping)) {
      if (detectedType.includes(key) || key.includes(detectedType)) {
        return value;
      }
    }

    // Default fallback
    return 'Other';
    
  } catch (error) {
    console.log('Contract type detection failed:', error);
    return 'Other'; // Fallback on error
  }
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

export function sanitizeFullResult(result: any): FullResult {
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
    professionalAdviceNote: (result.professionalAdviceNote || 'This tool provides AI-powered plain-English explanations. It is not legal advice.').substring(0, 500).trim(),
    riskCoverage: sanitizeRiskCoverage(result.riskCoverage),
    intakeContractType: String(result.intakeContractType || '').trim(),
    detectedContractType: String(result.detectedContractType || '').trim(),
    finalContractType: String(result.finalContractType || '').trim()
  };
}

// Helper function to sanitize risk coverage data
function sanitizeRiskCoverage(riskCoverage: any): FullResult['riskCoverage'] {
  if (!riskCoverage || typeof riskCoverage !== 'object') {
    return {
      contractTypes: [],
      reviewedCategories: [],
      unreviewedCategories: [],
      matrix: [],
      topRisks: []
    };
  }

  return {
    contractTypes: Array.isArray(riskCoverage.contractTypes)
      ? riskCoverage.contractTypes.map((t: any) => String(t || '').trim()).filter(Boolean)
      : [],
    reviewedCategories: Array.isArray(riskCoverage.reviewedCategories)
      ? riskCoverage.reviewedCategories.map((c: any) => String(c || '').trim()).filter(Boolean)
      : [],
    unreviewedCategories: Array.isArray(riskCoverage.unreviewedCategories)
      ? riskCoverage.unreviewedCategories.map((c: any) => String(c || '').trim()).filter(Boolean)
      : [],
    matrix: Array.isArray(riskCoverage.matrix)
      ? riskCoverage.matrix.slice(0, 20).map((item: any) => ({
          category: String(item?.category || '').trim(),
          status: (['present_favourable', 'present_unfavourable', 'ambiguous', 'not_mentioned'].includes(item?.status)) 
            ? item.status : 'not_mentioned',
          potentialSeverity: (['high', 'medium', 'low'].includes(item?.potentialSeverity || item?.severity)) 
            ? (item.potentialSeverity || item.severity) : 'medium',
          evidence: String(item?.evidence || '').substring(0, 200).trim(),
          whyItMatters: String(item?.whyItMatters || '').substring(0, 300).trim()
        })).filter(m => m.category)
      : [],
    topRisks: Array.isArray(riskCoverage.topRisks)
      ? riskCoverage.topRisks.slice(0, 5).map((risk: any) => ({
          title: String(risk?.title || '').substring(0, 150).trim(),
          potentialSeverity: (['high', 'medium', 'low'].includes(risk?.potentialSeverity || risk?.severity)) 
            ? (risk.potentialSeverity || risk.severity) : 'medium'
        })).filter(r => r.title)
      : []
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

// Helper function to validate and sanitize risk coverage data
function validateAndSanitizeRiskCoverage(riskCoverage: any): any {
  if (!riskCoverage || typeof riskCoverage !== 'object') {
    return riskCoverage;
  }

  // Sanitize matrix items
  if (Array.isArray(riskCoverage.matrix)) {
    riskCoverage.matrix = riskCoverage.matrix.map((item: any) => {
      // Map severity to potentialSeverity if needed
      if (item.severity && !item.potentialSeverity) {
        item.potentialSeverity = item.severity;
        delete item.severity;
      }

      // Sanitize evidence field
      if (item.evidence && typeof item.evidence === 'string') {
        let evidence = item.evidence.trim();
        
        // If evidence is not empty and not properly quoted, wrap it in quotes
        if (evidence && !evidence.startsWith('"') && !evidence.endsWith('"')) {
          evidence = `"${evidence}"`;
        }
        
        // Trim whitespace around quotes: " text " → "text"
        if (evidence.startsWith('"') && evidence.endsWith('"') && evidence.length > 2) {
          const innerContent = evidence.slice(1, -1).trim();
          evidence = `"${innerContent}"`;
        }
        
        item.evidence = evidence;
      }

      return item;
    });
  }

  // Sanitize topRisks items
  if (Array.isArray(riskCoverage.topRisks)) {
    riskCoverage.topRisks = riskCoverage.topRisks.map((risk: any) => {
      // Map severity to potentialSeverity if needed
      if (risk.severity && !risk.potentialSeverity) {
        risk.potentialSeverity = risk.severity;
        delete risk.severity;
      }
      return risk;
    });
  }

  return riskCoverage;
}

// Helper function to validate risk coverage schema
function validateRiskCoverageSchema(riskCoverage: any): boolean {
  if (!riskCoverage || typeof riskCoverage !== 'object') {
    return false;
  }

  // Validate matrix
  if (Array.isArray(riskCoverage.matrix)) {
    for (const item of riskCoverage.matrix) {
      // Check that potentialSeverity is present and valid
      if (!item.potentialSeverity || !['high', 'medium', 'low'].includes(item.potentialSeverity)) {
        return false;
      }

      // Check evidence format: either empty string or properly quoted
      if (item.evidence && typeof item.evidence === 'string') {
        const evidence = item.evidence.trim();
        if (evidence && (!evidence.startsWith('"') || !evidence.endsWith('"') || evidence.length < 3)) {
          return false;
        }
      }
    }
  }

  // Validate topRisks
  if (Array.isArray(riskCoverage.topRisks)) {
    for (const risk of riskCoverage.topRisks) {
      if (!risk.potentialSeverity || !['high', 'medium', 'low'].includes(risk.potentialSeverity)) {
        return false;
      }
    }
  }

  return true;
}

// Helper function to parse JSON with retry logic
function parseJSONWithRetry(responseText: string, isRetry: boolean = false): any {
  try {
    const parsed = JSON.parse(responseText);
    
    // Sanitize the parsed result
    if (parsed.riskCoverage) {
      parsed.riskCoverage = validateAndSanitizeRiskCoverage(parsed.riskCoverage);
      
      // Validate the sanitized result
      if (!validateRiskCoverageSchema(parsed.riskCoverage)) {
        if (!isRetry) {
          throw new Error('SCHEMA_VALIDATION_FAILED');
        }
        throw new Error('Invalid risk coverage schema after sanitization');
      }
    }
    
    return parsed;
  } catch (error) {
    if (!isRetry) {
      // Retry once with stricter instruction
      throw new Error('JSON_PARSE_RETRY');
    }
    throw new Error('Invalid JSON response from OpenAI API');
  }
}

// Helper function to post-process full result
function postProcessFullResult(result: any, riskCategories: RiskCategory[], categoryLabels: string[], contractTypeHint?: string, detectedContractType?: string, finalContractType?: string): any {
  // Ensure riskCoverage exists
  if (!result.riskCoverage) {
    result.riskCoverage = {
      contractTypes: [],
      reviewedCategories: [],
      unreviewedCategories: [],
      matrix: [],
      topRisks: []
    };
  }

  // Validate matrix length
  const expectedLength = categoryLabels.length;
  const actualLength = result.riskCoverage.matrix?.length || 0;
  
  if (actualLength !== expectedLength) {
    // If matrix length doesn't match, retry with stricter instructions
    throw new Error('MATRIX_LENGTH_MISMATCH');
  }

  // Ensure all categories are covered
  const matrixCategories = result.riskCoverage.matrix?.map((item: any) => item.category) || [];
  const missingCategories = categoryLabels.filter(label => !matrixCategories.includes(label));
  
  if (missingCategories.length > 0) {
    // Add missing categories with default values
    missingCategories.forEach(categoryLabel => {
      const category = riskCategories.find(cat => cat.label === categoryLabel);
      result.riskCoverage.matrix.push({
        category: categoryLabel,
        status: 'not_mentioned',
        potentialSeverity: category?.defaultSeverity || 'medium',
        evidence: '',
        whyItMatters: category?.whyItMatters || 'This category was not addressed in the contract.'
      });
    });
  }

  // Compute topRisks if missing or empty
  if (!result.riskCoverage.topRisks || result.riskCoverage.topRisks.length === 0) {
    const riskItems = result.riskCoverage.matrix?.filter((item: any) => 
      ['present_unfavourable', 'ambiguous', 'not_mentioned'].includes(item.status)
    ) || [];
    
    // Sort by potentialSeverity (high -> medium -> low) and take top 5
    const severityOrder = { high: 3, medium: 2, low: 1 };
    riskItems.sort((a: any, b: any) => {
      const aSeverity = a.potentialSeverity || a.severity || 'medium';
      const bSeverity = b.potentialSeverity || b.severity || 'medium';
      return (severityOrder[bSeverity as keyof typeof severityOrder] || 0) - 
             (severityOrder[aSeverity as keyof typeof severityOrder] || 0);
    });
    
    result.riskCoverage.topRisks = riskItems.slice(0, 5).map((item: any) => ({
      title: item.category,
      potentialSeverity: item.potentialSeverity || item.severity || 'medium'
    }));
  }

  // Set contract types and reviewed categories
  result.riskCoverage.contractTypes = [finalContractType || contractTypeHint || 'detected'];
  result.riskCoverage.reviewedCategories = categoryLabels;
  result.riskCoverage.unreviewedCategories = [];

  // Add contract type fields
  result.intakeContractType = contractTypeHint || '';
  result.detectedContractType = detectedContractType || '';
  result.finalContractType = finalContractType || '';

  return result;
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
export async function summarizeContractFull(text: string, options: { contractTypeHint?: string } = {}): Promise<FullResult> {
  const truncatedText = truncateText(text, 50000); // Larger limit for full analysis
  
  // Detect contract type from text
  const detectedContractType = await detectContractType(text);
  
  // Determine final contract type based on user selection and detection
  let finalContractType: string;
  if (options.contractTypeHint === 'Other') {
    // If user selected "Other", use detected type
    finalContractType = detectedContractType;
  } else {
    // Always use user selection as final type
    finalContractType = options.contractTypeHint || detectedContractType;
  }
  
  // Load risk categories based on final contract type
  const riskCategories = loadRiskCategories(finalContractType);
  const categoryLabels = riskCategories.map(cat => cat.label);
  
  // Build category information for the prompt
  const categoryInfo = riskCategories.map(cat => 
    `- ${cat.label}: ${cat.whyItMatters} (Look for: ${cat.evidence})`
  ).join('\n');
  
  const prompt = `Analyse the following contract text and provide a structured legal memo-style analysis. Return ONLY valid JSON with this exact structure:

{
  "executiveSummary": "2-3 paragraphs like a lawyer's note summarising the contract's purpose, key terms, and overall implications",
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
  "professionalAdviceNote": "Reminder to seek qualified legal counsel for specific advice",
  "riskCoverage": {
    "contractTypes": ["detected contract type"],
    "reviewedCategories": ["list of all category labels provided"],
    "unreviewedCategories": [],
    "matrix": [
      {
        "category": "category label",
        "status": "present_favourable|present_unfavourable|ambiguous|not_mentioned",
        "potentialSeverity": "high|medium|low",
        "evidence": "MUST be copied verbatim from the provided contract text and wrapped in straight double quotes. Do NOT paraphrase. If you cannot find a direct sentence/phrase, set to empty string",
        "whyItMatters": "why this category matters for this contract type"
      }
    ],
    "topRisks": [
      {
        "title": "risk title",
        "potentialSeverity": "high|medium|low"
      }
    ]
  }
}

CRITICAL REQUIREMENTS FOR RISK COVERAGE:
- You MUST review EVERY category in the provided list and emit one matrix entry per category.
- If a category is not mentioned in the contract, set status='not_mentioned' and still fill whyItMatters.
- Ambiguity counts as risk; use 'ambiguous' when unclear.
- Return potentialSeverity (high/medium/low) — this is an estimate of potential impact, not legal advice.
- evidence MUST be copied verbatim from the provided contract text and wrapped in straight double quotes. Do NOT paraphrase. If you cannot find a direct sentence/phrase, set evidence to an empty string.
- No URLs or law firm names. Plain English. JSON only.
- The matrix array must have exactly ${categoryLabels.length} entries, one for each category.

IMPORTANT GUARDRAILS:
- Do NOT provide recommendations or prescriptive advice.
- Do NOT suggest steps to take or actions to perform.
- Do NOT include "recommendedAction" or "action" fields in your response.
- Provide neutral explanations only - explain what exists, not what to do about it.
- Focus on factual analysis and neutral explanations of contract terms.

Categories to review:
${categoryInfo}

Contract text to analyze:
${truncatedText}

Return ONLY the JSON object, no additional text.`;

  try {
    const responseText = await makeOpenAICall([
      { role: "system", content: SHARED_SYSTEM_PROMPT },
      { role: "user", content: prompt }
    ], 2000);

    const result = parseJSONWithRetry(responseText);
    
    // Post-process: validate matrix length and compute topRisks if missing
    const processedResult = postProcessFullResult(result, riskCategories, categoryLabels, options.contractTypeHint, detectedContractType, finalContractType);
    
    return sanitizeFullResult(processedResult);
    
  } catch (error: any) {
    if (error.message === 'JSON_PARSE_RETRY' || error.message === 'MATRIX_LENGTH_MISMATCH' || error.message === 'SCHEMA_VALIDATION_FAILED') {
      // Retry with stricter instruction
      try {
        const retryPrompt = `Return valid JSON exactly matching this schema - no extra text. CRITICAL: The riskCoverage.matrix must have exactly ${categoryLabels.length} entries, one for each category.

{
  "executiveSummary": "2-3 paragraphs like a lawyer's note",
  "partiesAndPurpose": "who is involved and why",
  "keyClauses": [{"clause": "clause1", "explanation": "explanation1"}],
  "obligations": ["obligation1", "obligation2"],
  "paymentsAndCosts": ["payment1", "cost1"],
  "renewalAndTermination": ["renewal1", "termination1"],
  "liabilityAndRisks": [{"clause": "clause1", "whyItMatters": "why1", "howItAffectsYou": "how1"}],
  "professionalAdviceNote": "advice note",
  "riskCoverage": {
    "contractTypes": ["detected contract type"],
    "reviewedCategories": ["${categoryLabels.join('", "')}"],
    "unreviewedCategories": [],
    "matrix": [
      ${categoryLabels.map(label => `{"category": "${label}", "status": "present_favourable|present_unfavourable|ambiguous|not_mentioned", "potentialSeverity": "high|medium|low", "evidence": "direct quote in double quotes or empty", "whyItMatters": "why it matters"}`).join(',\n      ')}
    ],
    "topRisks": [{"title": "risk1", "potentialSeverity": "high"}]
  }
}

CRITICAL EVIDENCE REQUIREMENTS:
- evidence MUST be either an empty string "" OR a direct quote from the contract wrapped in double quotes
- Examples: "" or "The Tenant shall pay rent on the first of each month"
- Do NOT paraphrase or summarize - copy the exact text from the contract
- If no relevant text is found, use empty string ""

CRITICAL FIELD REQUIREMENTS:
- Use potentialSeverity (NOT severity) for all risk assessments
- potentialSeverity must be exactly "high", "medium", or "low"

IMPORTANT: Do NOT include "recommendations", "recommendedAction", or "action" fields. Provide neutral explanations only.

Categories to review (MUST include all ${categoryLabels.length}):
${categoryInfo}

Contract text: ${truncatedText}`;

        const retryResponse = await makeOpenAICall([
          { role: "system", content: SHARED_SYSTEM_PROMPT + " Return ONLY valid JSON matching the exact schema. The riskCoverage.matrix must have exactly " + categoryLabels.length + " entries. Use potentialSeverity (NOT severity) and ensure evidence is either empty string or properly quoted direct quotes from the contract." },
          { role: "user", content: retryPrompt }
        ], 1500);

        const retryResult = parseJSONWithRetry(retryResponse, true);
        const processedRetryResult = postProcessFullResult(retryResult, riskCategories, categoryLabels, options.contractTypeHint, detectedContractType, finalContractType);
        return sanitizeFullResult(processedRetryResult);
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
