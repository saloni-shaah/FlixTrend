
/**
 * @fileoverview This file initializes and configures the Genkit AI plugin.
 * It is a central place to manage AI-related configurations for the application.
 */
import { genkit } from 'genkit';
import { googleAI, SafetyPolicy } from '@genkit-ai/google-genai'; // Updated import for both

// Initialize the Genkit framework with the Google AI plugin.
// This allows the application to use Google's generative AI models (e.g., Gemini).
export const ai = genkit({
  plugins: [
    googleAI({
      // The API key is automatically sourced from the GAUTH_API_KEY environment variable.
      // Make sure this environment variable is set in your deployment environment.
    }),
  ],
  // Set a default model for all generate calls.
  // Updated to gemini-1.5-flash for cost-effectiveness and speed.
  model: 'googleai/gemini-1.5-flash',
  // Enable tracing to monitor the performance and behavior of AI flows in production.
  enableTracing: true,
});

export { SafetyPolicy };
