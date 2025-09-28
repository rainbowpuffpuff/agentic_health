#!/usr/bin/env node

/**
 * Development script to test ZK-Email SDK integration
 * 
 * Usage: node scripts/test-zk-email.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Testing ZK-Email SDK Integration...\n');

// Check if ZK-Email SDK is installed
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const zkEmailVersion = packageJson.dependencies['@zk-email/sdk'];
  
  if (zkEmailVersion) {
    console.log(`✅ ZK-Email SDK installed: ${zkEmailVersion}`);
  } else {
    console.log('❌ ZK-Email SDK not found in dependencies');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Error reading package.json:', error.message);
  process.exit(1);
}

// Check if environment variables are set
const envFile = '.env.development.local';
if (fs.existsSync(envFile)) {
  const envContent = fs.readFileSync(envFile, 'utf8');
  
  if (envContent.includes('NEXT_PUBLIC_ZK_EMAIL_ENABLED')) {
    console.log('✅ ZK-Email environment variables configured');
  } else {
    console.log('⚠️  ZK-Email environment variables not found');
  }
} else {
  console.log('⚠️  Environment file not found');
}

// Check if ZK-Email files exist
const zkEmailFiles = [
  'src/lib/zk-email.ts',
  'src/lib/zk-email-config.ts',
  'src/hooks/use-zk-email.ts'
];

zkEmailFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} exists`);
  } else {
    console.log(`❌ ${file} missing`);
  }
});

// Test TypeScript compilation
console.log('\n🔍 Testing TypeScript compilation...');
try {
  execSync('npx tsc --noEmit --skipLibCheck src/lib/zk-email.ts', { 
    stdio: 'pipe',
    cwd: process.cwd()
  });
  console.log('✅ ZK-Email TypeScript files compile successfully');
} catch (error) {
  console.log('❌ TypeScript compilation failed:');
  console.log(error.stdout?.toString() || error.message);
}

// Test Next.js build
console.log('\n🏗️  Testing Next.js build...');
try {
  execSync('npm run build', { 
    stdio: 'pipe',
    cwd: process.cwd()
  });
  console.log('✅ Next.js build successful with ZK-Email integration');
} catch (error) {
  console.log('❌ Next.js build failed:');
  console.log(error.stdout?.toString() || error.message);
}

console.log('\n🎉 ZK-Email SDK integration test complete!');
console.log('\nNext steps:');
console.log('1. Set NEXT_PUBLIC_ZK_EMAIL_ENABLED=true in your environment');
console.log('2. Create a blueprint on ZK-Email Registry');
console.log('3. Test email upload and proof generation in the UI');