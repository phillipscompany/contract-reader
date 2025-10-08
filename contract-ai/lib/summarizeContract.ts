import OpenAI from "openai";
import { loadBucketDefs, type Bucket } from "./buckets";
import { detectMentioned, extractFacts, formatKeyInfo } from "./riskDetect";
import { loadPrompt } from "./utils/loadPrompt";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Load shared system prompt once
const SHARED_SYSTEM_PROMPT = loadPrompt("shared-system.txt");

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
export interface FullResult {
  executiveSummary: string;
  partiesAndPurpose: string;
  keyClauses: Array<{ clause: string; explanation: string }>;
  obligations: string[];
  paymentsAndCosts: string[];
  renewalAndTermination: string[];
  liabilityAndRisks: Array<{ clause: string; whyItMatters: string; howItAffectsYou: string }>;
  professionalAdviceNote: string;
  buckets: Array<{
    bucketName: string;
    risks: Array<{ riskId: string; riskName: string; mentioned: boolean; keyInfo: string }>;
  }>;
  intakeContractType: string;
  detectedContractType: { label: string; confidence: number };
  finalContractType: string;
  userRole?: string;
  userParty?: string;
}

class ContractError extends Error {
  code: "RATE_LIMIT" | "AUTH" | "TIMEOUT" | "UNKNOWN";
  constructor(code: "RATE_LIMIT" | "AUTH" | "TIMEOUT" | "UNKNOWN", message: string) {
    super(message);
    this.code = code;
    this.name = "ContractError";
  }
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function truncateText(text: string, maxChars = 50000): string {
  return text.length <= maxChars ? text : text.substring(0, maxChars) + "... [truncated]";
}

function validateBucketStructure(buckets: any[], bucketDefs: any[]): boolean {
  if (!Array.isArray(buckets) || !Array.isArray(bucketDefs)) return false;
  const required = new Set(bucketDefs.flatMap(b => b.items.map(i => i.riskId)));
  const provided = new Set(buckets.flatMap(b => b.risks?.map((r: any) => r.riskId) || []));
  if (required.size !== provided.size) return false;
  for (const id of required) if (!provided.has(id)) return false;
  return buckets.every(b =>
    b.bucketName &&
    Array.isArray(b.risks) &&
    b.risks.every((r: any) =>
      r.riskId && r.riskName && typeof r.mentioned === "boolean" && typeof r.keyInfo === "string"
    )
  );
}

function enhanceBucketsWithDetection(buckets: any[], bucketDefs: Bucket[], contractText: string): FullResult["buckets"] {
  const out: FullResult["buckets"] = [];
  bucketDefs.forEach(bucketDef => {
    const existing = buckets.find(b => b.bucketName === bucketDef.bucketName);
    const risks: FullResult["buckets"][0]["risks"] = [];
    bucketDef.items.forEach(riskDef => {
      let risk = existing?.risks?.find((r: any) => r.riskId === riskDef.riskId) || {
        riskId: riskDef.riskId,
        riskName: riskDef.riskName,
        mentioned: false,
        keyInfo: "",
      };
      const detected = detectMentioned(contractText, riskDef.riskId);
      if (detected && !risk.mentioned) risk.mentioned = true;
      if (risk.mentioned && (!risk.keyInfo || risk.keyInfo.length < 12)) {
        const facts = extractFacts(contractText, riskDef.riskId);
        const gen = formatKeyInfo(riskDef.riskId, facts);
        if (gen) risk.keyInfo = gen;
      }
      const sentences = risk.keyInfo.split(/[.!?]+/).filter(Boolean);
      risk.keyInfo = (sentences[0]?.trim() || "") + (sentences[0] ? "." : "");
      risks.push(risk);
    });
    out.push({ bucketName: bucketDef.bucketName, risks });
  });
  return out;
}

// ─────────────────────────────────────────────
// OpenAI helpers
// ─────────────────────────────────────────────
async function makeOpenAICall(messages: any[], maxTokens: number): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.3,
    max_tokens: maxTokens,
    messages,
  });
  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error("Empty response");
  return content;
}

