# think2earn: A Verifiable AI Platform

think2earn is a decentralized platform designed to build a fair and transparent AI Ownership Economy. It enables individuals to contribute various types of data (biometric, civic, behavioral) and, in return, receive a verifiable, economic stake in the AI models created from that data.

This project is built on the NEAR Protocol and utilizes decentralized storage solutions like Swarm. For a complete overview of the project's vision, goals, and technical architecture, please see the **[Project Charter](CHARTER.md)**.

## Project Status & Roadmap

This repository is in active development and is following a phased roadmap. The initial implementation uses a centralized AI service (Google's Genkit) as a temporary placeholder for certain features. This mock implementation will be progressively replaced with a verifiable, decentralized backend.

The full development plan is detailed in the **[Project Charter](CHARTER.md)**, which outlines the following phases:
1.  **Phase 1: Synthesis & Core Logic Implementation:** Replace the AI mock with a functional Python backend and complete the decentralized storage pipeline.
2.  **Phase 2: Verifiable Compute & Economic Validation:** Move the Python logic into a Trusted Execution Environment (TEE) and validate the economic model.
3.  **Phase 3: ZK Integration & Feature Expansion:** Replace remaining mocks with on-device Zero-Knowledge proving systems.

## Getting Started

Follow these instructions to get the current version of the project running on your local machine.

### Prerequisites

-   [Node.js](https://nodejs.org/) (v18 or later recommended)
-   [npm](https://www.npmjs.com/) (or yarn/pnpm)
-   [Rust and wasm32-unknown-unknown target](https://docs.near.org/develop/contracts/rust/introduction#setup) for smart contract development.
-   [NEAR CLI](https://docs.near.org/tools/near-cli)

### 1. Installation

First, clone the repository and navigate into the project directory. Then, install the necessary npm packages:

```bash
npm install
```

### 2. Running the Development Server

This project uses a Next.js frontend. Run the following command to start the application:

```bash
npm run dev
```

This will typically start the frontend on `http://localhost:9002`.

**Note on AI Features:** The current version may still contain placeholder AI features that require a `GEMINI_API_KEY` in a `.env.local` file. As development progresses according to the roadmap, this requirement will be removed.

### 3. Smart Contract Deployment

The application interacts with a staking smart contract located in the `contracts/staking_contract` directory. To use the staking features, you must compile and deploy this contract to the NEAR testnet.

1.  **Build the Contract:**
    ```bash
    cd contracts/staking_contract
    ./build.sh
    ```

2.  **Deploy the Contract:**
    Use the NEAR CLI to deploy the contract to a testnet account.
    ```bash
    near deploy --wasmFile res/staking_contract.wasm --accountId your-staking-account.testnet
    ```

3.  **Update the Contract ID:**
    In `src/lib/constants.ts`, replace the placeholder `CONTRACT_ID` with your deployed contract's account ID.
    ```typescript
    // Before
    export const CONTRACT_ID = "guest-book.testnet";

    // After
    export const CONTRACT_ID = "your-staking-account.testnet";
    ```
This will connect the frontend to your instance of the smart contract.