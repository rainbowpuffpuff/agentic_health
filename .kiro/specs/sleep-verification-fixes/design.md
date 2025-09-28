# Sleep Verification Pipeline - Design Document

## Overview

The sleep verification system integrates computer vision analysis, NEAR blockchain smart contracts, and a React frontend to create a complete sleep-to-earn pipeline. This design addresses critical bugs and missing features identified during testing.

## Architecture

### Frontend (Next.js + React)
- **ProofOfRest Component**: Main UI for sleep verification flow
- **API Integration**: Fetch calls to Python backend with proper CORS handling
- **Wallet Integration**: NEAR Wallet Selector for blockchain transactions
- **State Management**: React hooks for verification flow state

### Backend (Python FastAPI)
- **Sleep Vision Module**: Computer vision analysis using PIL/Pillow
- **CORS Middleware**: Allows frontend-backend communication
- **NEAR Integration**: py-near for smart contract interactions
- **API Endpoints**: RESTful endpoints for verification and health checks

### Smart Contract (NEAR/Rust)
- **Staking Functions**: `stake()` for committing NEAR tokens
- **Withdrawal Functions**: `withdraw()` for retrieving funds with bonus
- **Agent Authorization**: Trusted agent can trigger withdrawals
- **Reward Pool**: Manages bonus fund distribution

## Components and Interfaces

### Computer Vision Analysis
```python
class SleepVisionAnalyzer:
    def analyze_sleep_photo(image_data_uri: str) -> Dict:
        # Returns: is_valid_sleep_surface, confidence, analysis, reason
```

**Features:**
- Base64 image data URI parsing
- PIL/Pillow image processing
- Brightness and aspect ratio analysis
- Fallback validation for demo mode
- Confidence scoring (0.0 - 1.0)

### API Endpoints
```python
POST /api/verify-rest
{
    "photoDataUri": "data:image/jpeg;base64,...",
    "accountId": "user.testnet"
}
```

**Response:**
```json
{
    "status": "success",
    "isSleepingSurface": true,
    "confidence": 0.8,
    "analysis": "Sleep surface detected...",
    "next_step": "Withdrawal completed with bonus"
}
```

### Smart Contract Interface
```rust
// Staking function
pub fn stake() -> Promise

// Withdrawal function (agent-only)
pub fn withdraw(staker_id: AccountId) -> Promise

// View functions
pub fn get_stake_info(staker_id: AccountId) -> StakerInfo
pub fn get_reward_pool_balance() -> String
```

## Data Models

### Frontend State
```typescript
type StakerInfo = {
    amount: string; // NEAR amount in yoctoNEAR
}

type UploadedImage = {
    url: string;    // Base64 data URI
    date: string;   // Formatted timestamp
}
```

### Backend Models
```python
class ProofOfRestRequest(BaseModel):
    photoDataUri: str
    accountId: str
```

## Error Handling

### Computer Vision Errors
- **Invalid Image Format**: Return clear error message
- **Processing Failure**: Fallback to basic validation
- **Low Confidence**: Reject with confidence threshold explanation

### CORS Errors
- **Cross-Origin Blocked**: Configure FastAPI CORS middleware
- **Missing Headers**: Validate Content-Type in requests

### Smart Contract Errors
- **Insufficient Funds**: Check reward pool balance before withdrawal
- **Unauthorized Agent**: Validate caller is trusted agent
- **Transaction Failures**: Provide retry mechanisms and clear error messages

### Network Errors
- **Backend Unavailable**: Show connection error with troubleshooting tips
- **Wallet Disconnected**: Prompt user to reconnect wallet
- **Transaction Rejected**: Handle user cancellation gracefully

## Testing Strategy

### Unit Tests
- Computer vision analysis with various image types
- API endpoint validation and error handling
- Smart contract function calls and state changes

### Integration Tests
- End-to-end sleep verification flow
- Frontend-backend API communication
- Blockchain transaction processing

### User Acceptance Tests
- Complete user journey from stake to withdrawal
- Error scenarios and recovery flows
- Cross-browser compatibility testing

## Security Considerations

### Image Processing
- Validate image size limits to prevent DoS
- Sanitize base64 input to prevent injection
- Rate limiting on verification endpoints

### Smart Contract Security
- Agent authorization checks
- Reentrancy protection on withdrawals
- Overflow protection in bonus calculations

### API Security
- Input validation on all endpoints
- CORS configuration limited to known origins
- Error messages that don't leak sensitive information