// ─────────────────────────────────────────────
// Contract Type Detection (uses prompt files)
// ─────────────────────────────────────────────
async function detectContractTypeWithConfidence(text: string) {
  const truncatedText = truncateText(text, 10000);
  const prompt = loadPrompt("contract-type-detection.hbs", { truncatedText });
  try {
    const res = await makeOpenAICall(
      [
        { role: "system", content: SHARED_SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      100
    );
    const result = JSON.parse(res.trim());
    if (!result.label || typeof result.confidence !== "number") throw new Error("Bad structure");
    return {
      label: result.label,
      confidence: Math.max(0, Math.min(1, Number(result.confidence.toFixed(2)))),
    };
  } catch {
    const fbPrompt = loadPrompt("contract-type-fallback.hbs", { truncatedText });
    const fbRes = await makeOpenAICall(
      [
        { role: "system", content: SHARED_SYSTEM_PROMPT },
        { role: "user", content: fbPrompt },
      ],
      50
    );
    return { label: fbRes.trim(), confidence: 0.5 };
  }
}

// ─────────────────────────────────────────────
// JSON sanitizer helpers
// ─────────────────────────────────────────────
function sanitizeBuckets(buckets: any): FullResult["buckets"] {
  if (!Array.isArray(buckets)) return [];
  return buckets.slice(0, 10).map((b: any) => ({
    bucketName: String(b?.bucketName || "").trim(),
    risks: Array.isArray(b?.risks)
      ? b.risks.slice(0, 20).map((r: any) => ({
          riskId: String(r?.riskId || "").trim(),
          riskName: String(r?.riskName || "").trim(),
          mentioned: Boolean(r?.mentioned),
          keyInfo: String(r?.keyInfo || "").substring(0, 200).trim(),
        }))
      : [],
  }));
}

export function sanitizeFullResult(result: any): FullResult {
  return {
    executiveSummary: (result.executiveSummary || "").trim() || "Not specified.",
    partiesAndPurpose: (result.partiesAndPurpose || "").trim(),
    keyClauses: Array.isArray(result.keyClauses)
      ? result.keyClauses.map((c: any) => ({
          clause: c.clause?.slice(0, 150).trim() || "",
          explanation: c.explanation?.slice(0, 400).trim() || "",
        }))
      : [],
    obligations: Array.isArray(result.obligations) ? result.obligations.map((o: string) => o.trim()) : [],
    paymentsAndCosts: result.paymentsAndCosts || [],
    renewalAndTermination: result.renewalAndTermination || [],
    liabilityAndRisks: result.liabilityAndRisks || [],
    professionalAdviceNote:
      result.professionalAdviceNote ||
      "This tool provides AI-powered plain-English explanations. It is not legal advice.",
    buckets: sanitizeBuckets(result.buckets),
    intakeContractType: result.intakeContractType || "",
    detectedContractType: result.detectedContractType || { label: "Other", confidence: 0.5 },
    finalContractType: result.finalContractType || "",
    userRole: result.userRole || "",
    userParty: result.userParty || "",
  };
}

// ─────────────────────────────────────────────
// MAIN FUNCTION: Full Analysis
// ─────────────────────────────────────────────
export async function summarizeContractFull(
  text: string,
  options: { contractTypeHint?: string; userRole?: string; userParty?: string } = {}
): Promise<FullResult> {
  const truncatedText = truncateText(text);
  const contractTypeResult = await detectContractTypeWithConfidence(text);
  const intakeType = options.contractTypeHint || "";
  const finalType =
    intakeType === "Other"
      ? contractTypeResult.label
      : contractTypeResult.confidence >= 0.8 && contractTypeResult.label !== intakeType
      ? contractTypeResult.label
      : intakeType || contractTypeResult.label;

  const bucketDefs = loadBucketDefs(finalType);
  if (!bucketDefs?.length) throw new ContractError("UNKNOWN", `No bucket defs for ${finalType}`);

  const bucketInfo = bucketDefs
    .map(b =>
      `${b.bucketName}: [${b.items.map(i => `{"riskId": "${i.riskId}", "riskName": "${i.riskName}"}`).join(", ")}]`
    )
    .join(",\n");

  const schema = `{
    "executiveSummary": "",
    "partiesAndPurpose": "",
    "keyClauses": [],
    "obligations": [],
    "paymentsAndCosts": [],
    "renewalAndTermination": [],
    "liabilityAndRisks": [],
    "professionalAdviceNote": "",
    "buckets": []
  }`;

  const analysisPrompt = loadPrompt("contract-full-analysis.hbs", {
    truncatedText,
    finalContractType: finalType,
    bucketInfo,
    userPerspective: options.userRole || options.userParty ? options : undefined,
    schema,
  });

  try {
    const response = await makeOpenAICall(
      [
        { role: "system", content: SHARED_SYSTEM_PROMPT },
        { role: "user", content: analysisPrompt },
      ],
      2000
    );

    const result = JSON.parse(response);
    if (!validateBucketStructure(result.buckets, bucketDefs)) throw new Error("Invalid buckets");

    result.buckets = enhanceBucketsWithDetection(result.buckets, bucketDefs, truncatedText);
    result.intakeContractType = intakeType;
    result.detectedContractType = contractTypeResult;
    result.finalContractType = finalType;
    result.userRole = options.userRole || "";
    result.userParty = options.userParty || "";

    return sanitizeFullResult(result);
  } catch (error: any) {
    console.error("Analysis failed:", error);
    throw new ContractError("UNKNOWN", "Contract analysis failed. Please try again.");
  }
}
