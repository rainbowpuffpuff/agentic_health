# Implementation Plan

- [x] 1. Set up Python ML pipeline infrastructure
  - Create ml_pipeline.py module in agent_logic directory with FastAPI endpoints
  - Set up proper Python environment with ML dependencies (numpy, pandas, scikit-learn)
  - Create data models for fNIRS processing requests and responses
  - _Requirements: 2.1, 2.2, 2.5_

- [ ] 2. Create fNIRS data processing pipeline from scratch
  - Implement fNIRS data preprocessing functions (CSV parsing, validation, noise filtering)
  - Create dHbO/dHbR conversion algorithms using extinction coefficients
  - Implement epoch-based feature extraction (mean, std, skew, kurtosis, max_minus_min)
  - Add data quality assessment metrics (signal-to-noise ratio, completeness checks)
  - _Requirements: 2.1, 2.2, 2.3_

- [ ] 3. Implement glucose prediction models for scoring
  - Create basic regression models (RandomForest, Ridge) for glucose prediction from fNIRS features
  - Implement model training pipeline with synthetic or sample data
  - Add prediction confidence scoring based on model ensemble agreement
  - Create model persistence (save/load) functionality
  - _Requirements: 2.3_

- [ ] 4. Enhance Shapley scoring algorithm with real ML integration
  - Expand existing shapley_scorer.py to use actual fNIRS processing results instead of mocks
  - Integrate data quality metrics from the ML pipeline (signal-to-noise, epoch count, feature completeness)
  - Use real glucose prediction accuracy as part of the contribution scoring
  - Implement the deterministic scoring rules from the Genkit prompt but with actual ML metrics
  - Add Shapley value calculation based on marginal contribution to model performance
  - Write unit tests to ensure scoring consistency and determinism
  - _Requirements: 3.1, 3.2, 3.3_

- [ ] 5. Fix Python API endpoint for data contribution scoring
  - Update the existing /score endpoint in main.py to use /api/score-contribution path
  - Integrate ml_pipeline and enhanced shapley_scorer modules into the endpoint
  - Fix the frontend API call to match the correct endpoint path
  - Implement proper error handling and response formatting matching frontend expectations
  - Add request validation and sanitization
  - _Requirements: 2.4, 5.1, 5.2_

- [ ] 6. Replace Genkit AI integration in frontend
  - Update handleDataContribution function in src/app/page.tsx to call Python API
  - Remove dependency on score-data-contribution-flow.ts Genkit flow
  - Update error handling to work with new API response format
  - Modify progress tracking to reflect Python processing stages
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 7. Add missing approve_bonus function to staking contract
  - Implement approve_bonus function in contracts/staking_contract/src/lib.rs
  - Add agent authorization and bonus approval logic
  - Update contract to handle agent-initiated bonus approvals
  - Test the integration with the existing /api/verify-rest endpoint
  - _Requirements: 6.1, 6.2_

- [ ] 8. Implement NEAR token payment system for Swarm storage
  - Extend staking contract with storage payment functions (initiate_storage_payment, confirm_storage_payment)
  - Create bridge service module for NEAR to Gnosis chain token transfers
  - Add token balance validation and payment flow in frontend
  - Implement cross-chain transaction monitoring and confirmation
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 9. Complete Swarm storage integration with postage stamp purchasing
  - Implement postage stamp purchase functionality using bridged tokens
  - Add client-side data encryption before Swarm upload
  - Complete SwarmStorage component backend integration for file uploads
  - Create Swarm hash storage and retrieval system
  - Connect SwarmStorage component to actual backend endpoints
  - _Requirements: 4.1, 4.2, 4.3, 4.5_

- [ ] 10. Add comprehensive logging and monitoring system
  - Implement detailed logging for all ML processing steps
  - Add performance metrics tracking (processing time, memory usage)
  - Create error logging with stack traces and context information
  - Add API response time and success rate monitoring
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 11. Create end-to-end integration tests
  - Write tests for complete data flow from upload to Swarm storage
  - Test error handling scenarios (invalid data, payment failures, storage errors)
  - Create performance tests for ML pipeline under load
  - Add security tests for input validation and data encryption
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.4, 4.6_