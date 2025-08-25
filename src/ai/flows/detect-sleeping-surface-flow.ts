git rev-list --count HEAD'use server';
/**
 * @fileOverview An AI agent to detect sleeping surfaces in images.
 *
 * - detectSleepingSurface - A function that handles the image analysis.
 * - DetectSleepingSurfaceInput - The input type for the function.
 * - DetectSleepingSurfaceOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

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

const prompt = ai.definePrompt({
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
- If the image does not clearly show a sleeping surface (e.g., it's a picture of a desk, a pet, a selfie, or it's too dark/blurry), set isSleepingSurface to false and provide a gentle, user-friendly reason.
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
    const {output} = await prompt(input);
    return output!;
  }
);
