#!/usr/bin/env node

/**
 * Frontend ZK-Email Testing Script
 * 
 * This script provides instructions and validation for testing
 * the ZK-Email integration in the browser frontend.
 * 
 * Usage: node scripts/test-frontend-zk-email.js
 */

const fs = require('fs');
const https = require('https');

console.log('🖥️  Frontend ZK-Email Testing Guide\n');

// Load configuration
require('dotenv').config({ path: '.env.development.local' });

const CONFIG = {
  FRONTEND_URL: 'http://localhost:9002',
  BLUEPRINT_ID: process.env.NEXT_PUBLIC_ZK_EMAIL_BLUEPRINT_ID || '0213eb97-8d11-4e69-a35f-e152c311c2d7',
  REGISTRY_URL: process.env.ZK_EMAIL_REGISTRY_URL || 'https://registry.zk.email',
  ENABLED: process.env.NEXT_PUBLIC_ZK_EMAIL_ENABLED === 'true',
  DEV_MODE: process.env.NEXT_PUBLIC_ZK_EMAIL_DEV_MODE === 'true'
};

console.log('📋 Test Configuration:');
console.log(`   Frontend URL: ${CONFIG.FRONTEND_URL}`);
console.log(`   ZK-Email Enabled: ${CONFIG.ENABLED}`);
console.log(`   Development Mode: ${CONFIG.DEV_MODE}`);
console.log(`   Blueprint ID: ${CONFIG.BLUEPRINT_ID}`);
console.log(`   Registry URL: ${CONFIG.REGISTRY_URL}/${CONFIG.BLUEPRINT_ID}`);

// Test 1: Check if frontend is accessible
console.log('\n🌐 Testing Frontend Accessibility...');

function testFrontendAccess() {
  return new Promise((resolve) => {
    const http = require('http');
    const request = http.get(CONFIG.FRONTEND_URL, (response) => {
      if (response.statusCode === 200) {
        console.log('✅ Frontend is accessible at', CONFIG.FRONTEND_URL);
        resolve(true);
      } else {
        console.log('❌ Frontend returned status:', response.statusCode);
        resolve(false);
      }
    });
    
    request.on('error', (error) => {
      console.log('❌ Frontend not accessible:', error.message);
      console.log('💡 Make sure to run: npm run dev');
      resolve(false);
    });
    
    request.setTimeout(5000, () => {
      request.destroy();
      console.log('❌ Frontend request timeout');
      resolve(false);
    });
  });
}

// Test 2: Validate sample email accessibility
console.log('\n📧 Testing Sample Email Accessibility...');

function testSampleEmailAccess() {
  return new Promise((resolve) => {
    const http = require('http');
    const sampleUrl = `${CONFIG.FRONTEND_URL}/sample-email-DKIM.eml`;
    
    const request = http.get(sampleUrl, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        if (response.statusCode === 200 && data.includes('DKIM-Signature:')) {
          console.log('✅ Sample email accessible via frontend');
          console.log(`   URL: ${sampleUrl}`);
          console.log(`   Size: ${(data.length / 1024).toFixed(2)} KB`);
          console.log(`   DKIM: ${data.includes('DKIM-Signature:') ? '✅' : '❌'}`);
          resolve(true);
        } else {
          console.log('❌ Sample email not accessible or invalid');
          console.log(`   Status: ${response.statusCode}`);
          resolve(false);
        }
      });
    });
    
    request.on('error', (error) => {
      console.log('❌ Sample email request failed:', error.message);
      resolve(false);
    });
    
    request.setTimeout(5000, () => {
      request.destroy();
      console.log('❌ Sample email request timeout');
      resolve(false);
    });
  });
}

// Test 3: Browser testing instructions
console.log('\n🧪 Browser Testing Instructions:');

