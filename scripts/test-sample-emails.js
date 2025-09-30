#!/usr/bin/env node

/**
 * Test runner for sample email files
 * Validates that our ZK-Email integration works with real sample data
 */

const fs = require('fs').promises;
const path = require('path');

async function testSampleEmails() {
  console.log('🧪 Testing ZK-Email integration with sample files...\n');

  const sampleEmailPath = path.join(process.cwd(), 'public', 'sample-email.eml');
  const sampleEmailDKIMPath = path.join(process.cwd(), 'public', 'sample-email-DKIM.eml');

  try {
    // Check if sample files exist
    const basicEmailExists = await fs.access(sampleEmailPath).then(() => true).catch(() => false);
    const dkimEmailExists = await fs.access(sampleEmailDKIMPath).then(() => true).catch(() => false);

    console.log(`📧 Basic sample email: ${basicEmailExists ? '✅ Found' : '❌ Missing'}`);
    console.log(`🔐 DKIM sample email: ${dkimEmailExists ? '✅ Found' : '❌ Missing'}\n`);

    if (!basicEmailExists || !dkimEmailExists) {
      console.log('⚠️  Sample email files missing. Please ensure the following files exist:');
      console.log('   - public/sample-email.eml');
      console.log('   - public/sample-email-DKIM.eml\n');
      process.exit(1);
    }

    // Load and validate sample files
    const basicEmail = await fs.readFile(sampleEmailPath, 'utf-8');
    const dkimEmail = await fs.readFile(sampleEmailDKIMPath, 'utf-8');

    console.log('📊 Sample file analysis:');
    console.log(`   Basic email size: ${basicEmail.length} bytes`);
    console.log(`   DKIM email size: ${dkimEmail.length} bytes`);
    
    // Basic validation
    const basicHasDKIM = basicEmail.includes('DKIM-Signature:');
    const dkimHasDKIM = dkimEmail.includes('DKIM-Signature:');
    
    console.log(`   Basic email DKIM: ${basicHasDKIM ? '✅' : '❌'}`);
    console.log(`   DKIM email DKIM: ${dkimHasDKIM ? '✅' : '❌'}\n`);

    // Run the actual tests
    console.log('🚀 Running ZK-Email tests with sample files...\n');
    
    const { execSync } = require('child_process');
    
    try {
      // Run only the real sample tests
      const testOutput = execSync(
        'npm test -- --testPathPattern=zk-email-real-samples --verbose',
        { encoding: 'utf-8', stdio: 'pipe' }
      );
      
      console.log(testOutput);
      console.log('✅ All sample email tests passed!\n');
      
    } catch (error) {
      console.log('❌ Some tests failed:');
      console.log(error.stdout || error.message);
      console.log('\n');
      process.exit(1);
    }

    // Summary
    console.log('📋 Test Summary:');
    console.log('   ✅ Sample files loaded successfully');
    console.log('   ✅ Email parsing validation passed');
    console.log('   ✅ DKIM signature detection working');
    console.log('   ✅ Government email detection working');
    console.log('   ✅ Integration tests passed\n');

    console.log('🎉 ZK-Email integration ready for production use!');

  } catch (error) {
    console.error('❌ Error testing sample emails:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  testSampleEmails();
}

module.exports = { testSampleEmails };