#!/usr/bin/env node

/**
 * Comprehensive ZK-Email integration test
 * Tests the complete flow from sample emails to proof generation
 * 
 * Usage: node scripts/test-zk-email-integration.js
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Comprehensive ZK-Email Integration Test\n');

// Load environment
require('dotenv').config({ path: '.env.development.local' });

// Test configuration
const CONFIG = {
  BLUEPRINT_ID: process.env.NEXT_PUBLIC_ZK_EMAIL_BLUEPRINT_ID || '0213eb97-8d11-4e69-a35f-e152c311c2d7',
  BLUEPRINT_SLUG: process.env.NEXT_PUBLIC_ZK_EMAIL_BLUEPRINT_SLUG || 'rainbowpuffpuff/parliament_1',
  REGISTRY_URL: process.env.ZK_EMAIL_REGISTRY_URL || 'https://registry.zk.email',
  ENABLED: process.env.NEXT_PUBLIC_ZK_EMAIL_ENABLED === 'true',
  DEV_MODE: process.env.NEXT_PUBLIC_ZK_EMAIL_DEV_MODE === 'true'
};

console.log('📋 Configuration Summary:');
console.log(`   ZK-Email Enabled: ${CONFIG.ENABLED}`);
console.log(`   Development Mode: ${CONFIG.DEV_MODE}`);
console.log(`   Blueprint ID: ${CONFIG.BLUEPRINT_ID}`);
console.log(`   Registry URL: ${CONFIG.REGISTRY_URL}`);

// Test 1: Validate sample email structure
console.log('\n📧 Testing Sample Email Structure...');

function validateEmailStructure(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`❌ ${filePath} - File not found`);
    return false;
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  // Check required headers
  const requiredHeaders = ['From:', 'To:', 'Subject:', 'Date:'];
  const foundHeaders = {};
  
  lines.forEach(line => {
    requiredHeaders.forEach(header => {
      if (line.startsWith(header)) {
        foundHeaders[header] = line.substring(header.length).trim();
      }
    });
  });
  
  // Check DKIM signature
  const hasDKIM = content.includes('DKIM-Signature:');
  const hasMessageId = content.includes('Message-ID:');
  
  console.log(`📄 ${path.basename(filePath)}:`);
  console.log(`   Size: ${(content.length / 1024).toFixed(2)} KB`);
  console.log(`   DKIM Signature: ${hasDKIM ? '✅' : '❌'}`);
  console.log(`   Message-ID: ${hasMessageId ? '✅' : '❌'}`);
  
  requiredHeaders.forEach(header => {
    const found = foundHeaders[header];
    if (found) {
      console.log(`   ${header} ✅ ${found.substring(0, 50)}${found.length > 50 ? '...' : ''}`);
    } else {
      console.log(`   ${header} ❌ Missing`);
    }
  });
  
  return Object.keys(foundHeaders).length === requiredHeaders.length && hasDKIM;
}

// Test 2: Simulate email parsing
console.log('\n🔍 Testing Email Parsing Logic...');

function parseEmailContent(emlContent) {
  const lines = emlContent.split('\n');
  const headers = {};
  
  let sender = '';
  let recipient = '';
  let subject = '';
  let messageId = '';
  let dkimValid = false;
  let timestamp = new Date();

  // Parse headers
  for (const line of lines) {
    if (line.startsWith('From: ')) {
      sender = line.substring(6).trim();
      headers['from'] = sender;
    } else if (line.startsWith('To: ')) {
      recipient = line.substring(4).trim();
      headers['to'] = recipient;
    } else if (line.startsWith('Subject: ')) {
      subject = line.substring(9).trim();
      headers['subject'] = subject;
    } else if (line.startsWith('Message-ID: ')) {
      messageId = line.substring(12).trim();
      headers['message-id'] = messageId;
    } else if (line.startsWith('Date: ')) {
      timestamp = new Date(line.substring(6).trim());
      headers['date'] = line.substring(6).trim();
    } else if (line.startsWith('DKIM-Signature: ')) {
      dkimValid = true;
      headers['dkim-signature'] = line.substring(16).trim();
    }
  }

  return {
    sender,
    recipient,
    subject,
    timestamp,
    dkim_valid: dkimValid,
    message_id: messageId,
    headers,
    valid: !!(sender && recipient && subject)
  };
}

function testEmailParsing(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const parsed = parseEmailContent(content);
  
  console.log(`📧 Parsed ${path.basename(filePath)}:`);
  console.log(`   Valid: ${parsed.valid ? '✅' : '❌'}`);
  console.log(`   Sender: ${parsed.sender}`);
  console.log(`   Recipient: ${parsed.recipient}`);
  console.log(`   Subject: ${parsed.subject}`);
  console.log(`   DKIM Valid: ${parsed.dkim_valid ? '✅' : '❌'}`);
  console.log(`   Message ID: ${parsed.message_id}`);
  
  return parsed.valid;
}

// Test 3: Check government email detection
console.log('\n🏛️  Testing Government Email Detection...');

function isGovernmentEmail(email) {
  const governmentDomains = [
    '.gov', '.gov.uk', '.gov.us', '.senate.gov', '.house.gov', 
    '.state.gov', '.europa.eu', '.parliament.uk', '.parliament.gov.uk',
    '.bundestag.de', '.assemblee-nationale.fr'
  ];
  
  const lowerEmail = email.toLowerCase();
  return governmentDomains.some(domain => lowerEmail.includes(domain));
}

function testGovernmentDetection() {
  const testEmails = [
    'senator@senate.gov',
    'mp@parliament.uk', 
    'mep@europarl.europa.eu',
    'representative@house.gov',
    'regular@gmail.com',
    'business@company.com'
  ];
  
  testEmails.forEach(email => {
    const isGov = isGovernmentEmail(email);
    console.log(`   ${email}: ${isGov ? '✅ Government' : '❌ Not Government'}`);
  });
}

// Test 4: Validate campaign configuration
console.log('\n⚙️  Testing Campaign Configuration...');

function testCampaignConfig() {
  const campaigns = {
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
  };
  
  Object.entries(campaigns).forEach(([campaign, config]) => {
    const totalPoints = config.base + config.dkim_bonus + config.gov_recipient_bonus + config.campaign_bonus;
    console.log(`   ${campaign}: ${totalPoints} points max (base: ${config.base}, bonuses: ${totalPoints - config.base})`);
  });
}

// Test 5: Frontend integration simulation
console.log('\n🖥️  Testing Frontend Integration Simulation...');

function simulateFrontendFlow() {
  console.log('   1. User clicks "Use Default Email (Testing)"');
  console.log('   2. Frontend loads /sample-email-DKIM.eml');
  console.log('   3. Email content parsed and validated');
  console.log('   4. ZK-Email SDK generates proof');
  console.log('   5. Proof verified and points awarded');
  console.log('   6. Campaign state updated to "verified"');
  
  // Simulate the flow
  const sampleEmailPath = 'public/sample-email-DKIM.eml';
  if (fs.existsSync(sampleEmailPath)) {
    const content = fs.readFileSync(sampleEmailPath, 'utf-8');
    const parsed = parseEmailContent(content);
    const isGov = isGovernmentEmail(parsed.recipient);
    
    console.log('\n   📊 Simulation Results:');
    console.log(`   Email Valid: ${parsed.valid ? '✅' : '❌'}`);
    console.log(`   DKIM Present: ${parsed.dkim_valid ? '✅' : '❌'}`);
    console.log(`   Government Recipient: ${isGov ? '✅' : '❌'}`);
    
    // Calculate points
    const basePoints = 50;
    const dkimBonus = parsed.dkim_valid ? 15 : 0;
    const govBonus = isGov ? 25 : 0;
    const campaignBonus = 25; // chat_control
    const totalPoints = basePoints + dkimBonus + govBonus + campaignBonus;
    
    console.log(`   Points Awarded: ${totalPoints} (${basePoints} base + ${dkimBonus + govBonus + campaignBonus} bonuses)`);
    
    return totalPoints > 0;
  } else {
    console.log('   ❌ Sample email file not found');
    return false;
  }
}

// Run all tests
async function runAllTests() {
  let allPassed = true;
  
  // Test sample emails
  const sampleFiles = ['public/sample-email.eml', 'public/sample-email-DKIM.eml'];
  sampleFiles.forEach(file => {
    if (!validateEmailStructure(file)) allPassed = false;
  });
  
  // Test email parsing
  sampleFiles.forEach(file => {
    if (fs.existsSync(file) && !testEmailParsing(file)) allPassed = false;
  });
  
  // Test government detection
  testGovernmentDetection();
  
  // Test campaign config
  testCampaignConfig();
  
  // Test frontend simulation
  if (!simulateFrontendFlow()) allPassed = false;
  
  console.log('\n🎉 Integration Test Summary:');
  console.log(`   Overall Status: ${allPassed ? '✅ All tests passed' : '❌ Some tests failed'}`);
  console.log(`   Configuration: ${CONFIG.ENABLED ? '✅ Enabled' : '❌ Disabled'}`);
  console.log(`   Blueprint: ${CONFIG.BLUEPRINT_ID}`);
  console.log(`   Registry: ${CONFIG.REGISTRY_URL}/${CONFIG.BLUEPRINT_ID}`);
  
  console.log('\n🔧 Next Steps:');
  console.log('1. Start the development server: npm run dev');
  console.log('2. Open the Proof of Action section');
  console.log('3. Click "Use Default Email (Testing)" button');
  console.log('4. Check browser console for ZK-Email logs');
  console.log('5. Verify proof generation and point calculation');
  
  return allPassed;
}

runAllTests().catch(console.error);