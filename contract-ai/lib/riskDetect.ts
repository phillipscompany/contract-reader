import { loadRiskCategories } from './riskTaxonomy';

/**
 * Get keywords for a specific risk ID by looking up the taxonomy
 */
export function keywordsForRisk(riskId: string): string[] {
  // Load all risk categories to find the one matching our riskId
  const allCategories = [
    ...loadRiskCategories('Residential Lease'),
    ...loadRiskCategories('Freelance / Services'),
    ...loadRiskCategories('NDA (Non-Disclosure Agreement)'),
    ...loadRiskCategories('Employment Contract'),
    ...loadRiskCategories('Business Services')
  ];
  
  const category = allCategories.find(cat => cat.id === riskId);
  if (!category) {
    return [];
  }
  
  // Extract keywords from the evidence field and add common variations
  const evidence = category.evidence || '';
  const keywords: string[] = [];
  
  // Add evidence-based keywords
  if (evidence) {
    // Split by common separators and clean up
    const evidenceWords = evidence
      .toLowerCase()
      .split(/[,;|&]/)
      .map(word => word.trim())
      .filter(word => word.length > 2 && !word.includes('look for'))
      .slice(0, 8); // Limit to most relevant
    
    keywords.push(...evidenceWords);
  }
  
  // Add risk-specific keywords based on riskId
  const riskSpecificKeywords: { [key: string]: string[] } = {
    // Residential Lease
    'rent_increases': ['rent', 'monthly', 'per month', '£', 'increase', 'cpi', 'annual', 'yearly', 'review'],
    'deposit': ['deposit', 'bond', 'security', 'refundable', 'deduction', 'damage'],
    'fees': ['fee', 'charge', 'penalty', 'late', 'admin', 'processing'],
    'utilities': ['utility', 'bill', 'electric', 'gas', 'water', 'council tax', 'broadband'],
    'break_clause': ['break', 'terminate', 'early', 'notice', 'month'],
    'renewal_notice': ['renewal', 'renew', 'notice', 'period', 'fixed term'],
    'landlord_entry': ['entry', 'access', 'inspect', 'landlord', 'reasonable'],
    'repairs': ['repair', 'maintenance', 'fix', 'damage', 'wear', 'tenant', 'landlord'],
    'pets_alterations': ['pet', 'animal', 'alteration', 'modify', 'decorate', 'paint'],
    'parking_rules': ['parking', 'car', 'vehicle', 'space', 'permit'],
    'insurance': ['insurance', 'cover', 'policy', 'liability', 'contents'],
    'habitability_safety': ['habitable', 'safety', 'health', 'standard', 'condition'],
    'subletting': ['sublet', 'assign', 'transfer', 'lodger', 'guest'],
    'disputes_jurisdiction': ['dispute', 'court', 'jurisdiction', 'law', 'governing'],
    
    // Freelance / Services
    'scope': ['scope', 'deliverable', 'work', 'service', 'project', 'task'],
    'acceptance': ['accept', 'approve', 'satisfactory', 'complete', 'deliver'],
    'change_control': ['change', 'modify', 'revision', 'amendment', 'variation'],
    'timeline': ['timeline', 'deadline', 'milestone', 'schedule', 'delivery'],
    'payment': ['payment', 'invoice', 'fee', 'rate', 'hourly', 'project'],
    'expenses': ['expense', 'cost', 'reimburse', 'travel', 'materials'],
    'ip_ownership': ['intellectual property', 'ip', 'copyright', 'ownership', 'rights'],
    'moral_rights': ['moral right', 'attribution', 'credit', 'author', 'creator'],
    'confidentiality': ['confidential', 'secret', 'proprietary', 'non-disclosure'],
    'non_solicit_compete': ['non-solicit', 'non-compete', 'restrict', 'compete'],
    'termination': ['terminate', 'end', 'kill fee', 'cancellation'],
    'liability_indemnity': ['liability', 'indemnify', 'damage', 'loss', 'claim'],
    'warranties': ['warranty', 'guarantee', 'warrant', 'represent'],
    'contractor_status': ['contractor', 'independent', 'self-employed', 'tax'],
    'governing_law': ['governing law', 'jurisdiction', 'court', 'venue'],
    
    // NDA
    'definition_confidential': ['confidential information', 'proprietary', 'secret', 'trade secret'],
    'exclusions': ['exclusion', 'public', 'prior', 'independent', 'known'],
    'permitted_disclosures': ['permitted', 'disclosure', 'authorised', 'required'],
    'use_restrictions': ['use', 'restriction', 'purpose', 'limited'],
    'return_destruction': ['return', 'destroy', 'delete', 'dispose'],
    'duration': ['duration', 'period', 'year', 'month', 'term'],
    'mutual_one_way': ['mutual', 'one-way', 'unilateral', 'reciprocal'],
    'remedies': ['remedy', 'injunction', 'damage', 'relief', 'enforcement'],
    
    // Employment Contract
    'job_title_duties': ['job title', 'role', 'duty', 'responsibility', 'position'],
    'working_hours': ['working hour', 'overtime', 'time', 'schedule', 'shift'],
    'place_of_work': ['place of work', 'location', 'office', 'remote', 'home'],
    'salary_bonuses': ['salary', 'wage', 'bonus', 'compensation', 'pay'],
    'benefits': ['benefit', 'pension', 'holiday', 'leave', 'sick'],
    'start_probation': ['start date', 'probation', 'trial', 'period'],
    'notice_termination': ['notice', 'termination', 'resign', 'dismiss'],
    'confidentiality_ip': ['confidential', 'intellectual property', 'ip', 'proprietary'],
    'non_compete_solicit': ['non-compete', 'non-solicit', 'restrict', 'compete'],
    'performance_reviews': ['performance', 'review', 'appraisal', 'evaluation'],
    'disciplinary_grievance': ['disciplinary', 'grievance', 'procedure', 'complaint'],
    
    // Business Services
    'scope_services': ['scope', 'service', 'sow', 'statement of work', 'deliverable'],
    'service_levels': ['service level', 'sla', 'uptime', 'availability', 'performance'],
    'support_maintenance': ['support', 'maintenance', 'help', 'assistance'],
    'fees_payment': ['fee', 'payment', 'charge', 'cost', 'price'],
    'auto_renewal': ['auto-renewal', 'automatic', 'renew', 'extension'],
    'data_protection': ['data protection', 'gdpr', 'privacy', 'personal data'],
    'security_compliance': ['security', 'compliance', 'standard', 'certification'],
    'dr_bcp': ['disaster recovery', 'business continuity', 'backup', 'recovery'],
    'audit_rights': ['audit', 'inspection', 'verification', 'review'],
    'liability_cap': ['liability cap', 'limit', 'maximum', 'exclusion'],
    'indemnities': ['indemnify', 'indemnity', 'hold harmless', 'defend'],
    'subcontracting_assignment': ['subcontract', 'assign', 'transfer', 'delegate'],
    'term_termination': ['term', 'termination', 'duration', 'period']
  };
  
  const specificKeywords = riskSpecificKeywords[riskId] || [];
  return [...new Set([...keywords, ...specificKeywords])]; // Remove duplicates
}

