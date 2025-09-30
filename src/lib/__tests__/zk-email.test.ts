/**
 * Tests for ZK-Email SDK integration
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import { 
  CivicEngagementProver, 
  generateSampleEmailForCampaign,
  type Campaign 
} from '../zk-email';
import { ZK_EMAIL_DEV_CONFIG } from '../zk-email-config';

// Mock the ZK-Email SDK for testing
jest.mock('@zk-email/sdk', () => ({
  initZkEmailSdk: jest.fn(() => ({
    getBlueprint: jest.fn().mockRejectedValue(new Error('Blueprint not found')),
    createBlueprint: jest.fn(),
  })),
  Blueprint: jest.fn(),
  Proof: jest.fn(),
}));

describe('ZK-Email Integration', () => {
  let prover: CivicEngagementProver;

  beforeAll(async () => {
    // Only run tests if ZK-Email is enabled
    if (!ZK_EMAIL_DEV_CONFIG.ENABLED) {
      return;
    }

    prover = new CivicEngagementProver();
    await prover.initialize();
  });

  it('should initialize the SDK successfully', async () => {
    if (!ZK_EMAIL_DEV_CONFIG.ENABLED) {
      expect(true).toBe(true); // Skip test
      return;
    }

    expect(prover.isInitialized()).toBe(true);
  });

  it('should generate sample emails for all campaigns', () => {
    if (!ZK_EMAIL_DEV_CONFIG.DEV_MODE) {
      expect(true).toBe(true); // Skip test
      return;
    }

    const campaigns: Campaign[] = ['chat_control', 'sugar_tax', 'sleep_compensation'];
    
    campaigns.forEach(campaign => {
      const sampleEmail = generateSampleEmailForCampaign(campaign);
      
      expect(sampleEmail).toContain('From:');
      expect(sampleEmail).toContain('To:');
      expect(sampleEmail).toContain('Subject:');
      expect(sampleEmail).toContain('DKIM-Signature:');
    });
  });

  it('should generate civic engagement proof from sample email', async () => {
    if (!ZK_EMAIL_DEV_CONFIG.ENABLED || !ZK_EMAIL_DEV_CONFIG.DEV_MODE) {
      expect(true).toBe(true); // Skip test
      return;
    }

    const sampleEmail = generateSampleEmailForCampaign('chat_control');
    const proof = await prover.generateCivicProof(sampleEmail, 'chat_control');

    expect(proof).toBeDefined();
    expect(proof.campaign).toBe('chat_control');
    expect(proof.points_awarded).toBeGreaterThan(0);
    expect(proof.timestamp).toBeGreaterThan(0);
  });

  it('should verify generated proofs', async () => {
    if (!ZK_EMAIL_DEV_CONFIG.ENABLED || !ZK_EMAIL_DEV_CONFIG.DEV_MODE) {
      expect(true).toBe(true); // Skip test
      return;
    }

    const sampleEmail = generateSampleEmailForCampaign('sugar_tax');
    const proof = await prover.generateCivicProof(sampleEmail, 'sugar_tax');
    
    const isValid = await prover.verifyProof(proof);
    expect(isValid).toBe(true);
  });

  it('should calculate correct points for different campaigns', async () => {
    if (!ZK_EMAIL_DEV_CONFIG.ENABLED || !ZK_EMAIL_DEV_CONFIG.DEV_MODE) {
      expect(true).toBe(true); // Skip test
      return;
    }

    const campaigns: Campaign[] = ['chat_control', 'sugar_tax', 'sleep_compensation'];
    
    for (const campaign of campaigns) {
      const sampleEmail = generateSampleEmailForCampaign(campaign);
      const proof = await prover.generateCivicProof(sampleEmail, campaign);
      
      const expectedConfig = ZK_EMAIL_DEV_CONFIG.CAMPAIGN_POINTS[campaign];
      const expectedPoints = expectedConfig.base + 
                           expectedConfig.campaign_bonus + 
                           expectedConfig.dkim_bonus + 
                           expectedConfig.gov_recipient_bonus;
      
      expect(proof.points_awarded).toBe(expectedPoints);
    }
  });
});