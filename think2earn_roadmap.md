### **A Timeline of Deliberate Execution: From Idea to Investable Business**

My point of going to different hackathons was to incementally build the technical, scientific, and commercial aspects of an open-hardware BCI ecosystem.

#### **Phase 1: Genesis & Technical Foundation (Q2 2024)**

This phase was about validating the core concepts and proving I had the technical depth to tackle the foundational challenges alone.

*   **[ETH Dam](https://github.com/rainbowpuffpuff/brain-crypto-interfaces):** The project began solo. I built the first proof-of-concept for incentivizing brain data uploads and won the **Waku runner-up prize (~$700)** and a **QF audience prize (~$350)**, validating that the core idea was technically sound and resonated within the privacy and security community.
*   **[ETHGlobal Brussels](https://ethglobal.com/showcase/tlsn-chronicle-p5s40):** Still hacking solo, I dove deeper into the stack to solve for data provenance. I built a TLSNotary plugin to prove continuous connections over time. While it didn't win a prize, this was an important R&D step into my knowledge for data integrity at the source,.

**Narrative Checkpoint:** The initial idea was proven viable, and I had validated the technical grit required to build complex, non-obvious components of the stack.

#### **Phase 2: Team Building & Vision Validation (Q3 2024)**

The focus shifted from solo exploration to building a team and proving the vision was not just a technical but a fundable concept.

*   **[ETHGlobal Prague](https://devfolio.co/projects/brain-crypto-interfaces-b852):** The team expanded from a solo project to having 3 other contributors, Michal, Tomasz and Padre. We improved the contract structure, deployed and tested on Mantle and Optimism, and improved the basic frontend for creating payment bounties for data collection methodologies. We did not win any prizes but this was validation that I could attract contributors that care about the mission of open verifiable hardware. 
*   **ZuVillage Georgia:** The project attracted another three contributors. Maksim joined for pitch design and Figma UI, Justyna for future transfer learning tasks, and Tudor came on as a key advisor. We won two main track prizes: **The Best Idea ($2k)** and **The Best Startup Pitch ($1k)**. This was the first external validation that the vision was communicable and compelling as a business.
*   **[ETHGlobal Bangkok](https://ethglobal.com/showcase/d-acc-homomorphic-2o6wn):** We proved we could execute as a team. Albina joined, and we translated the Figma designs into a working frontend, deployed the contracts, and won the **Linea prize ($1k)**. This led to an invitation to present at the **[Linea Community Call](https://www.youtube.com/watch?v=8DF93slWFc4)**, providing crucial ecosystem validation.

**Narrative Checkpoint:** The project evolved from a solo hack into a validated startup concept with a core team capable of designing, pitching, and shipping a functional MVP.

#### **Phase 3: The Leap to Deep Tech & Hardware (Q4 2024)**

This phase marked the most critical transition: from a software concept to a deep-tech project with a clear path to proprietary hardware and verifiable ML.

*   **Ocean Protocol Foundation Grant ($8k):** We secured our first major grant. Crucially, this funding was earmarked for **investigating and manufacturing open-hardware devices**, directly de-risking the most ambitious and capital-intensive part of the long-term vision.
*   **[ZuThailand Fellowship](https://dorahacks.io/buidl/20626):** Backed by the Ocean grant, I executed the research. I authored a **[formal paper on open-hardware functional-Near-Infrared-Spectroscopy (fNIRS) for investigating hemodynamics](https://github.com/rainbowpuffpuff/ez_think2earn/blob/master/Investigating%20Hemodynamic%20Responses_%20%5Bzuthailand%20draft%5D-1.pdf)** and, more importantly, built a functional **[EZKL pipeline to run verifiable ML inferences on private fNIRS data](https://colab.research.google.com/github/rainbowpuffpuff/ez_think2earn/blob/master/ZuThailand_EZKL_demo.ipynb)**. We won the **EZKL prize ($500)**, proving we could solve for both privacy and output verification on real neural data, and an honorable mention ($150) from the ZuThailand main track. 
*   **MegaZu '24 (Invitation-Only):** Being invited to build alongside top developers from EigenLayer and MegaETH was peer validation of the highest order. We used this opportunity to explore more advanced privacy tech, implementing federated ML training with PySyft and TenSEAL, with the **[demo available here](https://drive.google.com/drive/u/0/folders/1Q-wgH5b3u_5xuKc5Oz9ylV0EETTKt9ux)**.

**Narrative Checkpoint:** We successfully transitioned to a deep-tech project, securing non-dilutive funding for hardware R&D and proving we could execute on verifiable and federated machine learning—the technical heart of the ecosystem.

#### **Phase 4: Commercial Focus & The High-Value Use Case (2025)**

With the core technology de-risked, the focus shifted to identifying a killer go-to-market application and formalizing the business structure.

*   **Zuitzerland & The Vault Berlin:** We zeroed in on the wedge: **non-invasive glucose monitoring**. At **[Zuitzerland](https://docs.google.com/presentation/d/19MVHgrnRaFIN7SZK1lbIykEIgTo7uqOMqjIXKXmFIjo/edit#slide=id.p)**, we won prizes from **Logos ($333)** and the **main track (950 CHF)** for a vision combining fNIRS with NFT-gated data access. At The Vault, I took the crucial step of collecting the first real-world dataset, correlating our fNIRS device against a medical-grade CGM. It was also at this point I formalized the **collaboration with Vanderbilt University** to manufacture the open-hardware fNIRS device.
*   **OzCity (NPR Program):** This was the final piece. With the science and tech validated, we focused on business formalization. The intensive NPR program resulted in the creation of the entire suite of investment-ready documents: The One Pager, Lean Canvas, Financials, and the refined, "working backwards" Roadmap.
*   **[ETHGlobal Cannes](https://ethglobal.com/showcase/poap-privacy-75z2q):** As a newly formed team, we took home a **Finalist prize** for building POAP Privacy with stealth addresses, demonstrating our continued ability to ship at the cutting edge of the ecosystem.

**Narrative Checkpoint:** We identified our beachhead market (glucose monitoring), secured a university manufacturing partner, and built the professional business case required to transform a series of technical achievements into a fundable, scalable company.

---

### **The Roadmap: Working Backwards From the Goal**

This documented history of execution directly informs our future roadmap.

**The 5-Year Goal:** A self-sustaining, decentralized ecosystem where individuals use open-hardware devices for non-invasive health monitoring, get paid for their consent-driven data contributions, and accelerate global health research.

**The Path Forward:**

1.  **Next: Build the Economic Engine.** To pay contributors, we need a trustless system.
    *   **Action:** Implement an Actively Validated Service (AVS)-like consensus on NEAR (using [OLAS](https://olas.network/) or [Shade Agents](https://docs.near.org/ai/shade-agents/introduction) to serve as the "impact evaluator" and payment rail.

2.  **Then: Solve Data Sovereignty.** Users need secure, decentralized storage they control.
    *   **Action:** Integrate Swarm for storage, using NEAR Intents to abstract the complexity of purchasing postage stamps and managing access control.

3.  **Then: Launch the Self-Funding Flywheel.** To fund this R&D, we need immediate revenue.
    *   **Action:** Launch the "Tamagotchi for Wellness" mobile app to generate our first SaaS revenue stream and build the community that will become the first customers for our hardware.

4.  **Finally: Scale Hardware.** To generate the proprietary dataset, we need devices in the wild.
    *   **Action:** Leverage the Vanderbilt University collaboration to scale manufacturing of the functional-Near-Infrared-Spectroscopy (fNIRS) device, selling it directly to our most engaged app users.
