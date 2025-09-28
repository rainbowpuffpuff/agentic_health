'use server';
/**
 * @fileOverview AI flows for the application, consolidated to prevent module resolution issues.
 */

import { z } from 'zod';
import { ai } from './ai-client';

//
// == DETECT SLEEPING SURFACE FLOW ==
//

const DetectSleepingSurfaceInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a potential sleeping area, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type DetectSleepingSurfaceInput = z.infer<typeof DetectSleepingSurfaceInputSchema>;

const DetectSleepingSurfaceOutputSchema = z.object({
    isSleepingSurface: z.boolean().describe('Whether the image contains a clear sleeping surface like a bed, pillows, or sheets.'),
    reason: z.string().describe('A brief explanation for the decision, especially if no sleeping surface is detected.'),
});
export type DetectSleepingSurfaceOutput = z.infer<typeof DetectSleepingSurfaceOutputSchema>;


export async function detectSleepingSurface(input: DetectSleepingSurfaceInput): Promise<DetectSleepingSurfaceOutput> {
  return detectSleepingSurfaceFlow(input);
}

const detectSleepingSurfacePrompt = ai.definePrompt({
  name: 'detectSleepingSurfacePrompt',
  input: {schema: DetectSleepingSurfaceInputSchema},
  output: {schema: DetectSleepingSurfaceOutputSchema},
  prompt: `You are an expert at analyzing images to determine if they are suitable for a sleep log.
Your task is to identify if the provided image contains a clear sleeping surface.

A sleeping surface is defined as a bed, a made-up bed with pillows and sheets, a mattress, a futon, or a couch prepared for sleeping.
The image should clearly depict a place where someone is about to sleep.

Analyze the image and determine if it meets the criteria.
Photo: {{media url=photoDataUri}}

- If a clear sleeping surface is visible, set isSleepingSurface to true.
- If the image does not clearly show a clear sleeping surface (e.g., it's a picture of a desk, a pet, a selfie, or it's too dark/blurry), set isSleepingSurface to false and provide a gentle, user-friendly reason.
- Example Reason (if false): "It looks like this photo might not be of your bed. Please try taking a clear picture of your sleeping area."
`,
});

const detectSleepingSurfaceFlow = ai.defineFlow(
  {
    name: 'detectSleepingSurfaceFlow',
    inputSchema: DetectSleepingSurfaceInputSchema,
    outputSchema: DetectSleepingSurfaceOutputSchema,
  },
  async input => {
    const {output} = await detectSleepingSurfacePrompt(input);
    return output!;
  }
);


//
// == ANALYZE EMAIL STANCE FLOW ==
//

const AnalyzeEmailStanceInputSchema = z.object({
  emailContent: z
    .string()
    .describe("The full text content of the email to be analyzed."),
  campaignTopic: z.string().describe("The topic of the campaign the email is about (e.g., 'Sugar Tax', 'Chat Control')."),
});
export type AnalyzeEmailStanceInput = z.infer<typeof AnalyzeEmailStanceInputSchema>;

const AnalyzeEmailStanceOutputSchema = z.object({
    stance: z.enum(['Pro', 'Against', 'Neutral']).describe("The user's stance on the topic."),
    reason: z.string().describe('A brief, one-sentence explanation for the determined stance.'),
});
export type AnalyzeEmailStanceOutput = z.infer<typeof AnalyzeEmailStanceOutputSchema>;


export async function analyzeEmailStance(input: AnalyzeEmailStanceInput): Promise<AnalyzeEmailStanceOutput> {
  return analyzeEmailStanceFlow(input);
}

const analyzeEmailStancePrompt = ai.definePrompt({
  name: 'analyzeEmailStancePrompt',
  input: {schema: AnalyzeEmailStanceInputSchema},
  output: {schema: AnalyzeEmailStanceOutputSchema},
  prompt: `You are an expert at analyzing text to determine the author's stance on a specific topic.
The user has sent an email as part of a civic action campaign. Your task is to read the email and determine if they are "Pro" (in favor of), "Against", or "Neutral" on the campaign topic.

- The campaign topic is: **{{{campaignTopic}}}**
- The email content is below.

Email Content:
\`\`\`
{{{emailContent}}}
\`\`\`

Analyze the email content and determine the author's stance.
- If they support or argue for the topic, set stance to "Pro".
- If they oppose or argue against the topic, set stance to "Against".
- If their stance is unclear, mixed, or they are just asking questions, set stance to "Neutral".
- Provide a brief, one-sentence justification for your decision. For example: "The author argues that the proposal will harm privacy." or "The author expresses clear support for the public health benefits."
`,
});

