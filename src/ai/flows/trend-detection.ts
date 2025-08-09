// Trend Detection Flow
'use server';
/**
 * @fileOverview An AI agent for detecting trending content.
 *
 * - detectTrendingContent - A function that identifies trending content based on user interactions and channel subscriptions.
 * - DetectTrendingContentInput - The input type for the detectTrendingContent function.
 * - DetectTrendingContentOutput - The return type for the detectTrendingContent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DetectTrendingContentInputSchema = z.object({
  userInteractions: z.array(
    z.object({
      contentId: z.string().describe('The ID of the content interacted with.'),
      interactionType: z
        .string()        
        .describe(
          'The type of interaction (e.g., boost, drop, relay, like, comment).'
        ),
      timestamp: z.number().describe('The timestamp of the interaction.'),
    })
  ).describe('A list of user interactions with content.'),
  channelSubscriptions: z
    .array(z.string())
    .describe('A list of IDs of channels the user is subscribed to.'),
});
export type DetectTrendingContentInput = z.infer<typeof DetectTrendingContentInputSchema>;

const DetectTrendingContentOutputSchema = z.object({
  trendingContent: z.array(
    z.object({
      contentId: z.string().describe('The ID of the trending content.'),
      trendScore: z.number().describe('A score indicating the trendiness of the content.'),
      reason: z.string().describe('The reason why the content is trending.'),
    })
  ).describe('A list of trending content with trend scores and reasons.'),
});
export type DetectTrendingContentOutput = z.infer<typeof DetectTrendingContentOutputSchema>;

export async function detectTrendingContent(input: DetectTrendingContentInput): Promise<DetectTrendingContentOutput> {
  return detectTrendingContentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'detectTrendingContentPrompt',
  input: {schema: DetectTrendingContentInputSchema},
  output: {schema: DetectTrendingContentOutputSchema},
  prompt: `You are an AI-powered trend analyst. Your task is to identify trending content based on user interactions and channel subscriptions.

Analyze the following user interactions:
{{#each userInteractions}}
- Content ID: {{contentId}}, Interaction: {{interactionType}}, Timestamp: {{timestamp}}
{{/each}}

Consider the following channel subscriptions:
{{#each channelSubscriptions}}
- {{this}}
{{/each}}

Identify the content that is currently trending, providing a trend score and a brief explanation for each trending item. Consider recency, frequency, and the overall engagement level.

Output the trending content in the following format:
Trending Content: [{
  contentId: string,
  trendScore: number,
  reason: string
}]`,
});

const detectTrendingContentFlow = ai.defineFlow(
  {
    name: 'detectTrendingContentFlow',
    inputSchema: DetectTrendingContentInputSchema,
    outputSchema: DetectTrendingContentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
