'use server';
/**
 * @fileOverview An AI flow to moderate content for safety and quality.
 *
 * - moderateContent: The main function to call the flow.
 */

import {ai} from '@/ai/ai';
import {z} from 'zod';

const ContentModerationInputSchema = z.object({
  text: z.string().optional().describe('The text content of the post (caption, title, etc.).'),
  thumbnailDataUri: z.string().optional().describe("The post's thumbnail image as a data URI."),
});

const ContentModerationOutputSchema = z.object({
    verdict: z.enum(['safe', 'unsafe']).describe("The final verdict. 'safe' if the content is okay, 'unsafe' if it violates any policy."),
    reason: z.string().describe("A brief, user-friendly explanation if the verdict is 'unsafe'."),
});

const prompt = ai.definePrompt({
  name: 'contentModerationPrompt',
  input: {schema: ContentModerationInputSchema},
  output: {schema: ContentModerationOutputSchema},
  prompt: `You are an expert content moderator for a Gen-Z social media app called FlixTrend. Your job is to review user-submitted content to ensure it's safe, appropriate, and high-quality.

Review the following content based on these policies:
1.  **Harmful Content**: Absolutely no hate speech, violence, harassment, bullying, or explicit sexual content.
2.  **Spam/Low-Quality**: The content must have some substance. Flag posts that are nonsensical, gibberish, or clearly low-effort spam.
3.  **Relevance**: If an image is provided, it must be relevant to the text. Do not allow misleading thumbnails.

Here is the content to review:
Text: "{{{text}}}"
{{#if thumbnailDataUri}}
Thumbnail Image: {{media url=thumbnailDataUri}}
{{/if}}

Your task:
- If the content violates any of the above policies, set the 'verdict' to 'unsafe' and provide a short, clear 'reason' for the user (e.g., "This content may violate our policy on hate speech.", "The thumbnail appears to be unrelated to the text.").
- If the content is safe and appropriate, set the 'verdict' to 'safe' and the 'reason' to "Content looks good!".`,
});

const contentModerationFlow = ai.defineFlow(
  {
    name: 'contentModerationFlow',
    inputSchema: ContentModerationInputSchema,
    outputSchema: ContentModerationOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);

export async function moderateContent(input: z.infer<typeof ContentModerationInputSchema>): Promise<z.infer<typeof ContentModerationOutputSchema>> {
  return await contentModerationFlow(input);
}
