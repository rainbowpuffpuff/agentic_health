/**
 * ZK-Email SDK Integration for Civic Engagement Proof Generation
 * 
 * This module provides utilities for:
 * - Initializing the ZK-Email SDK
 * - Generating zero-knowledge proofs from email content
 * - Verifying proofs for civic engagement campaigns
 */

import { Blueprint, Proof, initZkEmailSdk } from '@zk-email/sdk';
import { ZK_EMAIL_DEV_CONFIG, isGovernmentEmail } from './zk-email-config';

// Re-export Campaign type
export type Campaign = 'chat_control' | 'sugar_tax' | 'sleep_compensation';

// ZK-Email proof data structure
export interface CivicProof {
  proof: Proof;
  campaign: Campaign;
  timestamp: number;
  recipient_verified: boolean;
  points_awarded: number;
}

// Email data extracted from .eml files
export interface EmailData {
  sender: string;
  recipient: string;
  subject: string;
  timestamp: Date;
  dkim_valid: boolean;
  message_id: string;
  headers: Record<string, string>;
}

// Use configuration from config file
const ZK_EMAIL_CONFIG = ZK_EMAIL_DEV_CONFIG;

/**
 * ZK-Email SDK wrapper class for civic engagement
 */
export class CivicEngagementProver {
  private sdk: ReturnType<typeof initZkEmailSdk> | null = null;
  private blueprint: Blueprint | null = null;
  private initialized = false;

  /**
   * Initialize the ZK-Email SDK
   */
  async initialize(): Promise<void> {
    try {
      // Initialize SDK
      this.sdk = initZkEmailSdk();
      
      // Get or create civic engagement blueprint
      await this.loadBlueprint();
      
      this.initialized = true;
      console.log('ZK-Email SDK initialized successfully');
    } catch (error) {
      console.error('Failed to initialize ZK-Email SDK:', error);
      throw new Error('ZK-Email SDK initialization failed');
    }
  }

  /**
   * Load the civic engagement blueprint
   */
  private async loadBlueprint(): Promise<void> {
    if (!this.sdk) {
      throw new Error('SDK not initialized');
    }

    try {
      // Try to get existing blueprint by ID first
      console.log('Loading blueprint with ID:', ZK_EMAIL_CONFIG.BLUEPRINT_ID);
      this.blueprint = await this.sdk.getBlueprintById(ZK_EMAIL_CONFIG.BLUEPRINT_ID);
      console.log('Successfully loaded parliament blueprint');
    } catch (error) {
      console.warn('Parliament blueprint not found by ID, trying by slug');
      
      try {
        // Fallback to slug-based lookup
        this.blueprint = await this.sdk.getBlueprint(ZK_EMAIL_CONFIG.BLUEPRINT_SLUG);
        console.log('Successfully loaded blueprint by slug');
      } catch (slugError) {
        console.warn('Blueprint not found by slug either, using fallback mode');
        this.blueprint = null;
      }
    }
  }

