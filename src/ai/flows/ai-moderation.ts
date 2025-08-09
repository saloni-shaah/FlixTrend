'use server';

/**
 * @fileOverview AI moderation badge flow for content safety assessment.
 *
 * - aiModerationCheck - Checks content for safety and appropriateness.
 * - AIModerationCheckInput - The input type for the aiModerationCheck function.
 * - AIModerationCheckOutput - The return type for the aiModerationCheck function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AIModerationCheckInputSchema = z.object({
  content: z.string().describe('The content to be checked for safety.'),
});

export type AIModerationCheckInput = z.infer<typeof AIModerationCheckInputSchema>;

const AIModerationCheckOutputSchema = z.object({
  isSafe: z.boolean().describe('Whether the content is deemed safe.'),
  reason: z.string().describe('The reason for the safety assessment.'),
});

export type AIModerationCheckOutput = z.infer<typeof AIModerationCheckOutputSchema>;

export async function aiModerationCheck(input: AIModerationCheckInput): Promise<AIModerationCheckOutput> {
  return aiModerationCheckFlow(input);
}

const aiModerationCheckPrompt = ai.definePrompt({
  name: 'aiModerationCheckPrompt',
  input: {schema: AIModerationCheckInputSchema},
  output: {schema: AIModerationCheckOutputSchema},
  prompt: `You are an AI moderation tool that checks content for safety and appropriateness.

  Assess the following content and determine if it is safe. Provide a reason for your assessment.

  Content: {{{content}}}

  Respond in a JSON format.
`,
});

const aiModerationCheckFlow = ai.defineFlow(
  {
    name: 'aiModerationCheckFlow',
    inputSchema: AIModerationCheckInputSchema,
    outputSchema: AIModerationCheckOutputSchema,
  },
  async input => {
    const {output} = await aiModerationCheckPrompt(input);
    return output!;
  }
);
