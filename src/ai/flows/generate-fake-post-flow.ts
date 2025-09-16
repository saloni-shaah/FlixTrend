
'use server';
/**
 * @fileOverview An AI flow to generate realistic but fake social media posts.
 * Used by the "Trend Chase" game to create distractors.
 *
 * - generateFakePost: The main function to call the flow.
 * - GenerateFakePostInput: The input type for the flow.
 * - GenerateFakePostOutput: The return type for the flow.
 */

import { ai } from '@/ai/ai';
import { z } from 'zod';

export const GenerateFakePostInputSchema = z.object({
  theme: z.string().describe('The theme or topic for the fake post, like "tech", "music", or "fashion".'),
});
export type GenerateFakePostInput = z.infer<typeof GenerateFakePostInputSchema>;

export const GenerateFakePostOutputSchema = z.object({
  username: z.string().describe("A plausible but fake username for a social media user (e.g., 'VibeMaster22', 'AstroKay'). Should not use real names."),
  content: z.string().describe('The text content of the fake social media post. Should be a short, engaging, and believable post related to the theme. Use Gen-Z style language and emojis.'),
});
export type GenerateFakePostOutput = z.infer<typeof GenerateFakePostOutputSchema>;


const prompt = ai.definePrompt({
  name: 'generateFakePostPrompt',
  input: { schema: GenerateFakePostInputSchema },
  output: { schema: GenerateFakePostOutputSchema },
  prompt: `You are an AI that creates realistic-sounding social media posts for a game. The app is called FlixTrend and is for a Gen-Z audience.

Generate a single, short, and believable social media post based on the given theme. The post should sound like something a real person would post. It should be casual, use modern slang, and include relevant emojis.

Also, generate a creative and fake username for the user who supposedly wrote this post.

Theme: {{{theme}}}`,
});

const generateFakePostFlow = ai.defineFlow(
  {
    name: 'generateFakePostFlow',
    inputSchema: GenerateFakePostInputSchema,
    outputSchema: GenerateFakePostOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);

// Wrapper function for client-side calling
export async function generateFakePost(input: GenerateFakePostInput): Promise<GenerateFakePostOutput> {
  return await generateFakePostFlow(input);
}