const analyzeEmailStanceFlow = ai.defineFlow(
  {
    name: 'analyzeEmailStanceFlow',
    inputSchema: AnalyzeEmailStanceInputSchema,
    outputSchema: AnalyzeEmailStanceOutputSchema,
  },
  async input => {
    const {output} = await analyzeEmailStancePrompt(input);
    return output!;
  }
);


//
// == SCORE DATA CONTRIBUTION FLOW ==
//

const ScoreDataContributionInputSchema = z.object({
  fnirsData: z
    .string()
    .describe(
      "The raw text content from the user's fNIRS data file."
    ),
   glucoseLevel: z.number().describe("The paired glucose reading in mg/dL."),
});
export type ScoreDataContributionInput = z.infer<typeof ScoreDataContributionInputSchema>;

const ScoreDataContributionOutputSchema = z.object({
    contributionScore: z.number().min(0).max(100).describe('A score from 0-100 representing the quality and consistency of the paired data. Higher scores are better.'),
    reward: z.number().min(0).describe('The amount of Intention Points awarded for this contribution.'),
    reason: z.string().describe('A brief, user-friendly explanation of the score, highlighting what was good or could be improved.'),
});
export type ScoreDataContributionOutput = z.infer<typeof ScoreDataContributionOutputSchema>;


export async function scoreDataContribution(input: ScoreDataContributionInput): Promise<ScoreDataContributionOutput> {
  return scoreDataContributionFlow(input);
}

const scoreDataContributionPrompt = ai.definePrompt({
  name: 'scoreDataContributionPrompt',
  input: {schema: ScoreDataContributionInputSchema},
  output: {schema: ScoreDataContributionOutputSchema},
  prompt: `You are a data scientist AI for the think2earn project. Your role is to analyze paired fNIRS and glucose data submissions to determine their value for training a predictive model.

You will receive raw fNIRS data (as text) and a glucose level. Your task is to provide a "contributionScore" from 0-100.

To make the score deterministic and logical, base it on the following fictional analysis:
1.  **fNIRS Data Quality (60 points):**
    *   **Length:** Award points for data length. (e.g., >500 lines = 20pts, 200-500 lines = 10pts, <200 lines = 5pts).
    *   **Signal Noise:** Check for extreme numerical outliers. If values seem very random or have huge jumps, reduce points. (Deduct up to 20 pts).
    *   **Formatting:** Check if the data seems well-structured (e.g., comma-separated values). If it's messy, deduct points. (Deduct up to 20 pts).
2.  **Data Plausibility (40 points):**
    *   **Glucose Range:** Award points for glucose levels in a healthy-to-moderately-high range (70-180 mg/dL). Give max points around 90-110. Give fewer points for values far outside this range, as they might be less common or erroneous. (Up to 20 pts).
    *   **Data-Glucose Correlation (Fictional):** Pretend to find a correlation. If fNIRS data shows low variability, it should correspond to a stable glucose level (e.g., 80-120). High fNIRS variability "correlates" better with higher or lower glucose levels. Score based on this fictional match. (Up to 20 pts).

**Calculation:**
- Calculate the score based on the criteria above. The final score must be an integer between 0 and 100.
- The reward is the score divided by 10, rounded down to the nearest integer. (e.g., score 85 -> reward 8, score 92 -> reward 9).
- Provide a brief, user-friendly "reason" explaining the score. Example: "Great submission! The fNIRS data was clean and showed strong correlation with the provided glucose level." or "Good data, but some noise was detected in the fNIRS signal. A cleaner signal next time could improve your score."

**User Input:**
fNIRS Data:
\`\`\`
{{{fnirsData}}}
\`\`\`
Glucose Level: {{{glucoseLevel}}} mg/dL
`,
});

const scoreDataContributionFlow = ai.defineFlow(
  {
    name: 'scoreDataContributionFlow',
    inputSchema: ScoreDataContributionInputSchema,
    outputSchema: ScoreDataContributionOutputSchema,
  },
  async input => {
    const {output} = await scoreDataContributionPrompt(input);
    return output!;
  }
);
