// File: scripts/generate-advocacy-proof.js

import { initZkEmailSdk } from "@zk-email/sdk"; // Corrected import based on v2.0.6 docs
import fs from "fs/promises";
import { fromBytes } from "viem";

async function main() {
  console.log("🚀 Starting ZK Proof of Advocacy Generation...");

  // --- Configuration ---
  const blueprintId = "rainbowpuffpuff/parliament_1";
  const emailFileName = "mep_email.eml";
  
  try {
    // 1. Initialize the SDK using the documented 'initZkEmailSdk' function
    const sdk = initZkEmailSdk(); // Corrected initialization

    // 2. Fetch the blueprint from the registry
    console.log(`\n1. Fetching blueprint: '${blueprintId}'...`);
    const blueprint = await sdk.getBlueprint(blueprintId);
    console.log("   ✅ Blueprint fetched successfully.");

    // 3. Create a prover instance from the blueprint
    const prover = blueprint.createProver();
    console.log("   ✅ Prover instance created.");

    // 4. Read the raw email file from your local disk
    console.log(`\n2. Reading local email file: '${emailFileName}'...`);
    const emlContent = await fs.readFile(`scripts/${emailFileName}`, "utf-8");
    console.log("   ✅ Email file read successfully.");

    // 5. Generate the ZK proof
    console.log("\n3. Generating ZK proof... (This is the magic step and may take a moment!) ✨");
    const proof = await prover.generateProof(emlContent);
    
    if (!proof) {
      throw new Error("Proof generation returned null. The email likely doesn't match the blueprint's regex.");
    }
    console.log("   ✅ Proof generated!");

    // 6. Decode and display the public outputs for verification
    console.log("\n4. Analyzing the public proof data...");
    
    const mepEmailBytes32 = proof.publicSignals[1];
    const ccEmailBytes32 = proof.publicSignals[2];

    const mepEmail = fromBytes(mepEmailBytes32, 'string').trim();
    const ccEmail = fromBytes(ccEmailBytes32, 'string').trim();

    console.log("\n=======================================================");
    console.log("          🎉 ZK PROOF VERIFICATION COMPLETE 🎉");
    console.log("=======================================================");
    console.log(`  Proved Recipient (MEP): ${mepEmail}`);
    console.log(`  Proved CC Recipient:    ${ccEmail}`);
    console.log("\n  Your sender address and email content remain PRIVATE.");
    console.log("=======================================================");
    console.log("\nBelow is the full proof object you can use on-chain:");
    console.log(JSON.stringify(proof, null, 2));

  } catch (error) {
    console.error("\n❌ An error occurred during proof generation:", error.message);
  }
}

main();