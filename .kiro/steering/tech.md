# Technology Stack

## Frontend
- **Framework**: Next.js 15.3.3 with TypeScript
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Radix UI primitives with shadcn/ui
- **State Management**: React Hook Form with Zod validation
- **Charts**: Recharts for data visualization

## Blockchain & Web3
- **Blockchain**: NEAR Protocol
- **Wallet Integration**: NEAR Wallet Selector (multiple wallet support)
- **Smart Contracts**: Rust-based contracts with near-sdk
- **Contract ID**: `stake-bonus-js.think2earn.near`

## AI & Backend Services
- **AI Framework**: Google Genkit with Gemini 2.0 Flash model
- **Backend API**: Python FastAPI (agent_logic/)
- **ML Libraries**: scikit-learn, numpy, pandas
- **Data Processing**: Custom ML pipeline for sleep pattern analysis

## Infrastructure
- **Containerization**: Docker with multi-platform support (linux/amd64)
- **Deployment**: Firebase App Hosting
- **Storage**: Swarm decentralized storage
- **Environment**: Docker Compose for local development

## Design System
- **Fonts**: Space Grotesk (headlines), Inter (body)
- **Colors**: Purple primary (#A050E1), light purple background (#F3E8FA), blue accent (#50BFE1)
- **Icons**: Lucide React with custom geometric icons

## Common Commands

### Development
```bash
npm run dev          # Start Next.js dev server on port 9002
npm run genkit:dev   # Start Genkit AI server
npm run typecheck    # TypeScript type checking
npm run lint         # ESLint code linting
```

### Build & Deploy
```bash
npm run build        # Production build
npm run start        # Start production server
npm run docker:build # Build Docker image
npm run docker:push  # Push to registry
```

### Smart Contract
```bash
cd contracts/staking_contract
./build.sh          # Compile Rust contract to WASM
near deploy --wasmFile res/staking_contract.wasm --accountId your-account.testnet
```

## Environment Variables
- `GEMINI_API_KEY`: Required for AI features
- `NEAR_ACCOUNT_ID`: NEAR account for contract interaction
- `NEAR_SEED_PHRASE`: Account credentials
- `NEXT_PUBLIC_contractId`: Public contract identifier