/**
 * Detect if a risk is mentioned in the contract text
 */
export function detectMentioned(contractText: string, riskId: string): boolean {
  const keywords = keywordsForRisk(riskId);
  if (keywords.length === 0) {
    return false;
  }
  
  const text = contractText.toLowerCase();
  const keywordMatches: number[] = [];
  
  // Find positions of keyword matches
  keywords.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    let match;
    while ((match = regex.exec(text)) !== null) {
      keywordMatches.push(match.index);
    }
  });
  
  if (keywordMatches.length < 2) {
    return false;
  }
  
  // Check if 2+ keywords are within 120 characters of each other
  keywordMatches.sort((a, b) => a - b);
  for (let i = 0; i < keywordMatches.length - 1; i++) {
    if (keywordMatches[i + 1] - keywordMatches[i] <= 120) {
      return true;
    }
  }
  
  return false;
}

/**
 * Extract facts (amounts, dates, snippets) for a specific risk
 */
export function extractFacts(contractText: string, riskId: string): { 
  amounts: string[]; 
  dates: string[]; 
  snippets: string[] 
} {
  const keywords = keywordsForRisk(riskId);
  const facts = {
    amounts: [] as string[],
    dates: [] as string[],
    snippets: [] as string[]
  };
  
  if (keywords.length === 0) {
    return facts;
  }
  
  const text = contractText;
  
  // Extract amounts (currency and numbers)
  const amountRegex = /£\s?\d{1,3}(?:[,.\d]\d{0,2})*(?:\s?(?:per\s+)?(?:month|week|year|day|hour|person|tenant|room))?/gi;
  const amountMatches = text.match(amountRegex) || [];
  facts.amounts = [...new Set(amountMatches)]; // Remove duplicates
  
  // Extract dates (UK format)
  const dateRegex = /(?:\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})|(?:\d{1,2}\/\d{1,2}\/\d{4})|(?:(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4})/gi;
  const dateMatches = text.match(dateRegex) || [];
  facts.dates = [...new Set(dateMatches)]; // Remove duplicates
  
  // Extract snippets around first keyword match
  const firstKeyword = keywords[0];
  const keywordRegex = new RegExp(`\\b${firstKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
  const match = text.match(keywordRegex);
  
  if (match && match.index !== undefined) {
    const start = Math.max(0, match.index - 100);
    const end = Math.min(text.length, match.index + match[0].length + 100);
    const snippet = text.substring(start, end).trim();
    facts.snippets.push(snippet);
  }
  
  return facts;
}

/**
 * Format key info into a short, factual sentence
 */
export function formatKeyInfo(riskId: string, facts: { amounts: string[]; dates: string[]; snippets: string[] }): string {
  const { amounts, dates, snippets } = facts;
  
  // Risk-specific formatting templates
  const templates: { [key: string]: (amounts: string[], dates: string[], snippets: string[]) => string } = {
    'rent_increases': (amounts, dates, snippets) => {
      if (amounts.length > 0) {
        const rent = amounts[0];
        return `Rent is ${rent}; increases may apply annually.`;
      }
      return 'Rent amount specified with potential for increases.';
    },
    
    'deposit': (amounts, dates, snippets) => {
      if (amounts.length > 0) {
        const deposit = amounts[0];
        return `Deposit is ${deposit}, refundable subject to conditions.`;
      }
      return 'Deposit amount specified, refundable subject to conditions.';
    },
    
    'fees': (amounts, dates, snippets) => {
      if (amounts.length > 0) {
        const fee = amounts[0];
        return `Various fees apply, including ${fee}.`;
      }
      return 'Various fees and charges may apply.';
    },
    
    'utilities': (amounts, dates, snippets) => {
      return 'Utility responsibilities and billing arrangements specified.';
    },
    
    'break_clause': (amounts, dates, snippets) => {
      if (amounts.length > 0) {
        return `Break clause available with ${amounts[0]} notice.`;
      }
      return 'Break clause available with specified notice period.';
    },
    
    'renewal_notice': (amounts, dates, snippets) => {
      if (dates.length > 0) {
        return `Fixed term specified; check notice requirements before renewal.`;
      }
      return 'Fixed term specified with renewal notice requirements.';
    },
    
    'landlord_entry': (amounts, dates, snippets) => {
      return 'Landlord entry rights and notice requirements specified.';
    },
    
    'repairs': (amounts, dates, snippets) => {
      return 'Repair and maintenance responsibilities clearly defined.';
    },
    
    'pets_alterations': (amounts, dates, snippets) => {
      return 'Pet and alteration policies specified in the agreement.';
    },
    
    'parking_rules': (amounts, dates, snippets) => {
      return 'Parking arrangements and rules clearly specified.';
    },
    
    'insurance': (amounts, dates, snippets) => {
      return 'Insurance responsibilities and requirements specified.';
    },
    
    'habitability_safety': (amounts, dates, snippets) => {
      return 'Habitability and safety standards outlined in the agreement.';
    },
    
    'subletting': (amounts, dates, snippets) => {
      return 'Subletting and assignment rights clearly defined.';
    },
    
    'disputes_jurisdiction': (amounts, dates, snippets) => {
      return 'Dispute resolution and jurisdiction clearly specified.';
    },
    
    // Freelance / Services templates
    'scope': (amounts, dates, snippets) => {
      return 'Scope of work and deliverables clearly defined.';
    },
    
    'acceptance': (amounts, dates, snippets) => {
      return 'Acceptance criteria and approval process specified.';
    },
    
    'change_control': (amounts, dates, snippets) => {
      return 'Change control and revision procedures outlined.';
    },
    
    'timeline': (amounts, dates, snippets) => {
      if (dates.length > 0) {
        return `Timeline specified with key milestones and deadlines.`;
      }
      return 'Timeline and delivery schedule clearly defined.';
    },
    
    'payment': (amounts, dates, snippets) => {
      if (amounts.length > 0) {
        return `Payment terms specified, including rates and invoicing.`;
      }
      return 'Payment terms and invoicing procedures clearly defined.';
    },
    
    'expenses': (amounts, dates, snippets) => {
      return 'Expense reimbursement policies and procedures specified.';
    },
    
    'ip_ownership': (amounts, dates, snippets) => {
      return 'Intellectual property ownership and rights clearly defined.';
    },
    
    'moral_rights': (amounts, dates, snippets) => {
      return 'Moral rights and attribution requirements specified.';
    },
    
    'confidentiality': (amounts, dates, snippets) => {
      return 'Confidentiality obligations and restrictions clearly defined.';
    },
    
    'non_solicit_compete': (amounts, dates, snippets) => {
      return 'Non-solicitation and non-compete restrictions specified.';
    },
    
    'termination': (amounts, dates, snippets) => {
      return 'Termination procedures and kill fee arrangements specified.';
    },
    
    'liability_indemnity': (amounts, dates, snippets) => {
      return 'Liability limitations and indemnification provisions outlined.';
    },
    
    'warranties': (amounts, dates, snippets) => {
      return 'Warranties and guarantees clearly specified.';
    },
    
    'contractor_status': (amounts, dates, snippets) => {
      return 'Independent contractor status and tax implications specified.';
    },
    
    'governing_law': (amounts, dates, snippets) => {
      return 'Governing law and jurisdiction clearly specified.';
    }
  };
  
  const template = templates[riskId];
  if (template) {
    const result = template(amounts, dates, snippets);
    // Ensure it's a single sentence and not too long
    const sentences = result.split(/[.!?]+/).filter(s => s.trim());
    const firstSentence = sentences[0]?.trim();
    if (firstSentence && firstSentence.split(' ').length <= 25) {
      return firstSentence + '.';
    }
  }
  
  // Fallback: use amounts if available
  if (amounts.length > 0) {
    return `Amount specified: ${amounts[0]}.`;
  }
  
  // If facts are too thin, return empty string
  return '';
}
