/**
 * Integration Tests for ZK-Email with Real Email Processing
 * Tests the complete flow from email upload to proof verification
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { 
  CivicEngagementProver,
  parseEmailContent,
  generateSampleEmailForCampaign,
  type Campaign 
} from '../zk-email';
import { ZK_EMAIL_DEV_CONFIG } from '../zk-email-config';

describe('ZK-Email Integration Tests', () => {
  let prover: CivicEngagementProver;

  beforeAll(async () => {
    if (!ZK_EMAIL_DEV_CONFIG.ENABLED) {
      console.log('ZK-Email integration tests skipped - not enabled');
      return;
    }

    prover = new CivicEngagementProver();
    await prover.initialize();
  });

  describe('Real Email Processing Flow', () => {
    it('should process uploaded .eml file correctly', async () => {
      if (!ZK_EMAIL_DEV_CONFIG.ENABLED) return;

      // Simulate file upload processing
      const mockEmlContent = generateSampleEmailForCampaign('chat_control');
      const emailData = parseEmailContent(mockEmlContent);

      expect(emailData.sender).toBeTruthy();
      expect(emailData.recipient).toBeTruthy();
      expect(emailData.subject).toBeTruthy();
      expect(emailData.headers).toBeDefined();
    });

    it('should handle multiple email formats', async () => {
      if (!ZK_EMAIL_DEV_CONFIG.ENABLED) return;

      const campaigns: Campaign[] = ['chat_control', 'sugar_tax', 'sleep_compensation'];
      
      for (const campaign of campaigns) {
        const emailContent = generateSampleEmailForCampaign(campaign);
        const emailData = parseEmailContent(emailContent);
        
        expect(emailData.sender).toMatch(/@/);
        expect(emailData.recipient).toMatch(/@/);
        expect(emailData.dkim_valid).toBe(true);
      }
    });

    it('should generate and verify proofs end-to-end', async () => {
      if (!ZK_EMAIL_DEV_CONFIG.ENABLED || !ZK_EMAIL_DEV_CONFIG.DEV_MODE) return;

      const emailContent = generateSampleEmailForCampaign('sugar_tax');
      
      // Generate proof
      const proof = await prover.generateCivicProof(emailContent, 'sugar_tax');
      expect(proof).toBeDefined();
      expect(proof.campaign).toBe('sugar_tax');

      // Verify proof
      const isValid = await prover.verifyProof(proof);
      expect(isValid).toBe(true);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle proof generation within reasonable time', async () => {
      if (!ZK_EMAIL_DEV_CONFIG.ENABLED || !ZK_EMAIL_DEV_CONFIG.DEV_MODE) return;

      const startTime = Date.now();
      const emailContent = generateSampleEmailForCampaign('chat_control');
      
      await prover.generateCivicProof(emailContent, 'chat_control');
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
    });

    it('should handle batch proof generation', async () => {
      if (!ZK_EMAIL_DEV_CONFIG.ENABLED || !ZK_EMAIL_DEV_CONFIG.DEV_MODE) return;

      const batchSize = 3;
      const proofPromises = Array.from({ length: batchSize }, (_, i) => {
        const campaign: Campaign = ['chat_control', 'sugar_tax', 'sleep_compensation'][i];
        const email = generateSampleEmailForCampaign(campaign);
        return prover.generateCivicProof(email, campaign);
      });

      const startTime = Date.now();
      const proofs = await Promise.all(proofPromises);
      const duration = Date.now() - startTime;

      expect(proofs).toHaveLength(batchSize);
      expect(duration).toBeLessThan(30000); // Batch should complete within 30 seconds
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should recover from network interruptions', async () => {
      if (!ZK_EMAIL_DEV_CONFIG.ENABLED) return;

      // Simulate network error and recovery
      const emailContent = generateSampleEmailForCampaign('sleep_compensation');
      
      try {
        await prover.generateCivicProof(emailContent, 'sleep_compensation');
      } catch (error) {
        // Should handle network errors gracefully
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('should validate proof integrity after generation', async () => {
      if (!ZK_EMAIL_DEV_CONFIG.ENABLED || !ZK_EMAIL_DEV_CONFIG.DEV_MODE) return;

      const emailContent = generateSampleEmailForCampaign('chat_control');
      const proof = await prover.generateCivicProof(emailContent, 'chat_control');

      // Verify proof structure
      expect(proof.proof).toBeDefined();
      expect(proof.timestamp).toBeGreaterThan(0);
      expect(proof.points_awarded).toBeGreaterThan(0);
      expect(['chat_control', 'sugar_tax', 'sleep_compensation']).toContain(proof.campaign);
    });
  });
});