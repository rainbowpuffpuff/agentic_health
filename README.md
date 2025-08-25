.# think2earn

This is a Next.js application that gamifies positive actions like sleep and civic engagement through a sovereign identity model on the NEAR blockchain. It was built with Firebase Studio.

This project uses a Next.js frontend, Genkit for AI features, and a Rust-based smart contract for on-chain staking on the NEAR protocol.

## Getting Started

Follow these instructions to get the project running on your local machine for development and testing.

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

### 2. Environment Variables

The AI features in this project use Genkit, which connects to Google's AI services. You will need to set up a `GEMINI_API_KEY`.

1.  Create a `.env.local` file in the root of the project:
    ```bash
    touch .env.local
    ```
2.  Get your API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
3.  Add your API key to the `.env.local` file:
    ```
    GEMINI_API_KEY="YOUR_API_KEY_HERE"
    ```

### 3. Running the Development Servers

This project requires two separate development servers to be running simultaneously: one for the Next.js frontend and one for the Genkit AI flows.

**A. Start the Frontend Server:**

Open a terminal and run the following command to start the Next.js application:

```bash
npm run dev
```

This will typically start the frontend on `http://localhost:9002`.

**B. Start the Genkit AI Server:**

Open a *second* terminal and run the following command to start the Genkit AI service:

```bash
npm run genkit:dev
```

This will start the Genkit development server, allowing the frontend to communicate with the AI models for features like photo analysis.

### 4. Accessing the Application

With both servers running, you can now open your browser and navigate to:

**`http://localhost:9002`**

You should see the application, and all features, including the AI-powered photo analysis, should be functional.

## Smart Contract Deployment (Manual Step)

The application is designed to interact with a custom staking smart contract written in Rust. The code is located in the `contracts/staking_contract` directory.

To make the staking features fully functional, you must compile and deploy this contract to the NEAR testnet yourself.

### Steps:

1.  **Build the Contract:**
    Navigate to the contract directory and run the build script:
    ```bash
    cd contracts/staking_contract
    ./build.sh
    # This will compile the contract to a .wasm file
    ```

2.  **Deploy the Contract:**
    Use the NEAR CLI to create a new testnet account and deploy the contract to it.
    ```bash
    # Example deployment command
    near deploy --wasmFile res/staking_contract.wasm --accountId your-staking-account.testnet
    ```

3.  **Update the Contract ID:**
    Once deployed, you need to tell the frontend application where to find your contract.
    -   Open the file `src/lib/constants.ts`.
    -   Replace the placeholder contract ID with your new account ID:
        ```typescript
        // Before
        export const CONTRACT_ID = "guest-book.testnet";

        // After
        export const CONTRACT_ID = "your-staking-account.testnet";
        ```

After completing these steps, the staking and unstaking features in the application will interact directly with your deployed smart contract.
