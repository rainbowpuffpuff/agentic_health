# Requirements Document

## Introduction

This feature adds an administrative interface that allows users (initially anyone, later restricted to admins) to deposit funds directly into the NEAR smart contract. This addresses the current issue where users cannot withdraw bonus funds because the contract lacks sufficient balance for payouts.

## Requirements

### Requirement 1: Contract Deposit Interface

**User Story:** As a user with a connected NEAR wallet, I want to deposit NEAR tokens into the staking contract, so that the contract has sufficient funds to pay out bonuses to users who complete sleep verification.

#### Acceptance Criteria

1. WHEN a user has a connected NEAR wallet THEN the system SHALL display a "Deposit Funds" section in the interface
2. WHEN a user enters a valid NEAR amount (greater than 0) THEN the system SHALL enable the deposit button
3. WHEN a user clicks the deposit button THEN the system SHALL initiate a NEAR transaction to transfer funds to the contract
4. WHEN the deposit transaction is successful THEN the system SHALL display a success notification and update the contract balance display
5. IF the deposit transaction fails THEN the system SHALL display an error message with the failure reason

### Requirement 2: Contract Balance Display

**User Story:** As a user, I want to see the current contract balance, so that I can understand how much funding is available for bonus payouts.

#### Acceptance Criteria

1. WHEN the interface loads THEN the system SHALL fetch and display the current contract balance
2. WHEN a deposit is made THEN the system SHALL refresh the contract balance display
3. WHEN the contract balance is low (less than 10 NEAR) THEN the system SHALL display a warning indicator
4. WHEN the contract balance is zero THEN the system SHALL display an alert that withdrawals are not possible

### Requirement 3: Deposit Amount Validation

**User Story:** As a user, I want clear feedback on deposit amounts, so that I can make valid deposits without transaction failures.

#### Acceptance Criteria

1. WHEN a user enters a non-numeric value THEN the system SHALL display a validation error
2. WHEN a user enters an amount less than or equal to 0 THEN the system SHALL display "Amount must be greater than 0"
3. WHEN a user enters an amount greater than their wallet balance THEN the system SHALL display "Insufficient wallet balance"
4. WHEN a user enters a valid amount THEN the system SHALL show the estimated transaction fee
5. WHEN the total (amount + fee) exceeds wallet balance THEN the system SHALL display an appropriate warning

### Requirement 4: Transaction Status Tracking

**User Story:** As a user, I want to track the status of my deposit transaction, so that I know when the funds are successfully added to the contract.

#### Acceptance Criteria

1. WHEN a deposit transaction is initiated THEN the system SHALL display a loading state with "Processing deposit..."
2. WHEN the transaction is pending THEN the system SHALL show a progress indicator
3. WHEN the transaction is confirmed THEN the system SHALL display "Deposit successful!" with the transaction hash
4. IF the transaction fails THEN the system SHALL display the specific error message from NEAR
5. WHEN the transaction completes (success or failure) THEN the system SHALL re-enable the deposit form

### Requirement 5: Admin Access Control (Future)

**User Story:** As a contract owner, I want to restrict deposit functionality to authorized administrators, so that only trusted users can add funds to the contract.

#### Acceptance Criteria

1. WHEN the system is in admin-only mode THEN only accounts listed as admins SHALL see the deposit interface
2. WHEN a non-admin user connects their wallet THEN the deposit interface SHALL be hidden
3. WHEN an admin connects their wallet THEN the deposit interface SHALL be visible with full functionality
4. WHEN admin mode is disabled THEN all connected users SHALL see the deposit interface (current behavior)
5. WHEN the contract owner changes admin settings THEN the interface SHALL update accordingly without requiring a page refresh

### Requirement 6: Integration with Existing Withdrawal Flow

**User Story:** As a user who has completed sleep verification, I want to be able to withdraw bonus funds when the contract has sufficient balance, so that I can receive my earned rewards.

#### Acceptance Criteria

1. WHEN the contract balance is sufficient for a user's bonus THEN the withdraw button SHALL be enabled
2. WHEN the contract balance is insufficient THEN the withdraw button SHALL be disabled with explanatory text
3. WHEN a withdrawal is successful THEN the contract balance display SHALL update to reflect the new balance
4. WHEN multiple users attempt withdrawals simultaneously THEN the system SHALL handle race conditions gracefully
5. WHEN the contract balance becomes insufficient during a withdrawal THEN the system SHALL display an appropriate error message