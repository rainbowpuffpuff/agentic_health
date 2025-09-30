/**
 * Comprehensive Tests for ZK-Email SDK Integration
 * Addresses mikeystever's feedback for robust test coverage
 */

import { describe, it, expect, beforeAll, beforeEach, afterEach, jest } from '@jest/globals';
import { 
  CivicEngagementProver, 
  generateSampleEmailForCampaign,
  parseEmailContent,
  validateEmailStructure,
  type Campaign,
  type EmailData,
  type CivicProof
} from '../zk-email';
import { ZK_EMAIL_DEV_CONFIG, isGovernmentEmail } from '../zk-email-config';

// Mock the ZK-Email SDK for testing
const mockBlueprint = {
  generateProof: jest.fn(),
  verifyProof: jest.fn(),
};

const mockSdk = {
  getBlueprint: jest.fn(),
  createBlueprint: jest.fn(),
};

jest.mock('@zk-email/sdk', () => ({
  initZkEmailSdk: jest.fn(() => mockSdk),
  Blueprint: jest.fn(() => mockBlueprint),
  Proof: jest.fn(),
}));

describe('ZK-Email Integration - Comprehensive Test Suite', () => {
  let prover: CivicEngagementProver;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization and Setup', () => {
    it('should initialize the SDK successfully', async () => {
      mockSdk.getBlueprint.mockResolvedValue(mockBlueprint);
      
      prover = new CivicEngagementProver();
      await prover.initialize();

      expect(prover.isInitialized()).toBe(true);
      expect(mockSdk.getBlueprint).toHaveBeenCalledWith(ZK_EMAIL_DEV_CONFIG.BLUEPRINT_ID);
    });

    it('should handle SDK initialization failure gracefully', async () => {
      mockSdk.getBlueprint.mockRejectedValue(new Error('Network error'));
      
      prover = new CivicEngagementProver();
      
      await expect(prover.initialize()).rejects.toThrow('Network error');
      expect(prover.isInitialized()).toBe(false);
    });

    it('should create blueprint if not found', async () => {
      mockSdk.getBlueprint.mockRejectedValue(new Error('Blueprint not found'));
      mockSdk.createBlueprint.mockResolvedValue(mockBlueprint);
      
      prover = new CivicEngagementProver();
      await prover.initialize();

      expect(mockSdk.createBlueprint).toHaveBeenCalled();
      expect(prover.isInitialized()).toBe(true);
    });
  });

  describe('Email Parsing and Validation', () => {
    it('should parse valid email content correctly', () => {
      const sampleEmail = generateSampleEmailForCampaign('chat_control');
      const emailData = parseEmailContent(sampleEmail);

      expect(emailData.sender).toContain('@');
      expect(emailData.recipient).toContain('@');
      expect(emailData.subject).toBeTruthy();
      expect(emailData.dkim_valid).toBe(true);
      expect(emailData.message_id).toBeTruthy();
    });

    it('should validate email structure requirements', () => {
      const validEmail = generateSampleEmailForCampaign('sugar_tax');
      expect(validateEmailStructure(validEmail)).toBe(true);

      const invalidEmail = 'Not an email';
      expect(validateEmailStructure(invalidEmail)).toBe(false);
    });

    it('should handle malformed email headers', () => {
      const malformedEmail = `From: test@example.com
To: invalid-recipient
Subject: Missing DKIM`;

      expect(() => parseEmailContent(malformedEmail)).toThrow();
    });

    it('should detect government email recipients', () => {
      expect(isGovernmentEmail('senator@senate.gov')).toBe(true);
      expect(isGovernmentEmail('rep@house.gov')).toBe(true);
      expect(isGovernmentEmail('user@gmail.com')).toBe(false);
    });
  });

  describe('ZK Proof Generation', () => {
    beforeEach(async () => {
      mockSdk.getBlueprint.mockResolvedValue(mockBlueprint);
      prover = new CivicEngagementProver();
      await prover.initialize();
    });

    it('should generate valid proofs for all campaigns', async () => {
      const campaigns: Campaign[] = ['chat_control', 'sugar_tax', 'sleep_compensation'];
      
      mockBlueprint.generateProof.mockResolvedValue({
        proof: 'mock-proof-data',
        publicSignals: ['signal1', 'signal2']
      });

      for (const campaign of campaigns) {
        const sampleEmail = generateSampleEmailForCampaign(campaign);
        const proof = await prover.generateCivicProof(sampleEmail, campaign);

        expect(proof).toBeDefined();
        expect(proof.campaign).toBe(campaign);
        expect(proof.points_awarded).toBeGreaterThan(0);
        expect(proof.timestamp).toBeGreaterThan(0);
      }
    });

    it('should calculate correct points based on email properties', async () => {
      mockBlueprint.generateProof.mockResolvedValue({
        proof: 'mock-proof-data',
        publicSignals: ['signal1', 'signal2']
      });

      const govEmail = generateSampleEmailForCampaign('chat_control', 'senator@senate.gov');
      const proof = await prover.generateCivicProof(govEmail, 'chat_control');

      const config = ZK_EMAIL_DEV_CONFIG.CAMPAIGN_POINTS.chat_control;
      const expectedPoints = config.base + config.campaign_bonus + 
                           config.dkim_bonus + config.gov_recipient_bonus;

      expect(proof.points_awarded).toBe(expectedPoints);
      expect(proof.recipient_verified).toBe(true);
    });

    it('should handle proof generation failures', async () => {
      mockBlueprint.generateProof.mockRejectedValue(new Error('Proof generation failed'));

      const sampleEmail = generateSampleEmailForCampaign('sugar_tax');
      
      await expect(prover.generateCivicProof(sampleEmail, 'sugar_tax'))
        .rejects.toThrow('Proof generation failed');
    });
  });

  describe('Proof Verification', () => {
    beforeEach(async () => {
      mockSdk.getBlueprint.mockResolvedValue(mockBlueprint);
      prover = new CivicEngagementProver();
      await prover.initialize();
    });

    it('should verify valid proofs successfully', async () => {
      mockBlueprint.verifyProof.mockResolvedValue(true);

      const mockProof: CivicProof = {
        proof: { proof: 'valid-proof', publicSignals: [] } as any,
        campaign: 'chat_control',
        timestamp: Date.now(),
        recipient_verified: true,
        points_awarded: 100
      };

      const isValid = await prover.verifyProof(mockProof);
      expect(isValid).toBe(true);
      expect(mockBlueprint.verifyProof).toHaveBeenCalledWith(mockProof.proof);
    });

    it('should reject invalid proofs', async () => {
      mockBlueprint.verifyProof.mockResolvedValue(false);

      const mockProof: CivicProof = {
        proof: { proof: 'invalid-proof', publicSignals: [] } as any,
        campaign: 'sugar_tax',
        timestamp: Date.now(),
        recipient_verified: false,
        points_awarded: 50
      };

      const isValid = await prover.verifyProof(mockProof);
      expect(isValid).toBe(false);
    });

    it('should handle verification errors gracefully', async () => {
      mockBlueprint.verifyProof.mockRejectedValue(new Error('Verification failed'));

      const mockProof: CivicProof = {
        proof: { proof: 'error-proof', publicSignals: [] } as any,
        campaign: 'sleep_compensation',
        timestamp: Date.now(),
        recipient_verified: true,
        points_awarded: 75
      };

      await expect(prover.verifyProof(mockProof)).rejects.toThrow('Verification failed');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty email content', () => {
      expect(() => parseEmailContent('')).toThrow('Email content cannot be empty');
    });

    it('should handle invalid campaign types', async () => {
      mockSdk.getBlueprint.mockResolvedValue(mockBlueprint);
      prover = new CivicEngagementProver();
      await prover.initialize();

      const sampleEmail = generateSampleEmailForCampaign('chat_control');
      
      await expect(prover.generateCivicProof(sampleEmail, 'invalid_campaign' as Campaign))
        .rejects.toThrow('Invalid campaign type');
    });

    it('should handle missing DKIM signatures', () => {
      const emailWithoutDKIM = `From: test@example.com
To: recipient@gov.org
Subject: Test Email
Date: Mon, 1 Jan 2024 12:00:00 +0000

Test content`;

      const emailData = parseEmailContent(emailWithoutDKIM);
      expect(emailData.dkim_valid).toBe(false);
    });

    it('should validate timestamp ranges', async () => {
      mockSdk.getBlueprint.mockResolvedValue(mockBlueprint);
      mockBlueprint.generateProof.mockResolvedValue({
        proof: 'mock-proof-data',
        publicSignals: ['signal1', 'signal2']
      });

      prover = new CivicEngagementProver();
      await prover.initialize();

      const sampleEmail = generateSampleEmailForCampaign('chat_control');
      const proof = await prover.generateCivicProof(sampleEmail, 'chat_control');

      const now = Date.now();
      expect(proof.timestamp).toBeGreaterThan(now - 5000); // Within 5 seconds
      expect(proof.timestamp).toBeLessThanOrEqual(now);
    });
  });

  describe('Integration Tests', () => {
    it('should complete full workflow: generate → verify', async () => {
      mockSdk.getBlueprint.mockResolvedValue(mockBlueprint);
      mockBlueprint.generateProof.mockResolvedValue({
        proof: 'integration-test-proof',
        publicSignals: ['signal1', 'signal2']
      });
      mockBlueprint.verifyProof.mockResolvedValue(true);

      prover = new CivicEngagementProver();
      await prover.initialize();

      // Generate proof
      const sampleEmail = generateSampleEmailForCampaign('sleep_compensation');
      const proof = await prover.generateCivicProof(sampleEmail, 'sleep_compensation');

      // Verify proof
      const isValid = await prover.verifyProof(proof);

      expect(proof).toBeDefined();
      expect(isValid).toBe(true);
      expect(mockBlueprint.generateProof).toHaveBeenCalled();
      expect(mockBlueprint.verifyProof).toHaveBeenCalledWith(proof.proof);
    });

    it('should handle concurrent proof generation', async () => {
      mockSdk.getBlueprint.mockResolvedValue(mockBlueprint);
      mockBlueprint.generateProof.mockResolvedValue({
        proof: 'concurrent-proof',
        publicSignals: ['signal1', 'signal2']
      });

      prover = new CivicEngagementProver();
      await prover.initialize();

      const campaigns: Campaign[] = ['chat_control', 'sugar_tax', 'sleep_compensation'];
      const proofPromises = campaigns.map(campaign => {
        const email = generateSampleEmailForCampaign(campaign);
        return prover.generateCivicProof(email, campaign);
      });

      const proofs = await Promise.all(proofPromises);
      
      expect(proofs).toHaveLength(3);
      proofs.forEach((proof, index) => {
        expect(proof.campaign).toBe(campaigns[index]);
      });
    });
  });
});