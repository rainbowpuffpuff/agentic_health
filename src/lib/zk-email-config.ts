/**
 * ZK-Email Development Configuration
 * 
 * Configuration settings for ZK-Email SDK development environment
 */

export const ZK_EMAIL_DEV_CONFIG = {
  // Enable/disable ZK-Email features
  ENABLED: process.env.NEXT_PUBLIC_ZK_EMAIL_ENABLED === 'true',
  
  // Development mode settings
  DEV_MODE: process.env.NEXT_PUBLIC_ZK_EMAIL_DEV_MODE === 'true',
  
  // Blueprint configuration - using existing parliament blueprint
  BLUEPRINT_ID: process.env.NEXT_PUBLIC_ZK_EMAIL_BLUEPRINT_ID || '0213eb97-8d11-4e69-a35f-e152c311c2d7',
  BLUEPRINT_SLUG: process.env.NEXT_PUBLIC_ZK_EMAIL_BLUEPRINT_SLUG || 'rainbowpuffpuff/parliament_1',
  
  // Registry settings
  REGISTRY_URL: process.env.ZK_EMAIL_REGISTRY_URL || 'https://registry.zk.email',
  
  // Timeouts and limits
  PROOF_TIMEOUT: 30000, // 30 seconds
  MAX_EMAIL_SIZE: 1024 * 1024, // 1MB
  
  // Reference sample email files (use actual files from /public/)
  SAMPLE_EMAIL_FILES: {
    basic: '/sample-email.eml',           // Basic format example
    with_dkim: '/sample-email-DKIM.eml'  // Full DKIM signature example
  },
  
  // Government domain patterns for verification
  GOVERNMENT_DOMAINS: [
    '.gov',
    '.gov.uk',
    '.gov.us',
    '.senate.gov',
    '.house.gov',
    '.state.gov',
    '.europa.eu',
    '.parliament.uk',
    '.parliament.gov.uk',
    '.bundestag.de',
    '.assemblee-nationale.fr',
  ],
  
  // Campaign point values
  CAMPAIGN_POINTS: {
    chat_control: {
      base: 50,
      dkim_bonus: 15,
      gov_recipient_bonus: 25,
      campaign_bonus: 25,
    },
    sugar_tax: {
      base: 50,
      dkim_bonus: 15,
      gov_recipient_bonus: 25,
      campaign_bonus: 20,
    },
    sleep_compensation: {
      base: 50,
      dkim_bonus: 15,
      gov_recipient_bonus: 25,
      campaign_bonus: 30,
    },
  },
};

/**
 * Load sample email content from public files
 */
export async function loadSampleEmail(type: 'basic' | 'with_dkim' = 'with_dkim'): Promise<string> {
  const filePath = ZK_EMAIL_DEV_CONFIG.SAMPLE_EMAIL_FILES[type];
  
  if (typeof window !== 'undefined') {
    // Client-side: fetch from public directory
    const response = await fetch(filePath);
    if (!response.ok) {
      throw new Error(`Failed to load sample email: ${response.statusText}`);
    }
    return await response.text();
  } else {
    // Server-side: read from file system
    const fs = require('fs');
    const path = require('path');
    const fullPath = path.join(process.cwd(), 'public', filePath.replace('/public/', ''));
    return fs.readFileSync(fullPath, 'utf-8');
  }
}

/**
 * Generate sample email for testing (uses real reference files)
 */
export async function generateSampleEML(campaign?: Campaign): Promise<string> {
  // Always use the DKIM sample as it's the most complete
  return await loadSampleEmail('with_dkim');
}

/**
 * Validate email format and size
 */
export function validateEmailFile(file: File): { valid: boolean; error?: string } {
  if (!file.name.endsWith('.eml')) {
    return { valid: false, error: 'File must be a .eml email file' };
  }
  
  if (file.size > ZK_EMAIL_DEV_CONFIG.MAX_EMAIL_SIZE) {
    return { valid: false, error: 'Email file is too large (max 1MB)' };
  }
  
  return { valid: true };
}

/**
 * Check if recipient appears to be a government email
 */
export function isGovernmentEmail(email: string): boolean {
  const lowerEmail = email.toLowerCase();
  return ZK_EMAIL_DEV_CONFIG.GOVERNMENT_DOMAINS.some(domain => 
    lowerEmail.includes(domain)
  );
}

export type Campaign = 'chat_control' | 'sugar_tax' | 'sleep_compensation';

/**
 * Get campaign configuration by campaign type
 */
export function getCampaignConfig(campaign: Campaign) {
  const config = ZK_EMAIL_DEV_CONFIG.CAMPAIGN_POINTS[campaign];
  if (!config) {
    throw new Error(`Invalid campaign type: ${campaign}`);
  }
  return config;
}

/**
 * Validate the entire ZK-Email configuration
 */
export function validateConfiguration(): boolean {
  try {
    // Check required fields
    if (!ZK_EMAIL_DEV_CONFIG.BLUEPRINT_ID) return false;
    if (!ZK_EMAIL_DEV_CONFIG.REGISTRY_URL) return false;
    
    // Check campaign configurations
    const campaigns = Object.keys(ZK_EMAIL_DEV_CONFIG.CAMPAIGN_POINTS);
    for (const campaign of campaigns) {
      const config = ZK_EMAIL_DEV_CONFIG.CAMPAIGN_POINTS[campaign as Campaign];
      if (!config || typeof config.base !== 'number') return false;
    }
    
    // Check sample email files exist
    if (!ZK_EMAIL_DEV_CONFIG.SAMPLE_EMAIL_FILES.basic) return false;
    if (!ZK_EMAIL_DEV_CONFIG.SAMPLE_EMAIL_FILES.with_dkim) return false;
    
    return true;
  } catch (error) {
    return false;
  }
}