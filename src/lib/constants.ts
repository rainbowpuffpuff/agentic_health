export const CONTRACT_ID = "v2.stake-bonus-js.think2earn.near";

// Contract explorer links for transparency and verification
export const CONTRACT_EXPLORER_URL = "https://nearblocks.io/address/stake-bonus-js.think2earn.near";
export const CONTRACT_V2_EXPLORER_URL = "https://nearblocks.io/address/v2.stake-bonus-js.think2earn.near";

// Campaign types and details
export type Campaign = 'chat_control' | 'sugar_tax' | 'sleep_compensation';
export type CampaignState = 'idle' | 'taking_action' | 'email_pending' | 'verified';

export const CAMPAIGN_DETAILS: Record<Campaign, { title: string; description: string; subject: string }> = {
    chat_control: { title: "Stop Chat Control", description: "The EU is working on a law that would monitor all citizens' communications. Voice your opposition to this mass surveillance proposal.", subject: "Regarding the 'Chat Control' Proposal" },
    sugar_tax: { title: "Should sugar be taxed?", description: "Contribute your opinion to the debate on whether a sugar tax is an effective public health policy for combating obesity and related diseases.", subject: "Opinion on Sugar Taxation Policy" },
    sleep_compensation: { title: "Should sleep be compensated?", description: "Argue for or against the idea that adequate sleep, which boosts productivity and reduces errors, should be recognized or compensated by employers.", subject: "The Economic Case for Sleep Compensation" }
};