### **Working backwards from the goal**

My point of going to different hackathons was to incrementally de-risk this project. Now, with the technical, scientific, and business fundamentals validated, this is the plan to execute. It works backwards from the long-term goal, using a revenue-generating app to fund the deep-tech and hardware mission.

**The 4-Year Goal:** A self-sustaining, decentralized ecosystem where individuals use open-hardware devices for non-invasive health monitoring, get paid for their consent-driven data contributions, and accelerate global health research. Could accelerate with VC funding - quicker collabs with Universities (grant money for PhD and Postdoc students) and allow us to skip large data collection efforts directly. 

---

### **The Path Forward**

#### **Phase 1: Launch the App & Prove the Model (Next 6 Months)**

*The goal is to get self sustaining revenue. We need to prove we can build a wellness app that people will actually use and pay for. This cash flow is what funds everything else.*

**Hypothesis to Prove:** *We can build a sticky, habit-forming wellness app that generates enough SaaS revenue to fund our core R&D.*

*   **Months 1-2: Ship the MVP with `Proof of Rest`**
    *   **What we're doing:** Launch the "Tamagotchi for Wellness" app on NEAR. The core mechanic is simple: `Proof of Rest`. Users verify their sleep/rest times with timestamped photos.
    *   **Why it matters:** It is a simple "Proof of" action to implement, which lets us test and solidify the core on-chain verification loop. This is how we start building the user habit. It also lets us experiment with advertising across different stakeholders (biohacker and DeSci DAOs, online reddit community guerilla marketing, google and X ads).

*   **Months 3-4: Implement the AI Health Agent**
    *   **What we're doing:** Roll out the AI chat agent. We build on top of a locally-hosted [Android AI Chat app ](https://github.com/google-ai-edge/gallery) and using phone [sensor data](https://github.com/InfluxCommunity/SensorLogger#). This is core for giving users personalized health recommendations, without ever touching their data. A user like "Carol" can chat with the agent about her mood, logging symptoms and daily activities like sleep time. Then it can offered personalized feedback on trying behavioral shifts to improve mood.  
    *   **Why it matters:** This piece proves we can collect unstructured medical data in a secure, private environment. `Proof of Rest` is a verification mechanic which acts as an indicator, and so do the phone sensors for detecting movement. 

*   **Months 5-6: Expand "Proof of" & Turn on Revenue**
    *   **What we're doing:** Based on the agent's recommendations, we'll introduce the next logical features: `Proof of Eating`, `Proof of Exercise`. These have been previously tested in telegram groups during pop-up cities and have proved effective at incentivizing people to attest working out, or attest that they're in front of their computer "shipping code". With the core habit loop established and utility proven, we'll roll out premium subscriptions.
    *   **Why it matters:** Creating a business model around data collection with offline models, and providing incentives for habit forming behaviors. After having a foundation we will build on top of this personalized health platform.

#### **Phase 2: Build the Backend & Economic Engine (Months 6-12)**

*With the app bringing in revenue, text step is to use that money to build the decentralized backend that the entire long-term vision depends on.*

**Hypothesis to Prove:** *We can build a trustless, decentralized infrastructure for data storage and contribution rewards, setting the stage for a Hardware Impact Evaluator.*

