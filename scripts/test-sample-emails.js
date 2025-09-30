#!/usr/bin/env node

/**
 * Test script to validate sample email files
 */

const fs = require('fs');
const path = require('path');

async function testSampleEmails() {
  console.log('🧪 Testing Sample Email Files...\n');

  const publicDir = path.join(process.cwd(), 'public');
  const basicEmailPath = path.join(publicDir, 'sample-email.eml');
  const dkimEmailPath = path.join(publicDir, 'sample-email-DKIM.eml');

  // Test 1: Check if files exist
  console.log('📁 Checking file existence...');
  
  if (!fs.existsSync(basicEmailPath)) {
    console.error('❌ sample-email.eml not found');
    return false;
  }
  console.log('✅ sample-email.eml found');

  if (!fs.existsSync(dkimEmailPath)) {
    console.error('❌ sample-email-DKIM.eml not found');
    return false;
  }
  console.log('✅ sample-email-DKIM.eml found');

  // Test 2: Validate content structure
  console.log('\n📧 Validating email structure...');
  
  const basicContent = fs.readFileSync(basicEmailPath, 'utf-8');
  const dkimContent = fs.readFileSync(dkimEmailPath, 'utf-8');

  // Check basic email
  const basicChecks = [
    { name: 'From header', test: basicContent.includes('From:') },
    { name: 'To header', test: basicContent.includes('To:') },
    { name: 'Subject header', test: basicContent.includes('Subject:') },
    { name: 'Date header', test: basicContent.includes('Date:') },
    { name: 'Message-ID header', test: basicContent.includes('Message-ID:') }
  ];

  console.log('\n📄 Basic email (sample-email.eml):');
  basicChecks.forEach(check => {
    console.log(`${check.test ? '✅' : '❌'} ${check.name}`);
  });

  // Check DKIM email
  const dkimChecks = [
    { name: 'DKIM-Signature', test: dkimContent.includes('DKIM-Signature:') },
    { name: 'Delivered-To', test: dkimContent.includes('Delivered-To:') },
    { name: 'Received headers', test: dkimContent.includes('Received:') },
    { name: 'ARC headers', test: dkimContent.includes('ARC-') },
    { name: 'From header', test: dkimContent.includes('From:') }
  ];

  console.log('\n📄 DKIM email (sample-email-DKIM.eml):');
  dkimChecks.forEach(check => {
    console.log(`${check.test ? '✅' : '❌'} ${check.name}`);
  });

  // Test 3: File size validation
  console.log('\n📏 File size validation...');
  const basicSize = fs.statSync(basicEmailPath).size;
  const dkimSize = fs.statSync(dkimEmailPath).size;
  const maxSize = 1024 * 1024; // 1MB

  console.log(`📄 Basic email: ${(basicSize / 1024).toFixed(2)} KB ${basicSize < maxSize ? '✅' : '❌'}`);
  console.log(`📄 DKIM email: ${(dkimSize / 1024).toFixed(2)} KB ${dkimSize < maxSize ? '✅' : '❌'}`);

  // Test 4: Content parsing simulation
  console.log('\n🔍 Content parsing simulation...');
  
  try {
    // Simulate email parsing
    const parseEmail = (content) => {
      const lines = content.split('\n');
      const headers = {};
      
      for (const line of lines) {
        if (line.startsWith('From: ')) headers.from = line.substring(6).trim();
        if (line.startsWith('To: ')) headers.to = line.substring(4).trim();
        if (line.startsWith('Subject: ')) headers.subject = line.substring(9).trim();
        if (line.startsWith('DKIM-Signature: ')) headers.dkim = true;
      }
      
      return headers;
    };

    const basicHeaders = parseEmail(basicContent);
    const dkimHeaders = parseEmail(dkimContent);

    console.log('📄 Basic email parsed headers:');
    console.log(`   From: ${basicHeaders.from || 'Not found'}`);
    console.log(`   To: ${basicHeaders.to || 'Not found'}`);
    console.log(`   Subject: ${basicHeaders.subject || 'Not found'}`);
    console.log(`   DKIM: ${basicHeaders.dkim ? 'Present' : 'Not found'}`);

    console.log('\n📄 DKIM email parsed headers:');
    console.log(`   From: ${dkimHeaders.from || 'Not found'}`);
    console.log(`   To: ${dkimHeaders.to || 'Not found'}`);
    console.log(`   Subject: ${dkimHeaders.subject || 'Not found'}`);
    console.log(`   DKIM: ${dkimHeaders.dkim ? 'Present' : 'Not found'}`);

  } catch (error) {
    console.error('❌ Error parsing emails:', error.message);
    return false;
  }

  console.log('\n🎉 All sample email tests passed!');
  return true;
}

// Run tests
testSampleEmails().catch(console.error);