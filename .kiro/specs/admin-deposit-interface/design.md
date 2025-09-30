# Design Document

## Overview

The admin deposit interface will be implemented as a new component that integrates with the existing NEAR wallet infrastructure and smart contract. The design focuses on providing a clean, intuitive interface for depositing funds while maintaining consistency with the existing UI patterns in the think2earn application.

## Architecture

### Component Structure
```
src/components/app/
├── AdminDeposit.tsx          # Main deposit interface component
├── ContractBalance.tsx       # Contract balance display component
└── DepositForm.tsx          # Deposit form with validation
```

### State Management
- React Hook Form for form validation and state
- NEAR Wallet Selector for wallet interactions
- Local component state for transaction status
- Toast notifications for user feedback

### Smart Contract Integration
- Extend existing contract interface in `contracts/staking_contract_js/`
- Add deposit method to contract TypeScript bindings
- Integrate with existing NEAR connection infrastructure

## Components and Interfaces

### AdminDeposit Component

**Props Interface:**
```typescript
interface AdminDepositProps {
  isAdminMode?: boolean;  // Future: restrict to admins only
  className?: string;
}
```

**State Management:**
```typescript
interface DepositState {
  contractBalance: string;
  isLoading: boolean;
  transactionStatus: 'idle' | 'pending' | 'success' | 'error';
  errorMessage?: string;
  lastTransactionHash?: string;
}
```

**Key Methods:**
- `fetchContractBalance()`: Retrieve current contract balance
- `handleDeposit(amount: string)`: Process deposit transaction
- `validateDepositAmount(amount: string)`: Client-side validation
- `refreshAfterTransaction()`: Update UI after transaction completion

### ContractBalance Component

**Features:**
- Real-time balance display in NEAR tokens
- Visual indicators for balance status (healthy/low/empty)
- Auto-refresh capability
- Loading states during balance fetching

**Balance Status Logic:**
- Green: Balance > 10 NEAR (healthy)
- Yellow: Balance 1-10 NEAR (low)
- Red: Balance < 1 NEAR (critical)

### DepositForm Component

**Form Fields:**
- Amount input (number, with NEAR token suffix)
- Estimated transaction fee display
- Total cost calculation (amount + fee)
- Submit button with loading states

**Validation Rules:**
- Required: Amount must be provided
- Minimum: Amount > 0
- Maximum: Amount ≤ (wallet balance - estimated fee)
- Format: Valid decimal number with up to 24 decimal places (NEAR precision)

## Data Models

### Contract Balance Model
```typescript
interface ContractBalance {
  balance: string;          // Balance in yoctoNEAR
  balanceFormatted: string; // Human-readable balance in NEAR
  lastUpdated: Date;
  status: 'healthy' | 'low' | 'critical';
}
```

### Deposit Transaction Model
```typescript
interface DepositTransaction {
  amount: string;           // Amount in NEAR
  transactionHash?: string;
  status: 'pending' | 'success' | 'failed';
  timestamp: Date;
  errorMessage?: string;
  gasUsed?: string;
}
```

### Wallet Balance Model
```typescript
interface WalletBalance {
  available: string;        // Available balance in NEAR
  reserved: string;         // Reserved for storage/gas
  total: string;           // Total balance
}
```

## Error Handling

### Client-Side Validation Errors
- Invalid amount format → "Please enter a valid number"
- Amount too low → "Amount must be greater than 0"
- Amount too high → "Insufficient wallet balance"
- Network disconnected → "Please check your internet connection"

### Transaction Errors
- Insufficient gas → "Transaction failed: insufficient gas. Please try again."
- Network timeout → "Transaction timeout. Please check the blockchain explorer."
- User rejection → "Transaction cancelled by user"
- Contract error → Display specific contract error message

### Recovery Strategies
- Automatic retry for network timeouts (max 3 attempts)
- Clear error messages with suggested actions
- Transaction hash links to NEAR Explorer for debugging
- Graceful fallback when balance fetching fails

