### **think2earn derisking timeline**

My point of going to different hackathons was to incementally build the technical, scientific, and commercial aspects of an open-hardware BCI ecosystem.

#### **Q2 2024**

This was about validating the core concepts and proving I had the technical depth to build. My previous experience was interning at the Netherlands Forensics Institute on Explainable deepfakes in videos using DINOv2.  

*   **[ETH Dam](https://github.com/rainbowpuffpuff/brain-crypto-interfaces):** The project began solo. I built the first proof-of-concept for incentivizing brain data uploads and won the **Waku runner-up prize (~$700)** and a **QF audience prize (~$350)**, validating that the idea was technically sound and resonated within the privacy and security community.
*   **[ETHGlobal Brussels](https://ethglobal.com/showcase/tlsn-chronicle-p5s40):** Still hacking solo, I dove into the stack for data provenance. I built a TLSNotary plugin to prove continuous connections over time. While it didn't win a prize, this was an important R&D step into my knowledge for data integrity at the source,.

**Narrative Checkpoint:** The initial idea was proven viable, and I had validated the technical grit required to build complex, non-obvious components of the stack.

#### **Q3 2024**

"If you want to go fast, go alone, if you want to go far, go together". I wanted to build a team and to prove the vision was technical and fundable.

*   **[ETHGlobal Prague](https://devfolio.co/projects/brain-crypto-interfaces-b852):** The team expanded from a solo project to having 3 other contributors, Michal, Tomasz and Padre. We improved the contract structure, deployed and tested on Mantle and Optimism, and improved the basic frontend for creating payment bounties for data collection methodologies. We did not win any prizes but this was validation that I could attract contributors that care about the mission of open verifiable hardware. 
*   **ZuVillage Georgia:** The project attracted another three contributors. Maksim joined for pitch design and Figma UI, Justyna for future transfer learning tasks, and Tudor came on as a key advisor. We won two main track prizes: **The Best Idea ($2k)** and **The Best Startup Pitch ($1k)**. This was the first external validation that the vision was communicable and compelling as a business.
*   **[ETHGlobal Bangkok](https://ethglobal.com/showcase/d-acc-homomorphic-2o6wn):** We proved we could execute as a team. Albina, Sofya and Mati joined, and we translated the Figma designs into a working frontend, deployed the contracts, and won the **Linea prize ($1k)**. This led to an invitation to present at the **[Linea Community Call](https://www.youtube.com/watch?v=8DF93slWFc4)**, providing crucial ecosystem validation.

**Narrative Checkpoint:** The project evolved from a solo hack into a validated startup concept with a core team capable of designing, pitching, and shipping a functional MVP.

#### **Q4 2024**

This is when think2earn turned from a software concept to a deep-tech project with a clear path to hardware and verifiable machine learning.

*   **Ocean Protocol Foundation Grant ($8k):** We secured our first major grant. This was for **investigating and manufacturing open-hardware devices**, which derisked the most ambitious and capital-intensive part of the long-term vision.
*   **[ZuThailand Fellowship](https://dorahacks.io/buidl/20626):** Backed by the Ocean grant, I executed the research. I authored a **[paper on open-hardware functional-Near-Infrared-Spectroscopy (fNIRS) for investigating hemodynamics](https://github.com/rainbowpuffpuff/ez_think2earn/blob/master/Investigating%20Hemodynamic%20Responses_%20%5Bzuthailand%20draft%5D-1.pdf)** and, more importantly, built a functional **[EZKL pipeline to run verifiable ML inferences on private fNIRS data](https://colab.research.google.com/github/rainbowpuffpuff/ez_think2earn/blob/master/ZuThailand_EZKL_demo.ipynb)**. We won the **EZKL prize ($500)**, proving we could solve for both privacy and output verification on real neural data, and an honorable mention ($150) from the ZuThailand main track. 
*   **MegaZu '24:** I got the opportunity build alongside top developers from EigenLayer and MegaETH, with biweekly demos, with Vitalik as part of the jury. This was peer validation of a high order. I used this opportunity to explore more advanced privacy tech, implementing federated ML training with PySyft and TenSEAL, with the **[demo available here](https://drive.google.com/drive/u/0/folders/1Q-wgH5b3u_5xuKc5Oz9ylV0EETTKt9ux)**. Albina joined again towards the end of this buildathon.
 
**Narrative Checkpoint:** We successfully transitioned to a deep-tech project, securing non-dilutive funding for hardware R&D and proving we could execute on verifiable, federated machine learning using homomorphic methods. 

#### **Q1-Q3 2025**

With the core technology de-risked, the focus shifted to identifying a go-to-market application and formalizing the business structure.

*   **Zuitzerland & The Vault Berlin:** During Zuitzerland, following two conversations, one being with John Marshall, the Executive Director of the World Ethical Data Foundation, I started focusing on **non-invasive glucose monitoring**. At **[Zuitzerland](https://docs.google.com/presentation/d/19MVHgrnRaFIN7SZK1lbIykEIgTo7uqOMqjIXKXmFIjo/edit#slide=id.p)**, I won prizes from **Logos ($333)** and the **main track (950 CHF)** for a vision combining fNIRS with NFT-gated data access. Here I collected fNIRS data from participants before and after they ate to classify this status using prefrontal cortex measurements.  At The Vault, by EigenLayer, I took the crucial step of collecting the first high quality dataset, available open source. It correlates our fNIRS device against a medical-grade Continuous Glucose Monitor, by Abbott Medical.  It was also at this point that the **collaboration with Vanderbilt University** of manufacturing the open-hardware fNIRS device translated into a glucose monitoring research project.
*   **OzCity (NPR Program):** This is the current piece. With the science and tech validated, we focused on business formalization. Following OzCity participation, we applied and were accepted into the Near Protocol Rewards Program. This resulted in a shift in the business direction, a creation of a suite of investment-ready documents, and new technical milestones. Our next immediate goal is to earn revenue in order to fund the R&D efforts of think2earn. Initially, we set out to use data storage on Swarm and a Shade Agent consensus (NEAR) to prove contribution worth using Data Shapley methods. We realized that while this can attract B2B customers that are interested in data storage, landing those contracts can prove to be difficult when there are a suite of available cloud providers which offer a similar service at a much lower cost, except for the payment part and Data Shapley plus it takes a lot of time to set it up. We decided that a revenue gaining method is wellness apps and their social network, as exemplified by Sleepagotchi and the Don't Die app by Bryan Johnson, and by DAOs such as Biohacker DAO, and the ones in the DeSci space made with Molecule (e.g. VitaDAO, HairDAO). We wanted to gain a piece of this market share as we think that the customer segment is of dedicated individuals with high rate for word of mouth. We implemented the Proof of Sleep functionality, using a contract deployed on NEAR. The purpose is to enable habit forming behaviors to take place in order to increase our retention rate when. I created the "think2earn Association", a Blockchain-Native Swiss Association with Seat in the Canton of Zug. This entity will be used for holding the assets of the company, including its IP, copyright, and physical hardware.
*   **[ETHGlobal Cannes](https://ethglobal.com/showcase/poaprivacy-ykk5a):** Together with 2 think2earn contributors, we took home a **Finalist prize ($1000)** and a prize from **ENS** for building POAP Privacy with stealth addresses, demonstrating our continued ability to ship at the cutting edge of the ecosystem. Following, we also received a grant from ENS (0.25 ETH per person).

**Narrative Checkpoint:** We identified our first hardware market (glucose monitoring), our first software market (wellness and productivity mobile app), secured a university collaboration partner, and built the a case for turning our technical achievements into a fundable company.

---

### **The Roadmap: Working Backwards From the Goal**

This documented history of execution directly informs our future roadmap.

**The 5-Year Goal:** A self-sustaining, decentralized ecosystem where individuals use open-hardware devices for non-invasive health monitoring, get paid for their consent-driven data contributions, and accelerate global health research.

**The Path Forward:**

1.  **Next: Build the Economic Engine.** To pay contributors, we need a trustless system.
    *   **Action:** Implement an Actively Validated Service (AVS)-like consensus on NEAR (using [OLAS](https://olas.network/) or [Shade Agents](https://docs.near.org/ai/shade-agents/introduction) to serve as the "impact evaluator" and payment rail.

2.  **Then: Solve Data Sovereignty.** Users need secure, decentralized storage they control. To scale the data collection effort, we need a storage method that proves data contribution worth trustlessly 
    *   **Action:** Integrate Swarm for storage, using NEAR Intents to abstract the complexity of purchasing postage stamps and managing and sharing access control to agents that perform the data contribution calculation using DataShapley methods.

3.  **Then: Launch the Self-Funding Flywheel.** To fund this R&D, we need immediate revenue.
    *   **Action:** Launch the "Tamagotchi for Wellness" mobile app ([Sleepagotchi competitor](https://www.sleepagotchi.com/)) to generate our first SaaS revenue stream and build the community that will become the first customers for our hardware. Share this product in bio and desci related DAOs. 

4.  **Finally: Scale Hardware.** To generate the proprietary dataset, we need devices in the wild.
    *   **Action:** Scale manufacturing of functional-Near-Infrared-Spectroscopy (fNIRS) devices, selling it to the public and with a discount to our most engaged app users.
