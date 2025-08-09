// This file uses server-side code.
'use server';

/**
 * @fileOverview A content generation AI agent.
 *
 * - generateContent - A function that handles the content generation process.
 * - ContentGenerationInput - The input type for the generateContent function.
 * - ContentGenerationOutput - The return type for the generateContent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ContentGenerationInputSchema = z.object({
  prompt: z.string().describe('The prompt for generating content.'),
});
export type ContentGenerationInput = z.infer<typeof ContentGenerationInputSchema>;

const ContentGenerationOutputSchema = z.object({
  content: z.string().describe('The generated content.'),
});
export type ContentGenerationOutput = z.infer<typeof ContentGenerationOutputSchema>;

export async function generateContent(input: ContentGenerationInput): Promise<ContentGenerationOutput> {
  return contentGenerationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'contentGenerationPrompt',
  input: {schema: ContentGenerationInputSchema},
  output: {schema: ContentGenerationOutputSchema},
  prompt: `You are an AI content generator. Generate content based on the following prompt: {{{prompt}}}`,
});

const contentGenerationFlow = ai.defineFlow(
  {
    name: 'contentGenerationFlow',
    inputSchema: ContentGenerationInputSchema,
    outputSchema: ContentGenerationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
