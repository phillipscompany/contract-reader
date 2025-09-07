import riskTaxonomyData from '../data/riskTaxonomy.json';

// Contract types supported by the risk taxonomy
export type ContractType = "Residential Lease" | "Freelance / Services" | "NDA (Non-Disclosure Agreement)" | "Employment Contract" | "Business Services";

// Risk category interface
export interface RiskCategory {
  id: string;
  label: string;
  keywords: string[];
  whyItMatters: string;
  evidence: string;
  defaultSeverity: "low" | "medium" | "high";
}

// Risk taxonomy data structure
interface RiskTaxonomyData {
  [contractType: string]: {
    categories: RiskCategory[];
  };
}

// Contract type mapping for normalization
const contractTypeMapping: Record<string, ContractType> = {
  "lease": "Residential Lease",
  "rental": "Residential Lease",
  "residential lease": "Residential Lease",
  "apartment": "Residential Lease",
  "house": "Residential Lease",
  "freelance": "Freelance / Services",
  "freelance/contractor": "Freelance / Services",
  "freelance / contractor": "Freelance / Services",
  "services": "Freelance / Services",
  "contractor": "Freelance / Services",
  "consulting": "Freelance / Services",
  "consultant": "Freelance / Services",
  "independent contractor": "Freelance / Services",
  "nda": "NDA (Non-Disclosure Agreement)",
  "non-disclosure": "NDA (Non-Disclosure Agreement)",
  "non disclosure": "NDA (Non-Disclosure Agreement)",
  "confidentiality": "NDA (Non-Disclosure Agreement)",
  "confidentiality agreement": "NDA (Non-Disclosure Agreement)",
  "employment": "Employment Contract",
  "employment contract": "Employment Contract",
  "job": "Employment Contract",
  "work": "Employment Contract",
  "employee": "Employment Contract",
  "business services": "Business Services",
  "business": "Business Services",
  "vendor": "Business Services",
  "msa": "Business Services",
  "saas": "Business Services",
  "b2b services": "Business Services",
  "b2b": "Business Services",
  "vendor agreement": "Business Services",
  "master service agreement": "Business Services",
  "software as a service": "Business Services",
  "professional services": "Business Services",
  "consulting agreement": "Business Services",
  "service agreement": "Business Services"
};

/**
 * Normalizes a contract type string to a supported ContractType
 * @param contractType - The contract type to normalize
 * @returns The normalized contract type or "Residential Lease" as fallback
 */
function normalizeContractType(contractType: string): ContractType {
  if (!contractType) {
    return "Residential Lease"; // Default fallback
  }

  const normalized = contractType.toLowerCase().trim();
  
  // Direct match
  if (normalized in contractTypeMapping) {
    return contractTypeMapping[normalized];
  }

  // Partial matching for common variations
  for (const [key, value] of Object.entries(contractTypeMapping)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return value;
    }
  }

  // Default fallback
  return "Residential Lease";
}

/**
 * Loads risk categories for a given contract type
 * @param contractType - The contract type (will be normalized)
 * @returns Array of risk categories for the contract type
 */
export function loadRiskCategories(contractType: string): RiskCategory[] {
  const normalizedType = normalizeContractType(contractType);
  const taxonomyData = riskTaxonomyData as RiskTaxonomyData;
  
  if (taxonomyData[normalizedType]) {
    return taxonomyData[normalizedType].categories;
  }

  // Fallback to Residential Lease if type not found
  return taxonomyData["Residential Lease"].categories;
}

/**
 * Gets all available contract types
 * @returns Array of supported contract types
 */
export function getAvailableContractTypes(): ContractType[] {
  return ["Residential Lease", "Freelance / Services"];
}

/**
 * Gets a specific risk category by ID for a contract type
 * @param contractType - The contract type
 * @param categoryId - The category ID to find
 * @returns The risk category or null if not found
 */
export function getRiskCategory(contractType: string, categoryId: string): RiskCategory | null {
  const categories = loadRiskCategories(contractType);
  return categories.find(cat => cat.id === categoryId) || null;
}

/**
 * Searches risk categories by keyword for a contract type
 * @param contractType - The contract type
 * @param keyword - The keyword to search for
 * @returns Array of matching risk categories
 */
export function searchRiskCategories(contractType: string, keyword: string): RiskCategory[] {
  const categories = loadRiskCategories(contractType);
  const searchTerm = keyword.toLowerCase();
  
  return categories.filter(category => 
    category.keywords.some(kw => kw.toLowerCase().includes(searchTerm)) ||
    category.label.toLowerCase().includes(searchTerm) ||
    category.id.toLowerCase().includes(searchTerm)
  );
}
