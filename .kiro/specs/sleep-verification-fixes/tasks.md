# Sleep Verification Pipeline - Implementation Tasks

## PR 1: Computer Vision and Backend Infrastructure

- [ ] 1. Implement computer vision sleep surface detection
  - Create SleepVisionAnalyzer class with PIL/Pillow integration
  - Add image validation and confidence scoring
  - Implement fallback validation for demo mode
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 2. Fix CORS and API integration issues
  - Add FastAPI CORS middleware configuration
  - Update API endpoint to accept both photoDataUri and accountId
  - Fix response format to match frontend expectations
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 3. Correct smart contract function calls
  - Update backend to call 'withdraw' instead of 'approve_bonus'
  - Fix function parameters and error handling
  - Add demo mode for when NEAR account not configured
  - _Requirements: 3.1, 3.2_

## PR 2: Frontend UX and Manual Withdrawal

- [ ] 4. Add manual withdrawal functionality
  - Implement handleWithdraw function in main page
  - Add withdrawal button to ProofOfRest component
  - Update component props and state management
  - _Requirements: 3.3, 3.4, 3.5_

- [ ] 5. Improve error handling and user feedback
  - Add proper error messages for verification failures
  - Implement progress indicators during verification
  - Add success notifications with transaction links
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 6. Update UI components for better UX
  - Modify ProofOfRest component layout for withdrawal button
  - Add proper loading states and disabled button handling
  - Ensure responsive design for mobile devices
  - _Requirements: 4.1, 4.3_

## Testing and Validation Tasks

- [ ] 7. Test computer vision with real bed images
  - Validate analysis with default-bed.jpg image
  - Test confidence scoring with various image types
  - Verify fallback behavior when CV fails
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 8. Validate complete sleep verification flow
  - Test stake → verify → withdraw cycle
  - Verify blockchain transactions and state updates
  - Test both automatic and manual withdrawal paths
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 9. Cross-browser and device testing
  - Test on different browsers and screen sizes
  - Validate mobile camera permissions and photo upload
  - Ensure CORS works across different environments
  - _Requirements: 2.1, 4.1_

## Documentation and Cleanup

- [ ] 10. Update API documentation
  - Document new endpoint parameters and responses
  - Add error code reference and troubleshooting guide
  - Update deployment instructions for CORS configuration
  - _Requirements: 2.2, 2.4, 4.2_

- [ ] 11. Code cleanup and optimization
  - Remove unused code and debug statements
  - Optimize image processing performance
  - Add proper TypeScript types for new functions
  - _Requirements: All_