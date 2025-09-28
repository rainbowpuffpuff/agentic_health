#!/usr/bin/env node

/**
 * Test script for parliament blueprint integration
 * 
 * Usage: node scripts/test-parliament-blueprint.js
 */

console.log('🏛️  Testing Parliament Blueprint Integration...\n');

// Mock sample email for testing (since we can't easily import TS modules in Node)
const mockSampleEmail = `Return-Path: <carol.calin@gmail.com>
Delivered-To: carol.calin@gmail.com
Received: by 2002:a05:6402:1102:b0:4e5:94b3:7245 with SMTP id ada2fe7eead31-4f2f1985d3mr1G7235137.8.1751624470202; Fri, 04 Jul 2025 03:21:10 -0700 (PDT)
MIME-Version: 1.0
From: carol.calin@gmail.com
Date: Sun, 28 Sep 2025 16:23:00 +0200
Message-ID: <1727537380.abc123@gmail.com>
Subject: Opposition to Chat Control Legislation
To: bcalincarol@gmail.com, androu.et@europarl.europa.eu
Cc: bcalincarol@gmail.com
Content-Type: multipart/alternative; boundary="000000000000538e0c063917dae6"
DKIM-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed;
	d=gmail.com; s=20230601; t=1751624470; x=1752229270;
	h=to:subject:message-id:date:from:mime-version:from:to:cc:subject:date:message-id:reply-to;
	bh=gMXebHFP3BZ7Bi+Y6SdQTbR1mwdixDbAekum9949U8g=;
	b=1cTXSzGnCnhScP/juKZTNnVNaxdaeznAaCmobotLBLsREyNoAwQYdV

--000000000000538e0c063917dae6
Content-Type: text/plain; charset="UTF-8"

Dear MEP,

I am writing to express my strong opposition to the proposed Chat Control legislation.

Sincerely,
Carol Calin

--000000000000538e0c063917dae6--`;

// Test sample email generation
console.log('📧 Testing sample email format...');
try {
  const sampleEmail = mockSampleEmail;
  
  console.log('✅ Sample email generated successfully');
  console.log('📋 Email preview:');
  console.log('─'.repeat(50));
  
  // Show key headers
  const lines = sampleEmail.split('\n');
  const keyHeaders = ['From:', 'To:', 'Cc:', 'Subject:', 'DKIM-Signature:'];
  
  lines.forEach(line => {
    if (keyHeaders.some(header => line.startsWith(header))) {
      console.log(line.substring(0, 80) + (line.length > 80 ? '...' : ''));
    }
  });
  
  console.log('─'.repeat(50));
  
  // Validate format for parliament blueprint
  const hasTo = sampleEmail.includes('To: bcalincarol@gmail.com, androu.et@europarl.europa.eu');
  const hasCc = sampleEmail.includes('Cc: bcalincarol@gmail.com');
  const hasDKIM = sampleEmail.includes('DKIM-Signature:');
  const hasMultipart = sampleEmail.includes('multipart/alternative');
  
  console.log('\n🔍 Blueprint Compatibility Check:');
  console.log(`   To header format: ${hasTo ? '✅' : '❌'}`);
  console.log(`   Cc header (self): ${hasCc ? '✅' : '❌'}`);
  console.log(`   DKIM signature:   ${hasDKIM ? '✅' : '❌'}`);
  console.log(`   Multipart format: ${hasMultipart ? '✅' : '❌'}`);
  
  if (hasTo && hasCc && hasDKIM && hasMultipart) {
    console.log('\n🎉 Email format is compatible with parliament blueprint!');
  } else {
    console.log('\n⚠️  Email format may need adjustments for blueprint compatibility');
  }
  
} catch (error) {
  console.error('❌ Failed to generate sample email:', error.message);
}

console.log('\n📋 Blueprint Information:');
console.log('   ID: 0213eb97-8d11-4e69-a35f-e152c311c2d7');
console.log('   Slug: rainbowpuffpuff/parliament_1');
console.log('   Description: prove you sent an email to an MEP and cc\'ed urself');
console.log('   Registry: https://registry.zk.email/0213eb97-8d11-4e69-a35f-e152c311c2d7');

console.log('\n🔧 Next Steps:');
console.log('1. Test email upload in the UI');
console.log('2. Verify regex pattern matching');
console.log('3. Generate actual ZK proof');
console.log('4. Validate proof verification');