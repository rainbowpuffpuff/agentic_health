import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

if (process.env.GEMINI_API_KEY) {
  console.log(
    `[Genkit] Using GEMINI_API_KEY ending in "...${process.env.GEMINI_API_KEY.slice(
      -4
    )}"`
  );
} else {
  console.log(
    '[Genkit] WARNING: GEMINI_API_KEY environment variable not found.'
  );
}

export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.0-flash',
});
