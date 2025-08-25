'use server';
/**
 * @fileOverview An AI agent to score data contributions.
 *
 * - scoreDataContribution - A function that handles the data scoring.
 * - ScoreDataContributionInput - The input type for the function.
 * - ScoreDataContributionOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

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

const prompt = ai.definePrompt({
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
    const {output} = await prompt(input);
    return output!;
  }
);