*   **Solve Data Sovereignty:** Integrate Swarm for storage. We'll use NEAR Intents so users can easily buy postage stamps and manage access to their data without needing to be technically profficient. 
*   **Build the Economic Engine:** Implement the AVS-like consensus on NEAR, using OLAS or Shade Agents. The requirements are to have multiple node operators that stake funds and committ to running software that calculates the value of data contributions. This will be the first version of an ["impact evaluator"](https://research.protocol.ai/publications/generalized-impact-evaluators/ngwhitepaper2.pdf), using Data Shapley methods to calculate the value of data contributions and create the payment rails.

#### **Phase 3: Scale Hardware & Prove the Science (Year 2)**

*With a stable platform and recurring revenue, we can now afford to solve the hard science and manufacturing problems.*

**Hypothesis to Prove:** *The open-hardware devices we manufacture can achieve high-accuracy, non-invasive glucose monitoring, creating a dataset and moat valuable enough to attract B2B and research partners.*

*   **Scale Manufacturing:** Use the **Vanderbilt University collaboration** to move from a handful of prototypes for dedicated contributors to a scalable manufacturing plan.
*   **Launch to the Community:** Sell the first batch of devices to the public and with a discount to our most engaged app users. This will incentivize app-based metrics, reward contributors, and create a revenue pipeline.
*   **Validate the Science:** Use the revenue to fund the clinical trials needed to formally prove the efficacy of our glucose monitoring. Use the appropriate [ISO standard](https://www.iso.org/standard/54976.html) for benchmarking with existing methods. 

#### **Phase 4: Transition to an Open Protocol (Years 4+)**

*We’ve proven the app, the backend, the hardware, and the science. The final step is to give it away.*

**Hypothesis to Prove:** *The economic incentives of our Impact Evaluator are strong enough to foster a permissionless, third-party ecosystem of builders without our direct involvement.*

*   **Decentralize Governance:** Hand over control of the treasury and the protocol to the **think2earn Association** and its token holders. We become stewards, not rulers.



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

*   **Zuitzerland & The Vault Berlin:** Following a conversation with John Marshall (Executive Director, World Ethical Data Foundation), the project pivoted to focus on **non-invasive glucose monitoring**.
    *   At **[Zuitzerland](https://docs.google.com/presentation/d/19MVHgrnRaFIN7SZK1lbIykEIgTo7uqOMqjIXKXmFIjo/edit#slide=id.p)**, we won prizes from **Logos ($333)** and the **main track (950 CHF)** for a vision combining fNIRS with NFT-gated data access, where we collected fNIRS data to classify pre- vs. post-meal status.
    *   At The Vault by EigenLayer, we collected the first high-quality, open-source dataset correlating our fNIRS device against an Abbott Medical-grade CGM. This cemented the **collaboration with Vanderbilt University**, transitioning it into a formal glucose monitoring research project.

*   **OzCity & Near Protocol Rewards Program:** With the science validated, we focused on business formalization. Acceptance into the NPR Program prompted a strategic pivot to generate near-term revenue for funding long-term R&D.
    *   **Initial strategy:** Use Swarm and a Shade Agent consensus (NEAR) for B2B data storage contracts.
    *   **Realization:** This was too slow and capital-intensive to compete with existing cloud providers.
    *   **New Strategy:** Target the B2C wellness market, inspired by the success of apps like Sleepagotchi, "Don't Die," and DeSci DAOs (VitaDAO, Biohacker DAO). This customer segment has high engagement and word-of-mouth potential.
    *   **Action:** Implemented `Proof of Sleep` functionality on a NEAR contract to drive habit formation and user retention.
*   **Formalization:** Created the **"think2earn Association,"** a Blockchain-Native Swiss Association in Zug, to hold all company assets, including IP, copyright, and hardware.
*   **[ETHGlobal Cannes](https://ethglobal.com/showcase/poaprivacy-ykk5a):** Together with two contributors, we won a **Finalist prize ($1000)** and a prize from **ENS** for building POAP Privacy with stealth addresses, followed by an **ENS grant (0.25 ETH per person)**, demonstrating our continued ability to ship at the cutting edge.

**Narrative Checkpoint:** We identified our first hardware market (glucose monitoring), our first software market (wellness and productivity mobile app), had secured a university collaboration partner, and built the legal and business strategies to turn the current technical achievements into a fundable company.

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

4.  **Finally: Scale Hardware.** To generate the federated dataset, we need devices in the wild.
    *   **Action:** Scale manufacturing of functional-Near-Infrared-Spectroscopy (fNIRS) devices, selling it to the public and with a discount to our most engaged app users.
