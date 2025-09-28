# ZK-Email Verification System - Requirements Document

## Introduction

This feature implements zero-knowledge email verification to enable privacy-preserving civic engagement. Users can prove they contacted their representatives without revealing the actual email content, enabling a "Proof of Action" system for democratic participation rewards.

## Requirements

### Requirement 1: Email Upload and Parsing

**User Story:** As a user, I want to upload .eml email files containing my correspondence with representatives, so that I can prove I took civic action.

#### Acceptance Criteria

1. WHEN a user uploads a .eml file THEN the system SHALL parse the email headers and content
2. WHEN parsing email THEN the system SHALL extract sender, recipient, subject, and timestamp information
3. WHEN email format is invalid THEN the system SHALL provide clear error messages with guidance
4. IF email is missing required headers THEN the system SHALL reject it with specific missing field information

### Requirement 2: DKIM Signature Validation

**User Story:** As a user, I want the system to verify my email's authenticity using DKIM signatures, so that my civic engagement proof cannot be forged.

#### Acceptance Criteria

1. WHEN email contains DKIM-Signature header THEN the system SHALL validate the cryptographic signature
2. WHEN DKIM validation succeeds THEN the system SHALL mark the email as authentic
3. WHEN DKIM validation fails THEN the system SHALL reject the email with explanation
4. IF email lacks DKIM signature THEN the system SHALL warn user but allow processing for demo purposes

### Requirement 3: Zero-Knowledge Proof Generation

**User Story:** As a user, I want to generate zero-knowledge proofs of my email content using the ZK-Email SDK, so that I can prove civic engagement without revealing private information.

#### Acceptance Criteria

1. WHEN email is validated THEN the system SHALL use @zk-email/sdk to generate ZK proof of email authenticity
2. WHEN generating proof THEN the system SHALL use appropriate blueprint for civic engagement verification
3. WHEN proof generation completes THEN the system SHALL return verifiable proof data compatible with NEAR blockchain
4. IF proof generation fails THEN the system SHALL provide fallback DKIM validation method

### Requirement 4: Representative Contact Verification

**User Story:** As a user, I want the system to verify I contacted legitimate government representatives, so that my civic engagement is properly recognized.

#### Acceptance Criteria

1. WHEN analyzing email THEN the system SHALL check if recipient is a verified government representative
2. WHEN representative is verified THEN the system SHALL award full civic engagement points
3. WHEN recipient is not a representative THEN the system SHALL provide reduced points or rejection
4. IF representative database is unavailable THEN the system SHALL use pattern matching as fallback

### Requirement 5: Campaign Integration and Rewards

**User Story:** As a user, I want to select from predefined civic campaigns and receive rewards for participation, so that I'm incentivized to engage in democracy.

#### Acceptance Criteria

1. WHEN user selects a campaign THEN the system SHALL provide email templates and guidance
2. WHEN email verification succeeds THEN the system SHALL award campaign-specific points
3. WHEN multiple campaigns are completed THEN the system SHALL track progress across all campaigns
4. IF user completes campaign THEN the system SHALL unlock garden flowers and provide NEAR token rewards

### Requirement 6: Privacy and Security

**User Story:** As a user, I want my email content to remain private while still proving I took civic action, so that my political views and personal information are protected.

#### Acceptance Criteria

1. WHEN processing emails THEN the system SHALL never store full email content
2. WHEN generating proofs THEN the system SHALL only reveal necessary metadata (sender, recipient, timestamp)
3. WHEN storing verification data THEN the system SHALL use cryptographic hashes instead of plaintext
4. IF system is compromised THEN the attacker SHALL NOT be able to reconstruct original email content