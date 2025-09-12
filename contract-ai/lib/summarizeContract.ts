import OpenAI from 'openai';
import { loadBucketDefs, type Bucket } from './buckets';
import { detectMentioned, extractFacts, formatKeyInfo } from './riskDetect';





// Types for Full (detailed) analysis - Lawyer's Memo Style
export interface FullResult {
  executiveSummary: string; // Comprehensive summary with all key facts, figures, dates, amounts, and terms
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
  buckets: Array<{
    bucketName: string;
    risks: Array<{
      riskId: string;
      riskName: string;
      mentioned: boolean;
      keyInfo: string; // if mentioned, a single short plain-English sentence; else ""
    }>;
  }>;
  intakeContractType: string;
  detectedContractType: { label: string; confidence: number };
  finalContractType: string;
}

class ContractError extends Error {
  code: 'RATE_LIMIT' | 'AUTH' | 'TIMEOUT' | 'UNKNOWN';
  
  constructor(code: 'RATE_LIMIT' | 'AUTH' | 'TIMEOUT' | 'UNKNOWN', message: string) {
    super(message);
    this.code = code;
    this.name = 'ContractError';
  }
}

// Shared system guardrails for both functions
const SHARED_SYSTEM_PROMPT = `You are an experienced contracts lawyer. Your job is to explain contracts in plain English, highlighting obligations, risks, and practical steps. Do not give jurisdiction-specific legal advice. Do not include any URLs or law firm names. Output valid JSON only, exactly matching the provided schema. Follow these strict rules:
- Return JSON ONLY matching the schema provided.
- Use ONLY the provided contract text; if unknown, respond "Not specified in the provided text."
- Do NOT include any URLs or links.
- Do NOT name or recommend any law firms, lawyers, or legal services.
- Keep content concise, factual, and plain-English.
- Never include the original contract text in your response.

WRITING STYLE REQUIREMENTS:
- Write in simple British English at a secondary school reading level.
- Use short sentences. Avoid legal jargon.
- Always explain ideas in clear words anyone can understand.
- Keep all facts, dates, numbers, and obligations.
- Do not remove or change information, only make it easier to read.
- Replace complex words with simple ones (e.g., "indemnify" → "protect from legal claims", "jurisdiction" → "which country's laws apply", "herein" → "in this contract").
- Break long sentences into shorter ones.
- Use everyday language instead of formal legal terms.`;

// Helper function to truncate text safely
function truncateText(text: string, maxChars: number = 50000): string {
  if (text.length <= maxChars) return text;
  return text.substring(0, maxChars) + '... [truncated]';
}

// Helper function to validate bucket structure (LAW3)
function validateBucketStructure(buckets: any[], bucketDefs: any[]): boolean {
  if (!Array.isArray(buckets) || !Array.isArray(bucketDefs)) {
    return false;
  }

  // Get all required riskIds from bucket definitions
  const requiredRiskIds = new Set(bucketDefs.flatMap(bucket => bucket.items.map(item => item.riskId)));
  
  // Get all riskIds from the response
  const responseRiskIds = new Set(buckets.flatMap(bucket => bucket.risks?.map(risk => risk.riskId) || []));
  
  // Check if all required riskIds are present and no extra ones
  if (requiredRiskIds.size !== responseRiskIds.size) {
    return false;
  }
  
  for (const riskId of requiredRiskIds) {
    if (!responseRiskIds.has(riskId)) {
      return false;
    }
  }
  
  // Check structure of each bucket and risk
  for (const bucket of buckets) {
    if (!bucket.bucketName || !Array.isArray(bucket.risks)) {
      return false;
    }
    
    for (const risk of bucket.risks) {
      if (!risk.riskId || !risk.riskName || typeof risk.mentioned !== 'boolean' || typeof risk.keyInfo !== 'string') {
        return false;
      }
    }
  }
  
  return true;
}

