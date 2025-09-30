# 🐛 **Issue: Proof of Action Email Testing Functionality Not Working**

## 📋 **Problem Description**

The Proof of Action feature in the frontend is not properly implementing the expected user workflow for testing email functionality. Users should be able to spend their balance points, take action, and then see two buttons for email verification - one for uploading their own email and another for using a default sample email (similar to the sleep verification flow).

## 🎯 **Expected User Behavior**

1. **Balance Check**: User has sufficient Intention Points (≥10) to spend
2. **Take Action**: User clicks "Take Action for 10 Points" 
3. **Action State**: User enters `taking_action` state and sees two options:
   - **"Upload Signed Email (.eml)"** - For real email verification
   - **"Use Default Email (Testing)"** - For testing with sample emails

## 📁 **Available Sample Email Files**

We have two sample email files that should be used for testing:
- `/public/sample-email-DKIM.eml` - Full DKIM-signed email with headers
- `/public/sample-email.eml` - Basic email structure

## 🔧 **Current Implementation Issues**

### 1. **Missing Default Email Button Logic**
The `handleUseSampleEmail` function exists but doesn't properly load the sample email files from the public directory.

### 2. **Inconsistent UX with Sleep Verification**
Sleep verification has a clean "Use Default Photo" button that works seamlessly. Email verification should mirror this pattern.

### 3. **Sample Email Loading**
The current implementation tries to generate sample emails programmatically instead of using the actual `.eml` files we have prepared.

## 🛠 **Required Implementation**

### Frontend Changes Needed:

1. **Update ProofOfAction Component** (`src/components/app/ProofOfAction.tsx`):
   ```typescript
   // Add function to load sample email from public directory
   const handleUseDefaultEmail = async (campaign: Campaign) => {
     try {
       // Load the sample-email-DKIM.eml file from public directory
       const response = await fetch('/sample-email-DKIM.eml');
       const emlContent = await response.text();
       
       // Process the email content for ZK proof generation
       const proof = await zkEmail.generateProof(emlContent, campaign);
       
       if (proof) {
         console.log('Generated proof from default email:', proof);
         // Submit proof for verification and reward distribution
       }
     } catch (error) {
       console.error('Default email proof generation failed:', error);
     }
   };
   ```

2. **Update Button Labels and Behavior**:
   ```typescript
   // In the taking_action state, show two clear options:
   <Button onClick={() => emailUploadRef.current?.click()}>
     <Upload className="mr-2" />
     Upload Your Email (.eml)
   </Button>
   <Button onClick={() => handleUseDefaultEmail(campaign)} variant="secondary">
     <TestTube className="mr-2" />
     Use Default Email (Testing)
   </Button>
   ```

3. **State Management**:
   - Ensure proper state transitions from `idle` → `taking_action` → `email_pending` → `verified`
   - Handle both real email uploads and default email testing paths

## 🧪 **Testing Requirements**

1. **Default Email Flow**:
   - User clicks "Use Default Email (Testing)"
   - System loads `/public/sample-email-DKIM.eml`
   - ZK proof generation works with the sample email
   - User receives points and verification status

2. **Real Email Flow**:
   - User clicks "Upload Your Email (.eml)"
   - File picker opens for `.eml` files
   - Uploaded email is processed for ZK proof generation
   - Verification completes successfully

## 📊 **Acceptance Criteria**

- [ ] Two buttons appear in `taking_action` state: "Upload Your Email" and "Use Default Email (Testing)"
- [ ] Default email button loads actual `.eml` file from `/public/sample-email-DKIM.eml`
- [ ] ZK proof generation works with both sample and uploaded emails
- [ ] User experience matches the sleep verification flow (clean, intuitive)
- [ ] Proper error handling for both email paths
- [ ] Points are deducted and rewards distributed correctly
- [ ] Campaign state transitions work properly (`idle` → `taking_action` → `verified`)

## 🔗 **Related Files**

- `src/components/app/ProofOfAction.tsx` - Main component needing updates
- `public/sample-email-DKIM.eml` - Sample email with DKIM signature
- `public/sample-email.eml` - Basic sample email
- `src/lib/zk-email.ts` - ZK email processing logic
- `src/app/page.tsx` - Main page state management

## 🏷️ **Labels**
`bug` `frontend` `ux` `zk-email` `testing` `proof-of-action`

## 👥 **Priority**
**High** - This blocks testing of the core civic engagement functionality

---

**Environment:**
- Frontend: Next.js 15.3.3 with TypeScript
- ZK-Email SDK integration
- Sample emails prepared and ready for testing