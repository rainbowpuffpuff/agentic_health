# ZK-Email Integration Documentation

## Overview

This module provides comprehensive ZK-Email SDK integration for civic engagement proof generation. It enables users to generate zero-knowledge proofs from email communications with government officials, earning points for civic participation while maintaining privacy.

## Architecture

### Core Components

1. **CivicEngagementProver** - Main class for ZK proof generation and verification
2. **Configuration System** - Centralized config management with environment variables
3. **Email Processing** - Utilities for parsing and validating .eml files
4. **Test Suite** - Comprehensive testing infrastructure

### File Structure

```
src/lib/
├── zk-email.ts              # Main ZK-Email integration
├── zk-email-config.ts       # Configuration and utilities
├── ZK_EMAIL_README.md        # This documentation
└── __tests__/
    ├── zk-email.test.ts           # Unit tests
    ├── zk-email-integration.test.ts # Integration tests
    └── zk-email-config.test.ts     # Configuration tests
```

## Usage

### Basic Setup

```typescript
import { CivicEngagementProver } from '@/lib/zk-email';

// Initialize the prover
const prover = new CivicEngagementProver();
await prover.initialize();

// Generate proof from email
const emailContent = '...'; // .eml file content
const proof = await prover.generateCivicProof(emailContent, 'chat_control');

// Verify proof
const isValid = await prover.verifyProof(proof);
```

### Configuration

Set environment variables:

```bash
NEXT_PUBLIC_ZK_EMAIL_ENABLED=true
NEXT_PUBLIC_ZK_EMAIL_DEV_MODE=true
NEXT_PUBLIC_ZK_EMAIL_BLUEPRINT_ID=your-blueprint-id
```

### Supported Campaigns

- **chat_control** - Opposition to EU Chat Control legislation
- **sugar_tax** - Support for sugar taxation policies  
- **sleep_compensation** - Advocacy for sleep compensation legislation

## API Reference

### CivicEngagementProver

#### Methods

- `initialize()` - Initialize the ZK-Email SDK
- `generateCivicProof(emlContent, campaign)` - Generate ZK proof from email
- `verifyProof(proof)` - Verify a generated proof
- `isInitialized()` - Check if SDK is ready

### Utility Functions

- `parseEmailContent(emlContent)` - Extract metadata from email
- `validateEmailStructure(emlContent)` - Validate email format
- `generateSampleEmailForCampaign(campaign)` - Generate test emails (dev only)
- `isGovernmentEmail(email)` - Check if recipient is government official

## Testing

### Running Tests

```bash
# Run all ZK-Email tests
npm test -- --testPathPattern=zk-email

# Run specific test suites
npm test zk-email.test.ts
npm test zk-email-integration.test.ts
npm test zk-email-config.test.ts

# Run with coverage
npm test -- --coverage --testPathPattern=zk-email
```

### Test Categories

1. **Unit Tests** - Individual function testing with mocks
2. **Integration Tests** - End-to-end workflow testing
3. **Configuration Tests** - Config validation and edge cases
4. **Performance Tests** - Proof generation timing and scalability

### Mock Strategy

Tests use comprehensive mocking of the ZK-Email SDK to ensure:
- Fast test execution
- Reliable CI/CD pipeline
- Isolated component testing
- Predictable test outcomes

## Point System

### Base Points Structure

```typescript
{
  base: 50,              // Base participation points
  dkim_bonus: 15,        // Valid DKIM signature bonus
  gov_recipient_bonus: 25, // Government recipient bonus
  campaign_bonus: 20-30   // Campaign-specific bonus
}
```

### Government Email Detection

Automatically detects government recipients using domain patterns:
- `.gov`, `.senate.gov`, `.house.gov`
- `.europa.eu`, `.parliament.uk`
- `.bundestag.de`, `.assemblee-nationale.fr`

## Error Handling

### Common Errors

- **Invalid Email Format** - Missing required headers
- **Blueprint Not Found** - SDK initialization failure
- **Proof Generation Failed** - ZK circuit errors
- **Network Timeout** - Registry connection issues

### Error Recovery

- Automatic retry for network failures
- Graceful degradation in dev mode
- Comprehensive error logging
- User-friendly error messages

## Development Guidelines

### Adding New Campaigns

1. Update `SAMPLE_EMAILS` in config
2. Add campaign to `CAMPAIGN_POINTS`
3. Create test cases for new campaign
4. Update documentation

### Testing Best Practices

- Mock external dependencies
- Test error scenarios
- Validate edge cases
- Maintain high coverage (>70%)

### Performance Considerations

- Proof generation: ~5-10 seconds
- Batch processing: <30 seconds for 3 proofs
- Memory usage: <100MB per proof
- File size limit: 1MB per email

## Security

### Privacy Protection

- Zero-knowledge proofs reveal no email content
- Only proof of government communication
- No personal data stored on-chain
- DKIM signature validation ensures authenticity

### Threat Model

- Protects against email content exposure
- Prevents proof forgery
- Validates sender authenticity
- Ensures recipient verification

## Future Enhancements

### v3 Contract Integration

- On-chain proof verification
- Automated point distribution
- Contract-based reward system
- Decentralized governance

### Planned Features

- Multi-language support
- Additional government domains
- Batch proof generation UI
- Advanced analytics dashboard

## Troubleshooting

### Common Issues

1. **Tests failing** - Check environment variables
2. **Slow proof generation** - Verify network connection
3. **Invalid email format** - Ensure proper .eml structure
4. **Blueprint errors** - Check blueprint ID configuration

### Debug Mode

Enable detailed logging:

```typescript
process.env.ZK_EMAIL_DEBUG = 'true'
```

## Contributing

### Code Standards

- TypeScript strict mode
- Comprehensive test coverage
- JSDoc documentation
- Error handling for all async operations

### Pull Request Process

1. Add tests for new features
2. Update documentation
3. Ensure CI passes
4. Request review from maintainers

## License

This module is part of the think2earn project and follows the project's licensing terms.