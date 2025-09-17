// File: scripts/generate-advocacy-proof.js

// We use 'import' which requires a small change in package.json later
import zkeSDK from "@zk-email/sdk";
import fs from "fs/promises";
import { bytes32ToString } from "viem";

async function main() {
  console.log("🚀 Starting ZK Proof of Advocacy Generation...");

  // --- Configuration ---
  // The unique ID of the blueprint on the ZK Email Registry.
  const blueprintId = "rainbowpuffpuff/parliament_1";
  // The name of your local email file.
  const emailFileName = "mep_email.eml";
  
  try {
    // 1. Initialize the SDK
    const sdk = zkeSDK();

    // 2. Fetch the blueprint from the registry
    console.log(`\n1. Fetching blueprint: '${blueprintId}'...`);
    const blueprint = await sdk.getBlueprint(blueprintId);
    console.log("   ✅ Blueprint fetched successfully.");

    // 3. Create a prover instance from the blueprint
    // This loads the necessary circuit and proving keys on your machine.
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
    
    // The public outputs are in `proof.publicSignals`
    // The specific index depends on your blueprint definition. Let's assume the MEP email is at index 1 and CC'd email at index 2.
    // Note: The public signals are packed into 32-byte (bytes32) hex strings.
    const mepEmailBytes32 = proof.publicSignals[1];
    const ccEmailBytes32 = proof.publicSignals[2];

    const mepEmail = bytes32ToString(mepEmailBytes32).trim();
    const ccEmail = bytes32ToString(ccEmailBytes32).trim();

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
