#!/usr/bin/env node

/**
 * Test script to validate ZK-Email registry access and blueprint configuration
 * 
 * Usage: node scripts/test-zk-email-registry.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

console.log('🔧 Testing ZK-Email Registry Access...\n');

// Load environment variables
require('dotenv').config({ path: '.env.development.local' });

const BLUEPRINT_ID = process.env.NEXT_PUBLIC_ZK_EMAIL_BLUEPRINT_ID || '0213eb97-8d11-4e69-a35f-e152c311c2d7';
const BLUEPRINT_SLUG = process.env.NEXT_PUBLIC_ZK_EMAIL_BLUEPRINT_SLUG || 'rainbowpuffpuff/parliament_1';
const REGISTRY_URL = process.env.ZK_EMAIL_REGISTRY_URL || 'https://registry.zk.email';

console.log('📋 Configuration:');
console.log(`   Blueprint ID: ${BLUEPRINT_ID}`);
console.log(`   Blueprint Slug: ${BLUEPRINT_SLUG}`);
console.log(`   Registry URL: ${REGISTRY_URL}`);
console.log(`   Registry Blueprint URL: ${REGISTRY_URL}/${BLUEPRINT_ID}`);

// Test 1: Check if blueprint exists in registry
console.log('\n🔍 Testing blueprint registry access...');

function testRegistryAccess(url) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        resolve({
          statusCode: response.statusCode,
          headers: response.headers,
          data: data
        });
      });
    });
    
    request.on('error', (error) => {
      reject(error);
    });
    
    request.setTimeout(10000, () => {
      request.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function testBlueprint() {
  const blueprintUrl = `${REGISTRY_URL}/${BLUEPRINT_ID}`;
  
  try {
    console.log(`📡 Testing: ${blueprintUrl}`);
    const response = await testRegistryAccess(blueprintUrl);
    
    if (response.statusCode === 200) {
      console.log('✅ Blueprint accessible in registry');
      
      // Try to parse response
      try {
        const blueprintData = JSON.parse(response.data);
        console.log('📄 Blueprint details:');
        console.log(`   Title: ${blueprintData.title || 'N/A'}`);
        console.log(`   Description: ${blueprintData.description || 'N/A'}`);
        console.log(`   Status: ${blueprintData.status || 'N/A'}`);
        console.log(`   Created: ${blueprintData.createdAt || 'N/A'}`);
      } catch (parseError) {
        console.log('⚠️  Response received but not JSON format');
        console.log('📄 Response preview:', response.data.substring(0, 200) + '...');
      }
    } else {
      console.log(`❌ Blueprint not accessible (HTTP ${response.statusCode})`);
      console.log('📄 Response:', response.data.substring(0, 200));
    }
  } catch (error) {
    console.log('❌ Registry access failed:', error.message);
  }
}

// Test 2: Validate sample email files
console.log('\n📧 Testing sample email files...');

function testSampleEmails() {
  const sampleFiles = [
    'public/sample-email.eml',
    'public/sample-email-DKIM.eml'
  ];
  
  sampleFiles.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const size = (content.length / 1024).toFixed(2);
      
      // Check for key email components
      const hasDKIM = content.includes('DKIM-Signature:');
      const hasFrom = content.includes('From:');
      const hasTo = content.includes('To:');
      const hasSubject = content.includes('Subject:');
      
      console.log(`✅ ${filePath} (${size} KB)`);
      console.log(`   DKIM: ${hasDKIM ? '✅' : '❌'}`);
      console.log(`   Headers: From(${hasFrom ? '✅' : '❌'}) To(${hasTo ? '✅' : '❌'}) Subject(${hasSubject ? '✅' : '❌'})`);
    } else {
      console.log(`❌ ${filePath} - File not found`);
    }
  });
}

// Test 3: Validate environment configuration
console.log('\n⚙️  Testing environment configuration...');

function testEnvironmentConfig() {
  const requiredVars = [
    'NEXT_PUBLIC_ZK_EMAIL_ENABLED',
    'NEXT_PUBLIC_ZK_EMAIL_DEV_MODE',
    'NEXT_PUBLIC_ZK_EMAIL_BLUEPRINT_ID',
    'NEXT_PUBLIC_ZK_EMAIL_BLUEPRINT_SLUG'
  ];
  
  const optionalVars = [
    'ZK_EMAIL_REGISTRY_URL',
    'ZK_EMAIL_API_KEY'
  ];
  
  console.log('📋 Required variables:');
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      console.log(`   ✅ ${varName}=${value}`);
    } else {
      console.log(`   ❌ ${varName} - Not set`);
    }
  });
  
  console.log('\n📋 Optional variables:');
  optionalVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      console.log(`   ✅ ${varName}=${value}`);
    } else {
      console.log(`   ⚠️  ${varName} - Not set (using default)`);
    }
  });
}

// Test 4: Validate blueprint ID format
console.log('\n🔍 Testing blueprint ID format...');

function testBlueprintIdFormat() {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  
  if (uuidRegex.test(BLUEPRINT_ID)) {
    console.log(`✅ Blueprint ID format is valid UUID: ${BLUEPRINT_ID}`);
  } else {
    console.log(`❌ Blueprint ID format is invalid: ${BLUEPRINT_ID}`);
    console.log('   Expected format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx');
  }
  
  if (BLUEPRINT_SLUG.includes('/')) {
    console.log(`✅ Blueprint slug format is valid: ${BLUEPRINT_SLUG}`);
  } else {
    console.log(`❌ Blueprint slug format is invalid: ${BLUEPRINT_SLUG}`);
    console.log('   Expected format: username/blueprint_name');
  }
}

// Run all tests
async function runAllTests() {
  testEnvironmentConfig();
  testBlueprintIdFormat();
  testSampleEmails();
  await testBlueprint();
  
  console.log('\n🎉 ZK-Email registry testing complete!');
  console.log('\n🔧 Next steps:');
  console.log('1. Ensure all environment variables are properly set');
  console.log('2. Verify blueprint is accessible in the registry');
  console.log('3. Test email upload and proof generation in the UI');
  console.log('4. Check browser console for ZK-Email SDK initialization logs');
}

runAllTests().catch(console.error);