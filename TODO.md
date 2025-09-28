# think2earn: Development Roadmap & Tasks

This document outlines the development tasks for the think2earn project, aligned with the official roadmap in **[CHARTER.md](CHARTER.md)**.

---

## Phase 1: Synthesis & Core Logic Implementation

-   **Objective:** Consolidate all project assets into a single codebase, replace the mock AI scoring system with a functional Python backend, and complete the decentralized storage pipeline.

-   **Tasks:**
    -   [ ] **Migrate Python Logic:** Move the `memes_glucose.py` script and its dependencies from the `CypherShare` repository into the `agentic_health` codebase.
    -   [ ] **Implement Scoring Algorithm:** Develop a new Python script (`shapley_scorer.py`) that implements the data contribution scoring rules defined in the original mock AI flow.
    -   [ ] **Create Centralized API Endpoint:** Deploy the `shapley_scorer.py` script to a temporary, centralized serverless endpoint.
    -   [ ] **Replace AI Mock:** Refactor the frontend to call the new scoring API instead of the placeholder Genkit AI flow.
    -   [ ] **Complete Swarm Integration:** Implement the backend logic for the `SwarmStorage.tsx` component to enable file uploads to the Swarm testnet.

---

## Phase 2: Verifiable Compute & Economic Validation

-   **Objective:** Decentralize the scoring process by moving the Python logic into a Trusted Execution Environment (TEE) and validate the platform's economic model.

-   **Tasks:**
    -   [ ] **Containerize Scoring Script:** Package the `shapley_scorer.py` script and its environment into a Docker container.
    -   [ ] **Deploy Shade Agent:** Deploy the container as a Shade Agent on the NEAR testnet.
    -   [ ] **Update Frontend for TEE:** Refactor the data contribution flow to call the on-chain Shade Agent and retrieve the verifiable result.
    -   [ ] **Build Simulation Environment:** Create a test suite with AI agents to simulate user behavior, stress-test the scoring engine, and validate the staking contract logic.
    -   [ ] **Generate Simulation Report:** Run the simulation and produce a report detailing the system's performance, cost, and economic behavior under load.

---

## Phase 3: ZK Integration & Feature Expansion

-   **Objective:** Achieve end-to-end decentralization and privacy by replacing the remaining mock flows with on-device Zero-Knowledge proving systems.

-   **Tasks:**
    -   [ ] **Integrate ZK-Email:** Replace the mock "Civic Action" flow with a real ZK-Email SDK to generate and verify proofs on-device.
    -   [ ] **Integrate ZK Mopro:** Replace the mock "Proof of Rest" flow with an on-device model and ZK Mopro to generate and verify proofs of behavior.
    -   [ ] **Remove Genkit Dependency:** Fully remove any remaining code related to the centralized Genkit AI service.
    -   [ ] **Research New Data Streams:** Begin research and UX design for future high-value data streams to expand the platform.