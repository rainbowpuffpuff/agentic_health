# Sleep Verification Pipeline - Requirements Document

## Introduction

This feature addresses critical issues in the sleep verification pipeline to ensure users can successfully verify their sleep photos and withdraw their committed funds with bonuses. The system combines computer vision analysis, NEAR blockchain integration, and user experience improvements.

## Requirements

### Requirement 1: Computer Vision Sleep Surface Detection

**User Story:** As a user, I want the system to accurately detect whether my uploaded photo shows a valid sleeping surface, so that I can complete sleep verification.

#### Acceptance Criteria

1. WHEN a user uploads a photo THEN the system SHALL analyze it using computer vision to detect sleeping surfaces
2. WHEN the photo shows a valid bed/bedroom environment THEN the system SHALL return confidence score >= 0.4
3. WHEN the photo is invalid or too small THEN the system SHALL reject it with clear error message
4. IF computer vision analysis fails THEN the system SHALL fallback to basic image validation for demo purposes

### Requirement 2: CORS and API Integration

**User Story:** As a user, I want the frontend to successfully communicate with the backend API, so that my sleep verification requests are processed.

#### Acceptance Criteria

1. WHEN frontend makes API calls to backend THEN the system SHALL allow cross-origin requests from localhost:9002
2. WHEN API request is made THEN the system SHALL include proper Content-Type headers
3. WHEN backend receives request THEN the system SHALL validate required fields (photoDataUri, accountId)
4. IF CORS is misconfigured THEN the system SHALL return proper error messages

### Requirement 3: Smart Contract Fund Withdrawal

**User Story:** As a user, I want to withdraw my committed NEAR funds with a 10% bonus after successful sleep verification, so that I receive my rewards.

#### Acceptance Criteria

1. WHEN sleep verification succeeds THEN the system SHALL automatically call the withdraw contract function
2. WHEN withdrawal is triggered THEN the system SHALL transfer staked amount + 10% bonus to user
3. WHEN user has committed funds THEN the system SHALL display a manual "Withdraw with Bonus" button
4. IF automatic withdrawal fails THEN the user SHALL be able to manually trigger withdrawal
5. WHEN withdrawal completes THEN the system SHALL update UI to reflect new balances

### Requirement 4: User Experience and Error Handling

**User Story:** As a user, I want clear feedback and intuitive controls during the sleep verification process, so that I understand what's happening and can take appropriate actions.

#### Acceptance Criteria

1. WHEN verification is in progress THEN the system SHALL show progress indicators and status messages
2. WHEN errors occur THEN the system SHALL display user-friendly error messages with actionable guidance
3. WHEN user has committed funds THEN the system SHALL clearly show withdrawal options
4. WHEN transactions complete THEN the system SHALL show success notifications with transaction links