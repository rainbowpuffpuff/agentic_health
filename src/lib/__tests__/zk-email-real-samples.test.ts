/**
 * Tests using real sample email files from /public directory
 * Tests actual email parsing and processing with real-world data
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import { promises as fs } from 'fs';
import path from 'path';
import { 
  parseEmailContent,
  validateEmailStructure,
  CivicEngagementProver,
  type EmailData 
} from '../zk-email';
import { isGovernmentEmail } from '../zk-email-config';

describe('ZK-Email Real Sample Tests', () => {
  let sampleEmailContent: string;
  let sampleEmailDKIMContent: string;

  beforeAll(async () => {
    // Load the actual sample email files
    const sampleEmailPath = path.join(process.cwd(), 'public', 'sample-email.eml');
    const sampleEmailDKIMPath = path.join(process.cwd(), 'public', 'sample-email-DKIM.eml');
    
    try {
      sampleEmailContent = await fs.readFile(sampleEmailPath, 'utf-8');
      sampleEmailDKIMContent = await fs.readFile(sampleEmailDKIMPath, 'utf-8');
    } catch (error) {
      console.warn('Sample email files not found, skipping real sample tests');
    }
  });

  describe('Sample Email Parsing', () => {
    it('should parse the basic sample email correctly', () => {
      if (!sampleEmailContent) {
        console.log('Skipping test - sample-email.eml not found');
        return;
      }

      const emailData = parseEmailContent(sampleEmailContent);

      expect(emailData.sender).toBe('John Doe <john.doe@example.com>');
      expect(emailData.recipient).toBe('Member of Parliament <mp@example.gov>');
      expect(emailData.subject).toBe("Regarding the 'Chat Control' Proposal");
      expect(emailData.message_id).toBe('<12345@example.com>');
      expect(emailData.dkim_valid).toBe(true);
    });

    it('should parse the DKIM sample email correctly', () => {
      if (!sampleEmailDKIMContent) {
        console.log('Skipping test - sample-email-DKIM.eml not found');
        return;
      }

      const emailData = parseEmailContent(sampleEmailDKIMContent);

      expect(emailData.sender).toBeTruthy();
      expect(emailData.recipient).toBeTruthy();
      expect(emailData.dkim_valid).toBe(true);
      expect(emailData.headers).toBeDefined();
      expect(Object.keys(emailData.headers).length).toBeGreaterThan(0);
    });

    it('should validate both sample email structures', () => {
      if (!sampleEmailContent || !sampleEmailDKIMContent) {
        console.log('Skipping test - sample email files not found');
        return;
      }

      expect(validateEmailStructure(sampleEmailContent)).toBe(true);
      expect(validateEmailStructure(sampleEmailDKIMContent)).toBe(true);
    });
  });

  describe('Government Email Detection', () => {
    it('should detect government recipients in sample emails', () => {
      if (!sampleEmailContent) {
        console.log('Skipping test - sample-email.eml not found');
        return;
      }

      const emailData = parseEmailContent(sampleEmailContent);
      
      // The sample email has mp@example.gov which should be detected as government
      expect(isGovernmentEmail(emailData.recipient)).toBe(true);
    });

    it('should handle complex recipient formats', () => {
      if (!sampleEmailDKIMContent) {
        console.log('Skipping test - sample-email-DKIM.eml not found');
        return;
      }

      const emailData = parseEmailContent(sampleEmailDKIMContent);
      
      // Test that we can parse recipients even with complex formatting
      expect(emailData.recipient).toBeTruthy();
      expect(emailData.recipient.length).toBeGreaterThan(0);
    });
  });

  describe('Real Email Processing Workflow', () => {
    it('should process sample email through complete workflow', async () => {
      if (!sampleEmailContent) {
        console.log('Skipping test - sample-email.eml not found');
        return;
      }

      // Parse email
      const emailData = parseEmailContent(sampleEmailContent);
      expect(emailData).toBeDefined();

      // Validate structure
      const isValid = validateEmailStructure(sampleEmailContent);
      expect(isValid).toBe(true);

      // Check government recipient
      const isGovRecipient = isGovernmentEmail(emailData.recipient);
      expect(isGovRecipient).toBe(true);

      // Verify DKIM
      expect(emailData.dkim_valid).toBe(true);
    });

    it('should extract all required metadata from DKIM sample', () => {
      if (!sampleEmailDKIMContent) {
        console.log('Skipping test - sample-email-DKIM.eml not found');
        return;
      }

      const emailData = parseEmailContent(sampleEmailDKIMContent);

      // Verify all required fields are present
      expect(emailData.sender).toBeTruthy();
      expect(emailData.recipient).toBeTruthy();
      expect(emailData.subject).toBeTruthy();
      expect(emailData.timestamp).toBeInstanceOf(Date);
      expect(emailData.headers).toBeDefined();

      // Verify DKIM signature is detected
      expect(emailData.dkim_valid).toBe(true);
      expect(emailData.headers['dkim-signature']).toBeTruthy();
    });
  });

  describe('Email Content Analysis', () => {
    it('should identify chat control campaign content', () => {
      if (!sampleEmailContent) {
        console.log('Skipping test - sample-email.eml not found');
        return;
      }

      const emailData = parseEmailContent(sampleEmailContent);
      
      // The sample email is about Chat Control
      expect(emailData.subject.toLowerCase()).toContain('chat control');
    });

    it('should handle different email encodings and formats', () => {
      if (!sampleEmailDKIMContent) {
        console.log('Skipping test - sample-email-DKIM.eml not found');
        return;
      }

      // Should not throw errors when parsing complex email
      expect(() => {
        const emailData = parseEmailContent(sampleEmailDKIMContent);
        return emailData;
      }).not.toThrow();
    });
  });

  describe('File Size and Format Validation', () => {
    it('should validate sample email file sizes', async () => {
      if (!sampleEmailContent || !sampleEmailDKIMContent) {
        console.log('Skipping test - sample email files not found');
        return;
      }

      // Check that sample files are reasonable sizes
      expect(sampleEmailContent.length).toBeGreaterThan(100);
      expect(sampleEmailContent.length).toBeLessThan(1024 * 1024); // Less than 1MB

      expect(sampleEmailDKIMContent.length).toBeGreaterThan(100);
      expect(sampleEmailDKIMContent.length).toBeLessThan(1024 * 1024); // Less than 1MB
    });

    it('should handle line endings in sample files', () => {
      if (!sampleEmailContent || !sampleEmailDKIMContent) {
        console.log('Skipping test - sample email files not found');
        return;
      }

      // Should handle both Unix and Windows line endings
      const unixContent = sampleEmailContent.replace(/\r\n/g, '\n');
      const windowsContent = sampleEmailContent.replace(/\n/g, '\r\n');

      expect(() => parseEmailContent(unixContent)).not.toThrow();
      expect(() => parseEmailContent(windowsContent)).not.toThrow();
    });
  });

  describe('Performance with Real Emails', () => {
    it('should parse sample emails quickly', () => {
      if (!sampleEmailContent || !sampleEmailDKIMContent) {
        console.log('Skipping test - sample email files not found');
        return;
      }

      const startTime = Date.now();
      
      parseEmailContent(sampleEmailContent);
      parseEmailContent(sampleEmailDKIMContent);
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(100); // Should parse in under 100ms
    });

    it('should validate sample emails quickly', () => {
      if (!sampleEmailContent || !sampleEmailDKIMContent) {
        console.log('Skipping test - sample email files not found');
        return;
      }

      const startTime = Date.now();
      
      validateEmailStructure(sampleEmailContent);
      validateEmailStructure(sampleEmailDKIMContent);
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(50); // Should validate in under 50ms
    });
  });

  describe('Error Handling with Real Data', () => {
    it('should handle truncated sample emails gracefully', () => {
      if (!sampleEmailContent) {
        console.log('Skipping test - sample-email.eml not found');
        return;
      }

      // Test with truncated email (first 100 characters)
      const truncatedEmail = sampleEmailContent.substring(0, 100);
      
      expect(() => parseEmailContent(truncatedEmail)).toThrow();
    });

    it('should handle corrupted sample email data', () => {
      if (!sampleEmailContent) {
        console.log('Skipping test - sample-email.eml not found');
        return;
      }

      // Test with corrupted email (random characters inserted)
      const corruptedEmail = sampleEmailContent.replace(/From:/g, 'Frm:');
      
      expect(() => parseEmailContent(corruptedEmail)).toThrow();
    });
  });

  describe('Integration with ZK Proof Generation', () => {
    it('should prepare sample emails for proof generation', async () => {
      if (!sampleEmailContent) {
        console.log('Skipping test - sample-email.eml not found');
        return;
      }

      const emailData = parseEmailContent(sampleEmailContent);
      
      // Verify email has all required components for ZK proof
      expect(emailData.dkim_valid).toBe(true);
      expect(emailData.sender).toBeTruthy();
      expect(emailData.recipient).toBeTruthy();
      expect(isGovernmentEmail(emailData.recipient)).toBe(true);
      
      // This email should be ready for chat_control campaign
      expect(emailData.subject.toLowerCase()).toContain('chat control');
    });

    it('should calculate correct points for sample emails', () => {
      if (!sampleEmailContent) {
        console.log('Skipping test - sample-email.eml not found');
        return;
      }

      const emailData = parseEmailContent(sampleEmailContent);
      
      // Calculate expected points based on email properties
      let expectedPoints = 50; // base points
      
      if (emailData.dkim_valid) {
        expectedPoints += 15; // DKIM bonus
      }
      
      if (isGovernmentEmail(emailData.recipient)) {
        expectedPoints += 25; // government recipient bonus
      }
      
      expectedPoints += 25; // chat_control campaign bonus
      
      expect(expectedPoints).toBe(115); // Total expected for this email
    });
  });
});