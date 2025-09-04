'use server';

/**
 * @fileOverview An AI agent that generates a list of trending topics for the social media platform.
 *
 * - generateTrendingTopics - A function that generates a list of trending topics.
 * - TrendingTopicsInput - The input type for the generateTrendingTopics function.
 * - TrendingTopicsOutput - The return type for the generateTrendingTopics function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TrendingTopicsInputSchema = z.object({
  platformDescription: z
    .string()
    .describe('A description of the social media platform.'),
  userInterests: z
    .string()
    .describe('A comma-separated list of the user interests.'),
});
export type TrendingTopicsInput = z.infer<typeof TrendingTopicsInputSchema>;

const TrendingTopicsOutputSchema = z.object({
  topics: z
    .array(z.string())
    .describe('A list of trending topics relevant to the user.'),
});
export type TrendingTopicsOutput = z.infer<typeof TrendingTopicsOutputSchema>;

export async function generateTrendingTopics(
  input: TrendingTopicsInput
): Promise<TrendingTopicsOutput> {
  return trendingTopicsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'trendingTopicsPrompt',
  input: {schema: TrendingTopicsInputSchema},
  output: {schema: TrendingTopicsOutputSchema},
  prompt: `You are a social media expert. You are tasked with generating a list of trending topics for a user on the platform.

The platform is described as: {{{platformDescription}}}

The user is interested in: {{{userInterests}}}

Generate a list of trending topics that would be relevant to this user. The topics should be short and concise.

Output the topics as a JSON array of strings.`,
});

const trendingTopicsFlow = ai.defineFlow(
  {
    name: 'trendingTopicsFlow',
    inputSchema: TrendingTopicsInputSchema,
    outputSchema: TrendingTopicsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
