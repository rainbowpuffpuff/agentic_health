import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Initialize Genkit and the AI model
export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.0-flash',
});
