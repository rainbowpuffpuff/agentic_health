/**
 * ZK-Email Development Configuration
 * 
 * Configuration settings for ZK-Email SDK development environment
 */

export const ZK_EMAIL_DEV_CONFIG = {
  // Enable/disable ZK-Email features
  ENABLED: process.env.NEXT_PUBLIC_ZK_EMAIL_ENABLED === 'true',
  
  // Development mode settings
  DEV_MODE: process.env.NEXT_PUBLIC_ZK_EMAIL_DEV_MODE === 'true',
  
  // Blueprint configuration - using existing parliament blueprint
  BLUEPRINT_ID: process.env.NEXT_PUBLIC_ZK_EMAIL_BLUEPRINT_ID || '0213eb97-8d11-4e69-a35f-e152c311c2d7',
  BLUEPRINT_SLUG: process.env.NEXT_PUBLIC_ZK_EMAIL_BLUEPRINT_SLUG || 'rainbowpuffpuff/parliament_1',
  
  // Registry settings
  REGISTRY_URL: process.env.ZK_EMAIL_REGISTRY_URL || 'https://registry.zk.email',
  
  // Timeouts and limits
  PROOF_TIMEOUT: 30000, // 30 seconds
  MAX_EMAIL_SIZE: 1024 * 1024, // 1MB
  
  // Development sample data - formatted for parliament blueprint
  SAMPLE_EMAILS: {
    chat_control: {
      sender: 'carol.calin@gmail.com',
      recipient: 'bcalincarol@gmail.com, androu.et@europarl.europa.eu',
      cc: 'bcalincarol@gmail.com',
      subject: 'Opposition to Chat Control Legislation',
      template: `Dear MEP,

I am writing to express my strong opposition to the proposed Chat Control legislation. As your constituent, I believe this legislation poses significant risks to privacy and civil liberties.

The mass surveillance of private communications is not compatible with democratic values and fundamental rights. I urge you to vote against this proposal.

Thank you for your consideration.

Sincerely,
Carol Calin`
    },
    sugar_tax: {
      sender: 'carol.calin@gmail.com',
      recipient: 'bcalincarol@gmail.com, health.minister@europarl.europa.eu',
      cc: 'bcalincarol@gmail.com',
      subject: 'Support for Sugar Tax Implementation',
      template: `Dear Health Minister,

I am writing to express my support for implementing a comprehensive sugar tax to address the growing obesity crisis.

Evidence from other countries shows that sugar taxes effectively reduce consumption of unhealthy beverages while generating revenue for public health programs.

I encourage you to move forward with this important public health measure.

Best regards,
Carol Calin`
    },
    sleep_compensation: {
      sender: 'carol.calin@gmail.com',
      recipient: 'bcalincarol@gmail.com, labor.secretary@europarl.europa.eu',
      cc: 'bcalincarol@gmail.com',
      subject: 'Support for Sleep Compensation Legislation',
      template: `Dear Labor Secretary,

I am writing to advocate for legislation that would provide compensation for workers whose sleep is disrupted by work-related activities.

Sleep is essential for health and productivity. Workers who sacrifice sleep for their jobs deserve fair compensation for this impact on their well-being.

Please consider supporting policies that protect workers' right to adequate rest.

Respectfully,
Carol Calin`
    }
  },
  
  // Government domain patterns for verification
  GOVERNMENT_DOMAINS: [
    '.gov',
    '.gov.uk',
    '.gov.us',
    '.senate.gov',
    '.house.gov',
    '.state.gov',
    '.europa.eu',
    '.parliament.uk',
    '.parliament.gov.uk',
    '.bundestag.de',
    '.assemblee-nationale.fr',
  ],
  
  // Campaign point values
  CAMPAIGN_POINTS: {
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
  },
};

/**
 * Generate a sample .eml file content for testing - formatted for parliament blueprint
 */
export function generateSampleEML(campaign: Campaign): string {
  const sampleData = ZK_EMAIL_DEV_CONFIG.SAMPLE_EMAILS[campaign];
  const timestamp = new Date().toUTCString();
  const messageId = `<${Date.now()}.${Math.random().toString(36).substring(2, 9)}@gmail.com>`;
  
  // Format similar to the working example from your screenshot
  return `Return-Path: <${sampleData.sender}>
Delivered-To: ${sampleData.sender}
Received: by 2002:a05:6402:1102:b0:4e5:94b3:7245 with SMTP id ada2fe7eead31-4f2f1985d3mr1G7235137.8.1751624470202; Fri, 04 Jul 2025 03:21:10 -0700 (PDT)
X-Google-Smtp-Source: AGHT+IFMGBtzuistGoCxzwPE0AZSQRMYg+X21GEVpM0NSP7TIYSOSuQ+utoB3s+eFMs1/
X-Received: by 2002:a05:6402:1102:b0:4e5:94b3:7245 with SMTP id ada2fe7eead31-4f2f1985d3mr1G7235137.8.1751624470202; Fri, 04 Jul 2025 03:21:10 -0700 (PDT)
MIME-Version: 1.0
From: ${sampleData.sender}
Date: ${timestamp}
Message-ID: ${messageId}
Subject: ${sampleData.subject}
To: ${sampleData.recipient}
Cc: ${sampleData.cc}
Content-Type: multipart/alternative; boundary="000000000000538e0c063917dae6"
DKIM-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed;
	d=gmail.com; s=20230601; t=1751624470; x=1752229270;
	h=to:subject:message-id:date:from:mime-version:from:to:cc:subject:date:message-id:reply-to;
	bh=gMXebHFP3BZ7Bi+Y6SdQTbR1mwdixDbAekum9949U8g=;
	b=1cTXSzGnCnhScP/juKZTNnVNaxdaeznAaCmobotLBLsREyNoAwQYdV
	/SwpjMCmDw7xKI1QxWuDCaGsxHt+2LtWrWuSSj9gTqDbDX/wSmb3ypRR317I9nXXHEMHyQ2Qw
	vD7840128XozL7107tLFoKv4dVNaxdaeznAaCmobotLBLsREyNoAwQYdV

--000000000000538e0c063917dae6
Content-Type: text/plain; charset="UTF-8"

${sampleData.template}

--000000000000538e0c063917dae6--
`;
}

/**
 * Validate email format and size
 */
export function validateEmailFile(file: File): { valid: boolean; error?: string } {
  if (!file.name.endsWith('.eml')) {
    return { valid: false, error: 'File must be a .eml email file' };
  }
  
  if (file.size > ZK_EMAIL_DEV_CONFIG.MAX_EMAIL_SIZE) {
    return { valid: false, error: 'Email file is too large (max 1MB)' };
  }
  
  return { valid: true };
}

/**
 * Check if recipient appears to be a government email
 */
export function isGovernmentEmail(email: string): boolean {
  const lowerEmail = email.toLowerCase();
  return ZK_EMAIL_DEV_CONFIG.GOVERNMENT_DOMAINS.some(domain => 
    lowerEmail.includes(domain)
  );
}

export type Campaign = keyof typeof ZK_EMAIL_DEV_CONFIG.SAMPLE_EMAILS;