// Helper function to enhance buckets with risk detection validation
function enhanceBucketsWithDetection(buckets: any[], bucketDefs: Bucket[], contractText: string): FullResult['buckets'] {
  if (!buckets || !bucketDefs) {
    return [];
  }

  const enhancedBuckets: FullResult['buckets'] = [];

  // Process each bucket definition to ensure complete coverage
  bucketDefs.forEach(bucketDef => {
    const existingBucket = buckets.find(b => b.bucketName === bucketDef.bucketName);
    const enhancedRisks: FullResult['buckets'][0]['risks'] = [];

    // Process each risk in the bucket definition
    bucketDef.items.forEach(riskDef => {
      let risk = existingBucket?.risks?.find((r: any) => r.riskId === riskDef.riskId);
      
      // If risk doesn't exist in model response, create a placeholder
      if (!risk) {
        risk = {
          riskId: riskDef.riskId,
          riskName: riskDef.riskName,
          mentioned: false,
          keyInfo: ''
        };
      }

      // Validate mentioned status using risk detection
      const detectedMentioned = detectMentioned(contractText, riskDef.riskId);
      if (detectedMentioned && !risk.mentioned) {
        // Model said not mentioned but we detected it - flip to mentioned
        risk.mentioned = true;
        console.log(`Risk detection: Flipped ${riskDef.riskId} to mentioned`);
      }

      // Enhance keyInfo if mentioned but keyInfo is weak/empty
      if (risk.mentioned && (!risk.keyInfo || risk.keyInfo.length < 12)) {
        const facts = extractFacts(contractText, riskDef.riskId);
        const generatedKeyInfo = formatKeyInfo(riskDef.riskId, facts);
        if (generatedKeyInfo) {
          risk.keyInfo = generatedKeyInfo;
          console.log(`Risk detection: Enhanced keyInfo for ${riskDef.riskId}: ${generatedKeyInfo}`);
        }
      }

      // Ensure keyInfo is a single sentence
      if (risk.keyInfo) {
        const sentences = risk.keyInfo.split(/[.!?]+/).filter(s => s.trim());
        risk.keyInfo = sentences[0]?.trim() + (sentences[0] ? '.' : '');
      }

      enhancedRisks.push({
        riskId: risk.riskId,
        riskName: risk.riskName,
        mentioned: risk.mentioned,
        keyInfo: risk.keyInfo || ''
      });
    });

    enhancedBuckets.push({
      bucketName: bucketDef.bucketName,
      risks: enhancedRisks
    });
  });

  return enhancedBuckets;
}

