'use server';

/**
 * @fileOverview Generates smart reply suggestions for a given message.
 *
 * - generateSmartReplies - A function that generates smart reply suggestions.
 * - SmartReplyInput - The input type for the generateSmartReplies function.
 * - SmartReplyOutput - The return type for the generateSmartReplies function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SmartReplyInputSchema = z.object({
  message: z.string().describe('The message to generate smart replies for.'),
});
export type SmartReplyInput = z.infer<typeof SmartReplyInputSchema>;

const SmartReplyOutputSchema = z.object({
  suggestions: z.array(z.string()).describe('An array of smart reply suggestions.'),
});
export type SmartReplyOutput = z.infer<typeof SmartReplyOutputSchema>;

export async function generateSmartReplies(input: SmartReplyInput): Promise<SmartReplyOutput> {
  return smartReplyFlow(input);
}

const prompt = ai.definePrompt({
  name: 'smartReplyPrompt',
  input: {schema: SmartReplyInputSchema},
  output: {schema: SmartReplyOutputSchema},
  prompt: `You are a helpful assistant that suggests smart replies for messages.

  Generate three short reply suggestions for the following message:

  {{message}}

  Format the reply suggestions as a JSON array of strings.
  `,
});

const smartReplyFlow = ai.defineFlow(
  {
    name: 'smartReplyFlow',
    inputSchema: SmartReplyInputSchema,
    outputSchema: SmartReplyOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
