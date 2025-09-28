# think2earn: Project Charter

## 1. Lean Canvas: A Verifiable AI Platform

### 1.1. Problem
- **P1: Opaque & Extractive AI Economies:** Data creators lack ownership, verifiable attribution, and economic stake in the AI models their data helps build.
- **P2: High-Friction & Siloed Data Contribution:** Valuable personal data is difficult to contribute to research securely and with fair compensation.
- **P3: Data Scarcity & Provenance Issues for B2B:** Enterprises and researchers lack access to novel datasets with a verifiable chain of evidence for ethical sourcing and compliance.

### 1.2. Customer Segments
- **Data Contributors:** Quantified-selfers, bio-hackers, individuals with chronic conditions, activists, and citizens.
- **Data Consumers (B2B):** Research labs, health-tech companies, and regulated industries requiring AI with auditable data provenance.

### 1.3. Unique Value Proposition
- **Core Message:** Contribute any data, verifiably own the AI it creates.
- **For Contributors:** Securely contribute diverse data and receive a perpetual, fair share of the IP in the resulting AI.
- **For Consumers:** Access unique, multi-modal datasets with an unbreakable, on-chain chain of evidence.

### 1.4. Solution
- **S1 (Ownership & Fairness):** Use Shade Agents on NEAR to run Python-based model training and Shapley value scoring to create a dynamic, on-chain IP ledger.
- **S2 (Data Contribution):** Enable multi-modal, privacy-preserving data ingestion (Biometric, Civic, Behavioral).
- **S3 (Data Access & Privacy):** Use Swarm for encrypted storage, with access managed by NEAR NFTs, and a roadmap towards Fully Homomorphic Encryption (FHE).

### 1.5. Revenue Streams
- **PaaS Fees:** B2B clients pay recurring fees for licensed access to anonymized datasets.
- **Verifiable Compute Services:** B2B clients pay fees to run proprietary models against our private datasets in a secure TEE/FHE environment.
- **Value Distribution:** All revenue is programmatically split via smart contracts with IP holders based on their on-chain Shapley scores.

### 1.6. Key Metrics
- **North Star:** Verifiable AI Contributions (VACs).
- **Business Traction:** Monthly Recurring Revenue (MRR) from B2B services.
- **Mission Success:** Total Value Distributed (TVD) to community IP holders.

### 1.7. Unfair Advantage
- **The Algorithmic IP Model:** An on-chain system using Shapley values to programmatically assign ownership, creating partners, not just data sellers.
- **The Multi-Modal, Verifiable Data Asset:** A platform to create a portfolio of unique, verifiable data assets with an auditable chain of evidence.
- **The Privacy-Preserving Roadmap:** A phased strategy towards FHE, attracting sensitive enterprise clients.

## 2. Refined Project Roadmap

### Phase 1: Synthesis & Core Logic Implementation
- **Objective:** Consolidate assets into the `agentic_health` codebase, replace the critical AI mock with a functional Python backend, and complete the decentralized storage pipeline.
- **Action Items:**
    1. Migrate Python ML logic (`memes_glucose.py`) into the main repository.
    2. Implement a `shapley_scorer.py` script based on the rules in the mock AI flow.
    3. Deploy the Python script behind a temporary, centralized API endpoint.
    4. Update the frontend to call this new API instead of the Genkit mock.
    5. Complete the Swarm integration to enable file storage on the Swarm testnet.

### Phase 2: Verifiable Compute & Economic Validation
- **Objective:** Fulfill the "Verifiable AI" requirement by moving the Python scoring logic into a Trusted Execution Environment (TEE) and validating the economic model.
- **Action Items:**
    1. Containerize the scoring script (e.g., with Docker).
    2. Deploy the container as a Shade Agent on the NEAR testnet.
    3. Refactor the frontend to call the on-chain Shade Agent.
    4. Build a simulation environment with AI agents to stress-test the economic model.
    5. Generate a Simulation Report documenting performance, cost, and behavior.

### Phase 3: ZK Integration & Feature Expansion
- **Objective:** Replace remaining mock flows with on-device Zero-Knowledge proving systems for end-to-end privacy.
- **Action Items:**
    1. Integrate a ZK-Email SDK to replace the civic action mock.
    2. Integrate ZK Mopro to replace the proof of rest mock.
    3. Remove the centralized Genkit AI dependency entirely for user-facing flows.
    4. Begin research and design for new data streams.

## 3. Value Flow Summary

- **Core Loop:** Data Contributors provide privacy-preserved data to the think2earn platform. The platform provides licensed data access to B2B customers (Research Institutions, Governments) in exchange for revenue. This revenue is then programmatically shared with the Data Contributors.
- **User Adoption:** Users are attracted by a painless, non-invasive alternative for personal health monitoring (initially glucose), with the added benefit of earning from their data.
- **Technical Moat:** The platform's models become more accurate over time through contributions from open-source developers and data contributors, with a trustless AVS/ZK prover layer verifying performance improvements and triggering rewards.
- **Ecosystem Vision:** Evolve into a decentralized standard with open-source hardware and software, managed by a foundation that provides grants and specifications to a community of developers and manufacturers.