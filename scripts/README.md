# Proof Generation Scripts

This directory contains standalone Node.js scripts for generating Zero-Knowledge Proofs using the ZK Email SDK.

## `generate-advocacy-proof.js`

### Purpose

This script generates a ZK proof to verify that an email was sent to a Member of the European Parliament (MEP). It is designed to work with the `rainbowpuffpuff/parliament_1` blueprint on the ZK Email Registry. This script serves as a local utility to test the blueprint and generate proofs without relying on the main application's UI, which is useful for development and debugging.

### Usage

1.  Place the email you sent to an MEP (saved as a `.eml` file) into this `scripts` directory.
2.  Ensure you have run `npm install` and `npm install @zk-email/sdk viem` at the project root.
3.  Execute the script from the project root:

```bash
node scripts/generate-advocacy-proof.js```
