
# Application Architecture Overview

This document provides a high-level overview of the frontend component architecture for the `think2earn` application. The main goal of this structure is to promote separation of concerns, improve maintainability, and make the codebase easier to understand.

The primary UI is managed by `src/app/page.tsx`, which acts as the main container and state manager. Most of the visual elements are broken down into smaller, reusable components located in `src/components/app/`.

## Core Component: `src/app/page.tsx`

This file is the heart of the application. It is responsible for:

- **State Management:** Holds the majority of the application's state using React's `useState` and `useEffect` hooks. This includes user information, wallet connection status, contract data, device ownership, and UI state (e.g., `appState`).
- **Logic and Handlers:** Contains all the core logic and event handler functions. This includes interactions with the NEAR blockchain (staking, withdrawing, calling contract methods), handling AI flow requests, processing file uploads, and managing the application's lifecycle.
- **Component Orchestration:** Imports and renders the various sub-components from `src/components/app/`, passing down the necessary state and handler functions as props.

## Feature Components (`src/components/app/`)

These components are responsible for rendering specific sections or features of the UI. They are designed to be as "dumb" as possible, meaning they primarily receive data and functions as props and do not manage their own complex state.

- **`Header.tsx`**: Renders the sticky top navigation bar. It displays the app title, the user's "Intention Points", and the wallet management section (Connect/Disconnect button, account ID, and NEAR balance).

- **`AdminDashboard.tsx`**: A special component that is only rendered if the connected user is the contract owner. It provides UI for admin-specific actions like approving bonuses and depositing funds into the reward pool.

- **`ProofOfRest.tsx`**: Manages the entire "Proof of Rest" user flow. It has two main views:
    1.  The initial card for committing NEAR to start the process.
    2.  The photo verification UI, which includes the camera view, file upload options, and the default photo button. This view is shown when `appState` is `'taking_photo'`.

- **`ProofOfAction.tsx`**: Renders the "Proof of Action" card, allowing users to select a civic campaign, send a signed email, and upload the email for verification.

- **`ActionGarden.tsx`**: A simple presentational component that displays the grid of flowers, showing which ones have been "unlocked" through civic action.

- **`DeviceStore.tsx`**: Displays the purchasable fNIRS and Glucose Monitor devices, allowing users to acquire them with their "Intention Points".

- **`DataContribution.tsx`**: Contains the form for users to upload their fNIRS and glucose data files. It also has a static `History` sub-component to display the table of past contributions.

- **`SwarmStorage.tsx`**: Manages the UI for the decentralized storage setup flow on Swarm, guiding the user through key generation, funding, and postage stamp purchasing.

- **`SleepLog.tsx`**: Renders the sidebar component for displaying sleep history. It includes the logic for the locked/unlocked state and shows the Whoop data chart and the journal of verified sleep entries.

- **`LiveMotion.tsx`**: A simple card that displays the live status of the device's accelerometer, indicating whether the user is still or moving.

## Data Flow

The data flow is unidirectional, flowing from the main `page.tsx` component down to the feature components.

1.  **State Lives in `page.tsx`**: All major state variables are initialized and updated in `page.tsx`.
2.  **Props are Passed Down**: `page.tsx` passes the required state values and callback functions (event handlers) down to the child components as props.
3.  **Events Bubble Up**: When a user interacts with a feature component (e.g., clicks a button), the component calls the appropriate handler function it received as a prop. This function, which lives in `page.tsx`, then updates the central state.
4.  **UI Re-renders**: The state update in `page.tsx` triggers a re-render, and the new state is passed down to the child components, causing the UI to reflect the changes.

This architecture ensures that the state is centralized and predictable, making it easier to debug issues and reason about the application's behavior.
