# Project Structure

## Root Level
- **Configuration**: `package.json`, `tsconfig.json`, `tailwind.config.ts`, `next.config.ts`
- **Docker**: `docker-compose.yaml`, `apphosting.yaml` for deployment
- **Documentation**: `README.md`, `TODO.md`, `docs/blueprint.md`

## Frontend (`src/`)
```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout with fonts and providers
│   ├── page.tsx           # Main application page
│   └── globals.css        # Global styles and CSS variables
├── components/
│   ├── ui/                # shadcn/ui components (buttons, forms, etc.)
│   ├── app/               # Application-specific components
│   │   ├── DataContribution.tsx
│   │   ├── ProofOfAction.tsx
│   │   ├── ProofOfRest.tsx
│   │   ├── SleepLog.tsx
│   │   └── SwarmStorage.tsx
│   ├── icons/             # Custom SVG icon components
│   ├── TutorialDialog.tsx
│   └── WalletProvider.tsx # NEAR wallet integration
├── ai/
│   ├── genkit.ts          # AI configuration
│   └── flows/             # Genkit AI flows
├── hooks/                 # Custom React hooks
├── lib/
│   ├── constants.ts       # App constants (contract IDs, etc.)
│   └── utils.ts           # Utility functions
└── contracts/             # Contract TypeScript bindings
```

## Backend (`agent_logic/`)
```
agent_logic/
├── main.py               # FastAPI application entry point
├── ml_pipeline.py        # ML processing pipeline
├── shapley_scorer.py     # Shapley value scoring logic
├── test_ml_pipeline.py   # Unit tests
├── requirements.txt      # Python dependencies
└── Dockerfile           # Container configuration
```

## Smart Contracts (`contracts/`)
```
contracts/
├── staking_contract/     # Rust NEAR contract
│   ├── Cargo.toml       # Rust dependencies
│   └── src/lib.rs       # Contract implementation
└── staking_contract_js/ # TypeScript contract bindings
```

## Data & Research (`eigen_blood/`)
- Contains research data sessions with CGM and fNIRS logs
- Separate folders for `first_session/` and `second_session/`
- Python scripts for data cleaning and analysis

## Architecture Patterns

### Component Organization
- **UI Components**: Reusable components in `src/components/ui/`
- **App Components**: Feature-specific components in `src/components/app/`
- **Layout**: Single root layout with global providers

### State Management
- React Hook Form for form state
- NEAR Wallet Selector for wallet state
- Local component state for UI interactions

### API Integration
- Genkit flows for AI processing
- FastAPI backend for ML operations
- NEAR RPC for blockchain interactions

### Styling Conventions
- Tailwind utility classes
- CSS custom properties for theming
- Consistent spacing and typography scale
- Component-level styling with className props