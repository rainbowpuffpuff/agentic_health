'use server';
/**
 * @fileOverview An AI agent to analyze the stance of an email regarding a specific topic.
 *
 * - analyzeEmailStance - A function that handles the email analysis.
 * - AnalyzeEmailStanceInput - The input type for the function.
 * - AnalyzeEmailStanceOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

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

const prompt = ai.definePrompt({
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
    const {output} = await prompt(input);
    return output!;
  }
);
