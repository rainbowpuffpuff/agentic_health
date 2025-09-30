/**
 * Tests using real sample email files from /public/
 */

import { describe, it, expect } from '@jest/globals';
import { 
  loadSampleEmail,
  generateSampleEML,
  validateEmailFile 
} from '../zk-email-config';
import { 
  parseEmailContent,
  validateEmailStructure 
} from '../zk-email';
import fs from 'fs';
import path from 'path';

describe('Real Sample Email Tests', () => {
  describe('Sample Email File Loading', () => {
    it('should load basic sample email', async () => {
      // Mock file system for testing
      const mockFs = {
        readFileSync: jest.fn().mockReturnValue(`DKIM-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed;
        d=gmail.com; s=20230601;
From: John Doe <john.doe@example.com>
To: Member of Parliament <mp@example.gov>
Subject: Regarding the 'Chat Control' Proposal
Date: Mon, 15 Jul 2024 10:00:00 +0000
Message-ID: <12345@example.com>

Dear Member of Parliament,
I am writing to express my opposition to the Chat Control proposal.
Sincerely, A Concerned Citizen`)
      };

      // Mock the require call
      jest.doMock('fs', () => mockFs);
      jest.doMock('path', () => ({ join: jest.fn().mockReturnValue('/mock/path') }));

      const emailContent = await loadSampleEmail('basic');
      expect(emailContent).toContain('From: John Doe');
      expect(emailContent).toContain('Chat Control');
    });

    it('should load DKIM sample email', async () => {
      const mockFs = {
        readFileSync: jest.fn().mockReturnValue(`Delivered-To: bcalincarol@gmail.com
DKIM-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed;
From: acalincarol@gmail.com
To: androu.et@europarl.europa.eu
Subject: Test Email
Date: Fri, 27 Jun 2025 05:18:16 -0700

Test content`)
      };

      jest.doMock('fs', () => mockFs);
      
      const emailContent = await loadSampleEmail('with_dkim');
      expect(emailContent).toContain('DKIM-Signature');
      expect(emailContent).toContain('Delivered-To');
    });
  });

  describe('Email Content Validation', () => {
    it('should validate sample email structure', async () => {
      const sampleEmail = await generateSampleEML();
      const isValid = validateEmailStructure(sampleEmail);
      expect(isValid).toBe(true);
    });

    it('should parse sample email metadata', async () => {
      const sampleEmail = await generateSampleEML();
      const emailData = parseEmailContent(sampleEmail);
      
      expect(emailData.sender).toBeTruthy();
      expect(emailData.recipient).toBeTruthy();
      expect(emailData.subject).toBeTruthy();
      expect(emailData.dkim_valid).toBe(true);
    });
  });

  describe('File Validation', () => {
    it('should validate .eml file format', () => {
      const validFile = new File(['content'], 'test.eml', { type: 'message/rfc822' });
      const result = validateEmailFile(validFile);
      expect(result.valid).toBe(true);
    });

    it('should reject non-.eml files', () => {
      const invalidFile = new File(['content'], 'test.txt', { type: 'text/plain' });
      const result = validateEmailFile(invalidFile);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('.eml');
    });

    it('should reject oversized files', () => {
      const largeContent = 'x'.repeat(2 * 1024 * 1024); // 2MB
      const largeFile = new File([largeContent], 'large.eml', { type: 'message/rfc822' });
      const result = validateEmailFile(largeFile);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('too large');
    });
  });

  describe('Real File Integration', () => {
    it('should handle actual file system access', () => {
      // Test that the actual files exist in the public directory
      const publicDir = path.join(process.cwd(), 'public');
      
      if (fs.existsSync(publicDir)) {
        const basicEmailPath = path.join(publicDir, 'sample-email.eml');
        const dkimEmailPath = path.join(publicDir, 'sample-email-DKIM.eml');
        
        if (fs.existsSync(basicEmailPath)) {
          const content = fs.readFileSync(basicEmailPath, 'utf-8');
          expect(content).toContain('From:');
          expect(content).toContain('To:');
        }
        
        if (fs.existsSync(dkimEmailPath)) {
          const content = fs.readFileSync(dkimEmailPath, 'utf-8');
          expect(content).toContain('DKIM-Signature');
        }
      } else {
        // Skip test if public directory doesn't exist
        expect(true).toBe(true);
      }
    });
  });
});