// Helper function to detect contract type with confidence scoring
async function detectContractTypeWithConfidence(text: string): Promise<{ label: string; confidence: number }> {
  const truncatedText = truncateText(text, 10000); // Smaller limit for classification
  
  const prompt = `Classify this contract as EXACTLY one of these types and provide a confidence score:

Contract Types:
- "Residential Lease" - Features: rent, deposit, landlord, tenant, lease term, property address, maintenance responsibilities
- "Freelance / Services" - Features: SOW (Statement of Work), invoices, IP ownership, deliverables, hourly/daily rates, independent contractor
- "NDA (Non-Disclosure Agreement)" - Features: confidentiality, non-disclosure, trade secrets, remedies, disclosure restrictions
- "Employment Contract" - Features: salary, probation period, notice period, benefits, job title, employment terms
- "Business Services" - Features: SLA (Service Level Agreement), uptime guarantees, liability caps, auto-renewal, B2B services, vendor agreements
- "Other" - Any other contract type not fitting the above categories

Guidance:
- Consider the primary purpose and key features of the contract
- Look for specific terminology and clauses that indicate the contract type
- Confidence should reflect your certainty based on the text evidence (0.0 = very uncertain, 1.0 = very certain)
- If multiple types seem possible, choose the most prominent one and adjust confidence accordingly

Contract text:
${truncatedText}

Respond with valid JSON only:
{ "label": "<exact type from list above>", "confidence": <number between 0.0 and 1.0> }`;

  try {
    const responseText = await makeOpenAICall([
      { role: "system", content: "You are a contract classification expert. Respond with valid JSON only containing the label and confidence score." },
      { role: "user", content: prompt }
    ], 100);

    // Parse JSON response
    const result = JSON.parse(responseText.trim());
    
    // Validate the response structure
    if (!result.label || typeof result.confidence !== 'number') {
      throw new Error('Invalid response structure');
    }

    // Validate label is one of the allowed types
    const allowedTypes = [
      'Residential Lease',
      'Freelance / Services', 
      'NDA (Non-Disclosure Agreement)',
      'Employment Contract',
      'Business Services',
      'Other'
    ];

    if (!allowedTypes.includes(result.label)) {
      throw new Error(`Invalid label: ${result.label}`);
    }

    // Validate confidence is between 0 and 1
    if (result.confidence < 0 || result.confidence > 1) {
      throw new Error(`Invalid confidence: ${result.confidence}`);
    }

    return {
      label: result.label,
      confidence: Math.round(result.confidence * 100) / 100 // Round to 2 decimal places
    };

  } catch (error) {
    console.error('Contract type detection with confidence failed:', error);
    // Fallback to basic detection
    return {
      label: await detectContractTypeFallback(text),
      confidence: 0.5
    };
  }
}

// Fallback function for basic contract type detection (without confidence)
async function detectContractTypeFallback(text: string): Promise<string> {
  const truncatedText = truncateText(text, 10000);
  
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
    console.log('Fallback contract type detection failed:', error);
    return 'Other'; // Fallback on error
  }
}



export function sanitizeFullResult(result: any): FullResult {
  return {
    executiveSummary: (result.executiveSummary || 'Not specified in the provided text.').trim(),
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
    buckets: sanitizeBuckets(result.buckets),
    intakeContractType: String(result.intakeContractType || '').trim(),
    detectedContractType: result.detectedContractType && typeof result.detectedContractType === 'object' 
      ? {
          label: String(result.detectedContractType.label || '').trim(),
          confidence: typeof result.detectedContractType.confidence === 'number' 
            ? Math.round(result.detectedContractType.confidence * 100) / 100 
            : 0.5
        }
      : { label: 'Other', confidence: 0.5 },
    finalContractType: String(result.finalContractType || '').trim()
  };
}


// Helper function to sanitize buckets data
function sanitizeBuckets(buckets: any): FullResult['buckets'] {
  if (!Array.isArray(buckets)) {
    return [];
  }

  return buckets.slice(0, 10).map((bucket: any) => ({
    bucketName: String(bucket?.bucketName || '').trim(),
    risks: Array.isArray(bucket?.risks) 
      ? bucket.risks.slice(0, 20).map((risk: any) => ({
          riskId: String(risk?.riskId || '').trim(),
          riskName: String(risk?.riskName || '').trim(),
          mentioned: Boolean(risk?.mentioned),
          keyInfo: String(risk?.keyInfo || '').substring(0, 200).trim()
        })).filter(r => r.riskId && r.riskName)
      : []
  })).filter(b => b.bucketName && b.risks.length > 0);
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
    const parsed = JSON.parse(responseText);
    return parsed;
  } catch (error) {
    if (!isRetry) {
      // Retry once with stricter instruction
      throw new Error('JSON_PARSE_RETRY');
    }
    throw new Error('Invalid JSON response from OpenAI API');
  }
}