function provideBrowserTestingInstructions() {
  console.log('\n📝 Manual Testing Steps:');
  console.log('1. Open your browser and navigate to:', CONFIG.FRONTEND_URL);
  console.log('2. Scroll down to the "Proof of Action" section');
  console.log('3. Select a campaign (e.g., "Stop Chat Control")');
  console.log('4. Click "Take Action for 10 Points" (ensure you have ≥10 points)');
  console.log('5. You should see two buttons:');
  console.log('   - "Upload Your Email (.eml)" - for real email files');
  console.log('   - "Use Default Email (Testing)" - for testing with sample');
  console.log('6. Click "Use Default Email (Testing)"');
  console.log('7. Check the browser console (F12) for logs');
  
  console.log('\n🔍 Expected Console Logs:');
  console.log('   🧪 Loading default email for testing...');
  console.log('   ✅ Sample email loaded successfully');
  console.log('   📧 Email preview: [email content preview]');
  console.log('   🔐 Generating ZK proof for campaign: [campaign_name]');
  console.log('   🔧 ZK-Email Configuration Status: [config details]');
  console.log('   🚀 Initializing ZK-Email SDK...');
  console.log('   🔍 Loading blueprint with ID: [blueprint_id]');
  
  console.log('\n✅ Success Indicators:');
  console.log('   - Alert popup: "Default email verification successful!"');
  console.log('   - Console shows proof generation logs');
  console.log('   - No error messages in console');
  console.log('   - Campaign state transitions properly');
  
  console.log('\n❌ Troubleshooting:');
  console.log('   - If "ZK-Email SDK not initialized" error:');
  console.log('     → Check environment variables in .env.development.local');
  console.log('     → Verify NEXT_PUBLIC_ZK_EMAIL_ENABLED=true');
  console.log('   - If "Failed to load sample email" error:');
  console.log('     → Verify /public/sample-email-DKIM.eml exists');
  console.log('     → Check file permissions and accessibility');
  console.log('   - If blueprint loading fails:');
  console.log('     → Check network connectivity');
  console.log('     → Verify blueprint ID is correct');
  
  console.log('\n🔗 Useful Links:');
  console.log(`   Frontend: ${CONFIG.FRONTEND_URL}`);
  console.log(`   Sample Email: ${CONFIG.FRONTEND_URL}/sample-email-DKIM.eml`);
  console.log(`   Blueprint Registry: ${CONFIG.REGISTRY_URL}/${CONFIG.BLUEPRINT_ID}`);
  console.log('   ZK-Email Docs: https://docs.zk.email/');
}

// Test 4: Environment validation
console.log('\n⚙️  Environment Validation:');

function validateEnvironment() {
  const requiredVars = [
    'NEXT_PUBLIC_ZK_EMAIL_ENABLED',
    'NEXT_PUBLIC_ZK_EMAIL_DEV_MODE', 
    'NEXT_PUBLIC_ZK_EMAIL_BLUEPRINT_ID',
    'NEXT_PUBLIC_ZK_EMAIL_BLUEPRINT_SLUG'
  ];
  
  let allValid = true;
  
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      console.log(`✅ ${varName}=${value}`);
    } else {
      console.log(`❌ ${varName} - Missing or empty`);
      allValid = false;
    }
  });
  
  // Check sample files
  const sampleFiles = [
    'public/sample-email.eml',
    'public/sample-email-DKIM.eml'
  ];
  
  sampleFiles.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      const size = (fs.statSync(filePath).size / 1024).toFixed(2);
      console.log(`✅ ${filePath} (${size} KB)`);
    } else {
      console.log(`❌ ${filePath} - File not found`);
      allValid = false;
    }
  });
  
  return allValid;
}

// Test 5: Generate test report
function generateTestReport(frontendAccessible, sampleAccessible, envValid) {
  console.log('\n📊 Test Report Summary:');
  console.log('─'.repeat(50));
  console.log(`Frontend Accessible: ${frontendAccessible ? '✅' : '❌'}`);
  console.log(`Sample Email Accessible: ${sampleAccessible ? '✅' : '❌'}`);
  console.log(`Environment Valid: ${envValid ? '✅' : '❌'}`);
  console.log(`Configuration Complete: ${CONFIG.ENABLED ? '✅' : '❌'}`);
  
  const overallStatus = frontendAccessible && sampleAccessible && envValid && CONFIG.ENABLED;
  console.log(`Overall Status: ${overallStatus ? '✅ READY FOR TESTING' : '❌ NEEDS ATTENTION'}`);
  
  if (!overallStatus) {
    console.log('\n🔧 Action Items:');
    if (!frontendAccessible) console.log('   - Start frontend: npm run dev');
    if (!sampleAccessible) console.log('   - Check sample email files in /public/');
    if (!envValid) console.log('   - Fix environment variables in .env.development.local');
    if (!CONFIG.ENABLED) console.log('   - Set NEXT_PUBLIC_ZK_EMAIL_ENABLED=true');
  }
  
  return overallStatus;
}

// Run all tests
async function runAllTests() {
  const envValid = validateEnvironment();
  const frontendAccessible = await testFrontendAccess();
  const sampleAccessible = await testSampleEmailAccess();
  
  provideBrowserTestingInstructions();
  
  const ready = generateTestReport(frontendAccessible, sampleAccessible, envValid);
  
  if (ready) {
    console.log('\n🎉 Ready for frontend testing!');
    console.log(`\n🚀 Open ${CONFIG.FRONTEND_URL} and follow the testing steps above.`);
  } else {
    console.log('\n⚠️  Please resolve the issues above before testing.');
  }
  
  return ready;
}

// Execute tests
runAllTests().catch(console.error);