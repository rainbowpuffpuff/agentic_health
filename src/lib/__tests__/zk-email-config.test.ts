/**
 * Tests for ZK-Email Configuration and Utilities
 */

import { describe, it, expect } from '@jest/globals';
import { 
  ZK_EMAIL_DEV_CONFIG, 
  isGovernmentEmail,
  getCampaignConfig,
  validateConfiguration 
} from '../zk-email-config';

describe('ZK-Email Configuration Tests', () => {
  describe('Configuration Validation', () => {
    it('should have valid configuration structure', () => {
      expect(ZK_EMAIL_DEV_CONFIG).toBeDefined();
      expect(ZK_EMAIL_DEV_CONFIG.ENABLED).toBeDefined();
      expect(ZK_EMAIL_DEV_CONFIG.DEV_MODE).toBeDefined();
      expect(ZK_EMAIL_DEV_CONFIG.BLUEPRINT_ID).toBeTruthy();
    });

    it('should have campaign configurations for all campaigns', () => {
      const campaigns = ['chat_control', 'sugar_tax', 'sleep_compensation'];
      
      campaigns.forEach(campaign => {
        const config = ZK_EMAIL_DEV_CONFIG.CAMPAIGN_POINTS[campaign];
        expect(config).toBeDefined();
        expect(config.base).toBeGreaterThan(0);
        expect(config.campaign_bonus).toBeGreaterThanOrEqual(0);
        expect(config.dkim_bonus).toBeGreaterThanOrEqual(0);
        expect(config.gov_recipient_bonus).toBeGreaterThanOrEqual(0);
      });
    });

    it('should validate government email domains', () => {
      const govEmails = [
        'senator@senate.gov',
        'rep@house.gov',
        'official@whitehouse.gov',
        'contact@state.gov'
      ];

      const nonGovEmails = [
        'user@gmail.com',
        'contact@company.com',
        'test@example.org'
      ];

      govEmails.forEach(email => {
        expect(isGovernmentEmail(email)).toBe(true);
      });

      nonGovEmails.forEach(email => {
        expect(isGovernmentEmail(email)).toBe(false);
      });
    });

    it('should return correct campaign configurations', () => {
      const chatControlConfig = getCampaignConfig('chat_control');
      expect(chatControlConfig).toBeDefined();
      expect(chatControlConfig.base).toBe(ZK_EMAIL_DEV_CONFIG.CAMPAIGN_POINTS.chat_control.base);

      const sugarTaxConfig = getCampaignConfig('sugar_tax');
      expect(sugarTaxConfig).toBeDefined();
      expect(sugarTaxConfig.base).toBe(ZK_EMAIL_DEV_CONFIG.CAMPAIGN_POINTS.sugar_tax.base);
    });
  });

  describe('Configuration Edge Cases', () => {
    it('should handle invalid campaign types', () => {
      expect(() => getCampaignConfig('invalid_campaign' as any))
        .toThrow('Invalid campaign type');
    });

    it('should validate email format before checking government status', () => {
      expect(isGovernmentEmail('invalid-email')).toBe(false);
      expect(isGovernmentEmail('')).toBe(false);
      expect(isGovernmentEmail('no-at-symbol')).toBe(false);
    });

    it('should handle case-insensitive government email detection', () => {
      expect(isGovernmentEmail('SENATOR@SENATE.GOV')).toBe(true);
      expect(isGovernmentEmail('Rep@House.Gov')).toBe(true);
    });
  });

  describe('Configuration Consistency', () => {
    it('should have consistent point values across campaigns', () => {
      const campaigns = Object.keys(ZK_EMAIL_DEV_CONFIG.CAMPAIGN_POINTS);
      
      campaigns.forEach(campaign => {
        const config = ZK_EMAIL_DEV_CONFIG.CAMPAIGN_POINTS[campaign];
        const totalPoints = config.base + config.campaign_bonus + 
                          config.dkim_bonus + config.gov_recipient_bonus;
        
        expect(totalPoints).toBeGreaterThan(0);
        expect(totalPoints).toBeLessThan(1000); // Reasonable upper bound
      });
    });

    it('should validate configuration completeness', () => {
      const isValid = validateConfiguration();
      expect(isValid).toBe(true);
    });
  });
});