// Full function - lawyer's memo style analysis
export async function summarizeContractFull(text: string, options: { contractTypeHint?: string } = {}): Promise<FullResult> {
  const truncatedText = truncateText(text, 50000); // Larger limit for full analysis
  
  // Detect contract type from text with confidence
  const contractTypeResult = await detectContractTypeWithConfidence(text);
  console.log('API Debug - detectedContractType:', contractTypeResult.label);
  console.log('API Debug - confidence:', contractTypeResult.confidence);
  
  // Smart contract type decision logic
  const intakeContractType = options.contractTypeHint || '';
  let finalContractType: string;
  
  if (intakeContractType === 'Other') {
    // If user selected "Other", use detected type (any confidence)
    finalContractType = contractTypeResult.label;
    console.log('API Debug - Using detected type (user selected "Other"):', finalContractType);
  } else if (contractTypeResult.label !== intakeContractType && contractTypeResult.confidence >= 0.80) {
    // If detected type differs from user selection AND confidence is high (≥0.80), use detected type
    finalContractType = contractTypeResult.label;
    console.log('API Debug - Using detected type (high confidence override):', finalContractType, 'confidence:', contractTypeResult.confidence);
  } else {
    // Otherwise, use user's selection
    finalContractType = intakeContractType || contractTypeResult.label;
    console.log('API Debug - Using user selection:', finalContractType);
  }
  
  console.log('API Debug - finalContractType:', finalContractType);
  
  // Load bucket definitions for the contract type
  const bucketDefs = loadBucketDefs(finalContractType);
  console.log('API Debug - loaded bucket definitions:', bucketDefs);
  
  if (!bucketDefs || bucketDefs.length === 0) {
    throw new ContractError('UNKNOWN', `No bucket definitions found for contract type: ${finalContractType}`);
  }
  
  // Build bucket information for the prompt
  const bucketInfo = bucketDefs.map(bucket => 
    `"${bucket.bucketName}": [${bucket.items.map(item => 
      `{"riskId": "${item.riskId}", "riskName": "${item.riskName}"}`
    ).join(', ')}]`
  ).join(',\n    ');
  
  const prompt = `Analyse the following contract text and provide a structured legal memo-style analysis. Return ONLY valid JSON with this exact structure:

{
  "executiveSummary": "Comprehensive summary including all key facts, figures, dates, amounts, and terms. This should be detailed enough that someone could understand the entire contract by reading just this section. Include all important numbers, deadlines, obligations, and conditions.",
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
  "buckets": [
    {
      "bucketName": "Bucket Name",
      "risks": [
        {
          "riskId": "risk_id",
          "riskName": "Risk Name",
          "mentioned": true,
          "keyInfo": "Short sentence explaining what the contract says about this risk, or empty string if not mentioned"
        }
      ]
    }
  ]
}

WRITING STYLE REQUIREMENTS:
- Write in simple British English at a secondary school reading level.
- Use short sentences. Avoid legal jargon.
- Always explain ideas in clear words anyone can understand.
- Keep all facts, dates, numbers, and obligations.
- Do not remove or change information, only make it easier to read.
- Replace complex words with simple ones (e.g., "indemnify" → "protect from legal claims", "jurisdiction" → "which country's laws apply", "herein" → "in this contract").
- Break long sentences into shorter ones.
- Use everyday language instead of formal legal terms.


CRITICAL BUCKET REQUIREMENTS:
- Contract Type: ${finalContractType}
- You must scan the contract for each riskId listed below and set mentioned=true if the contract contains a clause covering that risk, else false.
- If mentioned=true, produce one short sentence in British English in keyInfo explaining exactly what the contract says about this risk.
- If mentioned=false, keyInfo must be an empty string "".
- No legal advice, no links, just factual statements about what the contract says.
- You must include ALL riskIds exactly as provided - do not add extra risks or buckets.

Required buckets and risks:
    ${bucketInfo}

IMPORTANT GUARDRAILS:
- Do NOT provide recommendations or prescriptive advice.
- Do NOT suggest steps to take or actions to perform.
- Do NOT include "recommendedAction" or "action" fields in your response.
- Provide neutral explanations only - explain what exists, not what to do about it.
- Focus on factual analysis and neutral explanations of contract terms.

Contract text to analyze:
${truncatedText}

Return ONLY the JSON object, no additional text.`;

  try {
    const responseText = await makeOpenAICall([
      { role: "system", content: SHARED_SYSTEM_PROMPT },
      { role: "user", content: prompt }
    ], 2000);

    const result = parseJSONWithRetry(responseText);
    
    // Debug logging
    console.log('API Debug - result.buckets:', result.buckets);
    
    // Validate bucket structure (LAW3)
    if (!validateBucketStructure(result.buckets, bucketDefs)) {
      console.log('API Debug - bucket validation failed, retrying...');
      throw new Error('JSON_PARSE_RETRY');
    }
    
    // Enhance buckets with risk detection validation
    result.buckets = enhanceBucketsWithDetection(result.buckets, bucketDefs, truncatedText);
    
    // Add contract type fields
    result.intakeContractType = intakeContractType;
    result.detectedContractType = contractTypeResult;
    result.finalContractType = finalContractType;
    
    // Sanitize the result
    const sanitizedResult = sanitizeFullResult(result);
    
    return sanitizedResult;
    
  } catch (error: any) {
    if (error.message === 'JSON_PARSE_RETRY') {
      // Retry with stricter instruction
      try {
        const retryPrompt = `Return valid JSON exactly matching this schema - no extra text.

{
  "executiveSummary": "Comprehensive summary with all key facts, figures, dates, amounts, and terms",
  "partiesAndPurpose": "who is involved and why",
  "keyClauses": [{"clause": "clause1", "explanation": "explanation1"}],
  "obligations": ["obligation1", "obligation2"],
  "paymentsAndCosts": ["payment1", "cost1"],
  "renewalAndTermination": ["renewal1", "termination1"],
  "liabilityAndRisks": [{"clause": "clause1", "whyItMatters": "why1", "howItAffectsYou": "how1"}],
  "professionalAdviceNote": "advice note",
  "buckets": [
    {
      "bucketName": "Bucket Name",
      "risks": [
        {
          "riskId": "risk_id",
          "riskName": "Risk Name", 
          "mentioned": true,
          "keyInfo": "Short sentence or empty string"
        }
      ]
    }
  ]
}

WRITING STYLE REQUIREMENTS:
- Write in simple British English at a secondary school reading level.
- Use short sentences. Avoid legal jargon.
- Always explain ideas in clear words anyone can understand.
- Keep all facts, dates, numbers, and obligations.
- Do not remove or change information, only make it easier to read.
- Replace complex words with simple ones (e.g., "indemnify" → "protect from legal claims", "jurisdiction" → "which country's laws apply", "herein" → "in this contract").
- Break long sentences into shorter ones.
- Use everyday language instead of formal legal terms.

IMPORTANT: Do NOT include "recommendations", "recommendedAction", or "action" fields. Provide neutral explanations only.

Contract text: ${truncatedText}`;

        const retryResponse = await makeOpenAICall([
          { role: "system", content: SHARED_SYSTEM_PROMPT + " Return ONLY valid JSON matching the exact schema." },
          { role: "user", content: retryPrompt }
        ], 1500);

        const retryResult = parseJSONWithRetry(retryResponse, true);
        
        // Validate bucket structure again
        if (!validateBucketStructure(retryResult.buckets, bucketDefs)) {
          throw new ContractError('UNKNOWN', 'Bucket validation failed after retry');
        }
        
        // Enhance buckets with risk detection validation
        retryResult.buckets = enhanceBucketsWithDetection(retryResult.buckets, bucketDefs, truncatedText);
        
        // Add contract type fields
        retryResult.intakeContractType = intakeContractType;
        retryResult.detectedContractType = contractTypeResult;
        retryResult.finalContractType = finalContractType;
        
        // Sanitize the result
        const sanitizedRetryResult = sanitizeFullResult(retryResult);
        
        return sanitizedRetryResult;
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