## Testing Strategy

### Unit Tests
- Component rendering with different props
- Form validation logic
- Balance formatting utilities
- Error message display
- State transitions during transactions

### Integration Tests
- NEAR wallet connection flow
- Contract method calls (deposit function)
- Balance fetching from blockchain
- Transaction status polling
- Error handling for various failure scenarios

### End-to-End Tests
- Complete deposit flow from form to confirmation
- Balance updates after successful deposits
- Error handling for failed transactions
- Admin mode restrictions (future feature)
- Cross-browser compatibility

### Test Data
- Mock wallet with various balance scenarios
- Mock contract responses for different states
- Simulated network failures and timeouts
- Test accounts with different permission levels

## UI/UX Design

### Layout Integration
The admin deposit interface will be integrated into the main application page as a new section, positioned after the existing "Proof of Rest" and "Proof of Action" sections.

### Visual Design
- Consistent with existing purple theme (#A050E1)
- Card-based layout matching other sections
- Clear visual hierarchy with balance display prominent
- Responsive design for mobile and desktop

### User Flow
1. User connects NEAR wallet (existing flow)
2. Contract balance displays automatically
3. User enters deposit amount in form
4. Real-time validation provides immediate feedback
5. User confirms transaction in wallet
6. Progress indicator shows transaction status
7. Success/error notification appears
8. Balance updates automatically

### Accessibility
- ARIA labels for screen readers
- Keyboard navigation support
- High contrast mode compatibility
- Clear focus indicators
- Descriptive error messages

## Security Considerations

### Input Validation
- Sanitize all numeric inputs
- Prevent injection attacks in amount fields
- Validate amounts on both client and contract side
- Rate limiting for deposit attempts

### Transaction Security
- Use NEAR's built-in transaction signing
- Verify transaction hashes before showing success
- Implement proper error handling for failed transactions
- Log security-relevant events for monitoring

### Future Admin Controls
- Role-based access control implementation
- Admin account verification
- Audit logging for administrative actions
- Secure admin account management

## Performance Considerations

### Optimization Strategies
- Lazy loading of contract balance
- Debounced input validation
- Efficient re-rendering with React.memo
- Cached balance data with TTL

### Loading States
- Skeleton loaders for balance fetching
- Progressive enhancement for form interactions
- Optimistic UI updates where appropriate
- Graceful degradation for slow networks

## Integration Points

### Existing Systems
- NEAR Wallet Selector integration
- Existing contract interface extension
- Toast notification system usage
- Consistent styling with current theme

### Smart Contract Methods
```rust
// New method to add to staking contract
pub fn deposit_funds(&mut self) -> Promise {
    // Accept attached deposit and add to contract balance
    // Emit event for deposit tracking
    // Return success confirmation
}

pub fn get_contract_balance(&self) -> U128 {
    // Return current contract balance
    // Used by frontend for balance display
}
```

### API Endpoints
No new backend endpoints required - all interactions go directly through NEAR RPC and the smart contract.

## Deployment Strategy

### Phase 1: Basic Deposit Interface
- Implement core deposit functionality
- Add contract balance display
- Basic form validation and error handling
- Available to all connected users

### Phase 2: Enhanced UX
- Improved loading states and animations
- Better error messages and recovery flows
- Transaction history display
- Performance optimizations

### Phase 3: Admin Controls
- Implement admin-only mode
- Add role-based access control
- Admin dashboard for fund management
- Audit logging and monitoring

## Monitoring and Analytics

### Key Metrics
- Deposit success/failure rates
- Average deposit amounts
- Contract balance trends over time
- User engagement with deposit feature

### Error Tracking
- Failed transaction reasons
- Validation error frequencies
- Network timeout occurrences
- User abandonment points in flow

### Performance Monitoring
- Balance fetch response times
- Transaction confirmation delays
- Component render performance
- Mobile vs desktop usage patterns