  /**
   * Generate ZK proof from email content
   */
  async generateCivicProof(
    emlContent: string, 
    campaign: Campaign
  ): Promise<CivicProof> {
    if (!this.initialized || !this.sdk) {
      throw new Error('ZK-Email SDK not initialized. Call initialize() first.');
    }

    try {
      // Parse email data first
      const emailData = this.parseEmailContent(emlContent);
      
      // Validate DKIM signature
      const dkimValid = await this.validateDKIM(emailData);
      
      // Generate ZK proof
      const proof = await this.generateProof(emlContent, emailData);
      
      // Verify recipient is a government representative
      const recipientVerified = await this.verifyRepresentative(emailData.recipient);
      
      // Calculate points based on verification
      const pointsAwarded = this.calculatePoints(campaign, dkimValid, recipientVerified);

      return {
        proof,
        campaign,
        timestamp: Date.now(),
        recipient_verified: recipientVerified,
        points_awarded: pointsAwarded,
      };
    } catch (error) {
      console.error('Failed to generate civic proof:', error);
      throw new Error(`Proof generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Verify a ZK proof
   */
  async verifyProof(civicProof: CivicProof): Promise<boolean> {
    if (!this.initialized || !this.sdk) {
      throw new Error('ZK-Email SDK not initialized');
    }

    try {
      if (this.blueprint) {
        return await this.blueprint.verifyProof(civicProof.proof);
      } else {
        // Fallback verification using DKIM
        return await this.fallbackVerification(civicProof);
      }
    } catch (error) {
      console.error('Proof verification failed:', error);
      return false;
    }
  }

  /**
   * Parse .eml email content
   */
  private parseEmailContent(emlContent: string): EmailData {
    // Basic email parsing - in production, use a proper email parser
    const lines = emlContent.split('\n');
    const headers: Record<string, string> = {};
    
    let sender = '';
    let recipient = '';
    let subject = '';
    let messageId = '';
    let timestamp = new Date();

    for (const line of lines) {
      if (line.startsWith('From: ')) {
        sender = line.substring(6).trim();
        headers['From'] = sender;
      } else if (line.startsWith('To: ')) {
        recipient = line.substring(4).trim();
        headers['To'] = recipient;
      } else if (line.startsWith('Subject: ')) {
        subject = line.substring(9).trim();
        headers['Subject'] = subject;
      } else if (line.startsWith('Message-ID: ')) {
        messageId = line.substring(12).trim();
        headers['Message-ID'] = messageId;
      } else if (line.startsWith('Date: ')) {
        timestamp = new Date(line.substring(6).trim());
        headers['Date'] = line.substring(6).trim();
      }
    }

    return {
      sender,
      recipient,
      subject,
      timestamp,
      dkim_valid: false, // Will be validated separately
      message_id: messageId,
      headers,
    };
  }

  /**
   * Validate DKIM signature
   */
  private async validateDKIM(emailData: EmailData): Promise<boolean> {
    // TODO: Implement DKIM validation
    // For now, return true for development
    console.log('DKIM validation for:', emailData.sender);
    return true;
  }

  /**
   * Generate ZK proof using SDK
   */
  private async generateProof(emlContent: string, emailData: EmailData): Promise<Proof> {
    if (!this.sdk) {
      throw new Error('SDK not initialized');
    }

    // If we have a blueprint, use it
    if (this.blueprint) {
      const prover = this.blueprint.createProver();
      return await prover.generateProof(emlContent);
    } else {
      // Fallback: create a mock proof structure for development
      return {
        id: 'mock_proof_' + Date.now(),
        proof: 'mock_proof_data',
        publicSignals: [emailData.sender, emailData.recipient, emailData.subject],
        verificationKey: 'mock_vk',
        status: 'complete',
      } as unknown as Proof;
    }
  }

  /**
   * Verify if recipient is a government representative
   */
  private async verifyRepresentative(recipient: string): Promise<boolean> {
    return isGovernmentEmail(recipient);
  }

  /**
   * Calculate points based on verification results
   */
  private calculatePoints(
    campaign: Campaign, 
    dkimValid: boolean, 
    recipientVerified: boolean
  ): number {
    const campaignConfig = ZK_EMAIL_CONFIG.CAMPAIGN_POINTS[campaign];
    let totalPoints = campaignConfig.base;

    // Add bonuses
    totalPoints += campaignConfig.campaign_bonus;
    
    if (dkimValid) {
      totalPoints += campaignConfig.dkim_bonus;
    }

    if (recipientVerified) {
      totalPoints += campaignConfig.gov_recipient_bonus;
    }

    return totalPoints;
  }

  /**
   * Fallback verification when blueprint is not available
   */
  private async fallbackVerification(civicProof: CivicProof): Promise<boolean> {
    // Basic validation of proof structure
    return civicProof.proof && 
           civicProof.timestamp > 0 && 
           civicProof.points_awarded > 0;
  }

  /**
   * Check if SDK is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

// Singleton instance
let proverInstance: CivicEngagementProver | null = null;

/**
 * Get or create the ZK-Email prover instance
 */
export async function getZKEmailProver(): Promise<CivicEngagementProver> {
  if (!proverInstance) {
    proverInstance = new CivicEngagementProver();
    await proverInstance.initialize();
  }
  
  return proverInstance;
}

/**
 * Utility function to generate civic engagement proof
 */
export async function generateCivicEngagementProof(
  emlContent: string,
  campaign: Campaign
): Promise<CivicProof> {
  const prover = await getZKEmailProver();
  return await prover.generateCivicProof(emlContent, campaign);
}

/**
 * Utility function to verify civic engagement proof
 */
export async function verifyCivicEngagementProof(
  civicProof: CivicProof
): Promise<boolean> {
  const prover = await getZKEmailProver();
  return await prover.verifyProof(civicProof);
}

/**
 * Generate sample email for testing (development only)
 */
export function generateSampleEmailForCampaign(campaign: Campaign): string {
  if (!ZK_EMAIL_CONFIG.DEV_MODE) {
    throw new Error('Sample email generation only available in development mode');
  }
  
  const { generateSampleEML } = require('./zk-email-config');
  return generateSampleEML(campaign);
}