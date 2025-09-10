import bucketDefsData from '../data/bucketDefs.json';

// Types for the bucket system
export interface RiskItem {
  riskId: string;
  riskName: string;
}

export interface Bucket {
  bucketName: string;
  items: RiskItem[];
}

export interface BucketDefsData {
  [contractType: string]: Bucket[];
}

/**
 * Normalises a contract type string for consistent lookup
 */
function normalizeContractType(contractType: string): string {
  if (!contractType) return '';
  
  // Trim and normalise whitespace
  let normalized = contractType.trim();
  
  // Handle common variations
  const variations: { [key: string]: string } = {
    'residential lease': 'Residential Lease',
    'lease': 'Residential Lease',
    'rental': 'Residential Lease',
    'freelance': 'Freelance / Services',
    'freelance services': 'Freelance / Services',
    'services': 'Freelance / Services',
    'contractor': 'Freelance / Services',
    'nda': 'NDA (Non-Disclosure Agreement)',
    'non-disclosure': 'NDA (Non-Disclosure Agreement)',
    'confidentiality': 'NDA (Non-Disclosure Agreement)',
    'employment': 'Employment Contract',
    'employee': 'Employment Contract',
    'job': 'Employment Contract',
    'business services': 'Business Services',
    'business': 'Business Services',
    'saas': 'Business Services',
    'software': 'Business Services',
    'other': 'Other'
  };
  
  const lowerType = normalized.toLowerCase();
  return variations[lowerType] || normalized;
}

/**
 * Loads bucket definitions for a given contract type
 * @param contractType - The contract type to load buckets for
 * @returns Array of buckets for the contract type, or empty array if not found
 */
export function loadBucketDefs(contractType: string): Bucket[] {
  const bucketDefs = bucketDefsData as BucketDefsData;
  
  // Normalise contract type for lookup
  const normalizedType = normalizeContractType(contractType);
  
  // Find exact match first
  if (bucketDefs[normalizedType]) {
    return bucketDefs[normalizedType];
  }
  
  // Try case-insensitive match
  const lowerType = normalizedType.toLowerCase();
  for (const [key, value] of Object.entries(bucketDefs)) {
    if (key.toLowerCase() === lowerType) {
      return value;
    }
  }
  
  // Try partial matches for common variations
  const partialMatches: { [key: string]: string } = {
    'lease': 'Residential Lease',
    'rental': 'Residential Lease',
    'freelance': 'Freelance / Services',
    'contractor': 'Freelance / Services',
    'nda': 'NDA (Non-Disclosure Agreement)',
    'employment': 'Employment Contract',
    'business': 'Business Services'
  };
  
  for (const [partial, fullType] of Object.entries(partialMatches)) {
    if (lowerType.includes(partial)) {
      return bucketDefs[fullType] || [];
    }
  }
  
  // Return empty array if no match found
  return [];
}

/**
 * Gets all available contract types
 * @returns Array of available contract type names
 */
export function getAvailableContractTypes(): string[] {
  const bucketDefs = bucketDefsData as BucketDefsData;
  return Object.keys(bucketDefs);
}

/**
 * Checks if a contract type is supported
 * @param contractType - The contract type to check
 * @returns True if the contract type is supported
 */
export function isContractTypeSupported(contractType: string): boolean {
  return loadBucketDefs(contractType).length > 0;
}
