# Requirements Document

## Introduction

This feature focuses on implementing a real Python-based machine learning scoring system to replace the current Genkit AI mock in the agentic_health codebase. This includes creating a functional ML pipeline for fNIRS data processing and integrating Swarm storage with NEAR token payments. This represents Phase 1 of the think2earn roadmap, establishing the foundation for verifiable AI by first implementing centralized but real ML scoring before moving to decentralized TEE execution.

## Requirements

### Requirement 1

**User Story:** As a data contributor, I want my fNIRS biometric data to be scored by a real machine learning algorithm, so that I receive accurate feedback on my data quality and contribution value.

#### Acceptance Criteria

1. WHEN a user submits fNIRS data through the DataContribution component THEN the system SHALL process the data using the migrated Python ML pipeline
2. WHEN the Python scoring algorithm processes the data THEN the system SHALL return a numerical score between 0-100 representing data quality
3. WHEN the scoring is complete THEN the system SHALL display the score to the user in the frontend
4. IF the data format is invalid THEN the system SHALL return an error message explaining the required format

### Requirement 2

**User Story:** As a platform operator, I want a Python ML pipeline for fNIRS data processing to be implemented, so that we have real scoring capabilities instead of AI mocks.

#### Acceptance Criteria

1. WHEN the ML pipeline processes fNIRS data THEN it SHALL convert raw optical signals into dHbO (oxygenated hemoglobin) and dHbR (deoxygenated hemoglobin) measurements
2. WHEN feature extraction occurs THEN the system SHALL segment data into epochs and extract statistical features (mean, variance, slope) from each epoch
3. WHEN glucose prediction runs THEN the system SHALL use regression models to predict glucose levels from the processed fNIRS features
4. WHEN the Python environment is set up THEN all dependencies for the ML pipeline SHALL be properly installed and configured
5. WHEN the scoring service is deployed THEN it SHALL be accessible via a REST API endpoint
6. IF the Python script encounters an error THEN the system SHALL log the error and return a meaningful error response

### Requirement 3

**User Story:** As a developer, I want the Shapley value scoring rules to be implemented as a deterministic Python algorithm, so that data contribution scoring is transparent and reproducible.

#### Acceptance Criteria

1. WHEN the shapley_scorer.py script is created THEN it SHALL implement the scoring rules defined in score-data-contribution-flow.ts
2. WHEN scoring data THEN the algorithm SHALL evaluate data length, signal noise, formatting, and glucose correlation
3. WHEN the same data is scored multiple times THEN the system SHALL return identical scores (deterministic behavior)
4. WHEN the scoring algorithm runs THEN it SHALL complete processing within 30 seconds for typical fNIRS data files

### Requirement 4

**User Story:** As a data contributor, I want to purchase Swarm postage stamps using NEAR tokens and store my data on Swarm, so that my contribution is permanently recorded in decentralized storage with a payment mechanism I control.

#### Acceptance Criteria

1. WHEN a user wants to store data THEN the system SHALL allow them to purchase Swarm postage stamps on Gnosis using NEAR tokens
2. WHEN purchasing postage stamps THEN the system SHALL handle the cross-chain token bridge from NEAR to Gnosis
3. WHEN data scoring is successful THEN the system SHALL upload the data file to Swarm using the purchased postage stamps
4. WHEN uploading to Swarm THEN the system SHALL encrypt the data before storage
5. WHEN the upload is complete THEN the system SHALL return a Swarm hash for the stored data
6. IF the Swarm upload fails THEN the system SHALL retry up to 3 times before reporting an error

### Requirement 5

**User Story:** As a platform administrator, I want comprehensive logging and monitoring of the scoring process, so that I can track system performance and debug issues.

#### Acceptance Criteria

1. WHEN any scoring operation occurs THEN the system SHALL log the operation with timestamp, user ID, and result
2. WHEN errors occur THEN the system SHALL log detailed error information including stack traces
3. WHEN the API is called THEN the system SHALL track response times and success rates
4. WHEN system resources are under stress THEN the system SHALL log performance metrics

### Requirement 6

**User Story:** As a data contributor, I want to use my NEAR tokens to pay for Swarm storage, so that I can seamlessly store my data using tokens I already hold in the think2earn ecosystem.

#### Acceptance Criteria

1. WHEN a user initiates data storage THEN the system SHALL check their NEAR token balance
2. WHEN sufficient NEAR tokens are available THEN the system SHALL facilitate the cross-chain payment to purchase Swarm postage stamps
3. WHEN the payment is processed THEN the system SHALL update the user's token balance and storage allowance
4. IF insufficient NEAR tokens are available THEN the system SHALL prompt the user to acquire more tokens or stake additional tokens

### Requirement 7

**User Story:** As a frontend developer, I want the handleDataContribution function to be updated to use the new Python API, so that the user interface works with real ML scoring instead of mocks.

#### Acceptance Criteria

1. WHEN the frontend integration is complete THEN the handleDataContribution function SHALL call the Python API endpoint instead of Genkit
2. WHEN the API call is made THEN the system SHALL handle loading states appropriately
3. WHEN the API returns a response THEN the system SHALL update the UI with the scoring results
4. IF the API call fails THEN the system SHALL display an appropriate error message to the user