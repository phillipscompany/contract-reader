import riskBucketsData from '../data/riskBuckets.json';

// Types for the bucket system
export interface RiskItem {
  riskId: string;
  riskName: string;
}

export interface Bucket {
  bucketName: string;
  items: RiskItem[];
}

export interface ContractTypeBuckets {
  buckets: Bucket[];
}

export interface RiskBucketData {
  [contractType: string]: ContractTypeBuckets;
}

export interface MappedRisk {
  riskId: string;
  riskName: string;
  mentioned: boolean;
  keyInfo: string;
}

export interface MappedBucket {
  bucketName: string;
  risks: MappedRisk[];
}

// Taxonomy matrix item type (from existing system)
export interface TaxonomyMatrixItem {
  category: string;
  status: string;
  evidence?: string;
  whyItMatters?: string;
  potentialSeverity?: string;
  severity?: string;
}

/**
 * Loads the bucket configuration for a given contract type
 * @param contractType - The contract type to load buckets for
 * @returns The bucket configuration for the contract type, or null if not found
 */
export function loadBuckets(contractType: string): ContractTypeBuckets | null {
  const bucketsData = riskBucketsData as RiskBucketData;
  
  // Normalize contract type for lookup
  const normalizedType = normalizeContractType(contractType);
  
  // Find exact match first
  if (bucketsData[normalizedType]) {
    return bucketsData[normalizedType];
  }
  
  // Try case-insensitive match
  const lowerType = normalizedType.toLowerCase();
  for (const [key, value] of Object.entries(bucketsData)) {
    if (key.toLowerCase() === lowerType) {
      return value;
    }
  }
  
  // Try partial matches for common variations
  const partialMatches: { [key: string]: string } = {
    'lease': 'Residential Lease',
    'rental': 'Residential Lease',
    'freelance': 'Freelance / Services',
    'services': 'Freelance / Services',
    'contractor': 'Freelance / Services',
    'nda': 'NDA (Non-Disclosure Agreement)',
    'non-disclosure': 'NDA (Non-Disclosure Agreement)',
    'confidentiality': 'NDA (Non-Disclosure Agreement)',
    'employment': 'Employment Contract',
    'job': 'Employment Contract',
    'work': 'Employment Contract',
    'business': 'Business Services',
    'saas': 'Business Services',
    'software': 'Business Services'
  };
  
  for (const [partial, fullType] of Object.entries(partialMatches)) {
    if (lowerType.includes(partial)) {
      return bucketsData[fullType] || null;
    }
  }
  
  return null;
}

/**
 * Maps taxonomy matrix results to bucket format
 * @param matrix - Array of taxonomy analysis results
 * @param buckets - Bucket configuration for the contract type
 * @returns Array of mapped buckets with risk information
 */
export function mapMatrixToBuckets(
  matrix: TaxonomyMatrixItem[], 
  buckets: ContractTypeBuckets
): MappedBucket[] {
  if (!buckets || !buckets.buckets) {
    return [];
  }
  
  return buckets.buckets.map(bucket => {
    const risks: MappedRisk[] = bucket.items.map(item => {
      // Find matching taxonomy result by category (riskId)
      const taxonomyItem = matrix.find(m => 
        m.category === item.riskId || 
        m.category.toLowerCase() === item.riskId.toLowerCase()
      );
      
      if (taxonomyItem) {
        // Determine if mentioned (not_mentioned = false, everything else = true)
        const mentioned = taxonomyItem.status !== 'not_mentioned';
        
        // Extract key info from evidence or whyItMatters
        let keyInfo = '';
        if (mentioned && taxonomyItem.evidence) {
          keyInfo = taxonomyItem.evidence.trim();
        } else if (mentioned && taxonomyItem.whyItMatters) {
          keyInfo = taxonomyItem.whyItMatters.trim();
        }
        
        // Limit keyInfo to 1-2 lines (approximately 100-150 characters)
        if (keyInfo.length > 150) {
          const sentences = keyInfo.split(/[.!?]+/);
          if (sentences.length > 1) {
            keyInfo = sentences.slice(0, 2).join('. ').trim() + '.';
          } else {
            keyInfo = keyInfo.substring(0, 147) + '...';
          }
        }
        
        return {
          riskId: item.riskId,
          riskName: item.riskName,
          mentioned,
          keyInfo
        };
      } else {
        // No taxonomy result found - assume not mentioned
        return {
          riskId: item.riskId,
          riskName: item.riskName,
          mentioned: false,
          keyInfo: ''
        };
      }
    });
    
    return {
      bucketName: bucket.bucketName,
      risks
    };
  });
}

/**
 * Normalizes contract type string for consistent lookup
 * @param contractType - Raw contract type string
 * @returns Normalized contract type string
 */
function normalizeContractType(contractType: string): string {
  if (!contractType) return '';
  
  // Trim and normalize whitespace
  let normalized = contractType.trim();
  
  // Handle common variations and abbreviations
  const normalizations: { [key: string]: string } = {
    'residential lease': 'Residential Lease',
    'lease agreement': 'Residential Lease',
    'rental agreement': 'Residential Lease',
    'freelance services': 'Freelance / Services',
    'freelance contract': 'Freelance / Services',
    'service agreement': 'Freelance / Services',
    'contractor agreement': 'Freelance / Services',
    'non-disclosure agreement': 'NDA (Non-Disclosure Agreement)',
    'confidentiality agreement': 'NDA (Non-Disclosure Agreement)',
    'employment agreement': 'Employment Contract',
    'job contract': 'Employment Contract',
    'work contract': 'Employment Contract',
    'business services': 'Business Services',
    'saas agreement': 'Business Services',
    'software services': 'Business Services'
  };
  
  const lower = normalized.toLowerCase();
  for (const [key, value] of Object.entries(normalizations)) {
    if (lower === key) {
      return value;
    }
  }
  
  return normalized;
}

/**
 * Gets all available contract types
 * @returns Array of available contract type names
 */
export function getAvailableContractTypes(): string[] {
  const bucketsData = riskBucketsData as RiskBucketData;
  return Object.keys(bucketsData);
}

/**
 * Checks if a contract type is supported
 * @param contractType - Contract type to check
 * @returns True if the contract type is supported
 */
export function isContractTypeSupported(contractType: string): boolean {
  return loadBuckets(contractType) !== null;
}
