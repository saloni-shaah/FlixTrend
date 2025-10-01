'use server';
/**
 * @fileOverview An AI flow to analyze content and assign it to a precise category.
 */

import { ai } from '@/ai/ai';
import { z } from 'zod';
import { contentCategories } from '../content-categories';

const CategorizeContentInputSchema = z.object({
  text: z.string().optional().describe('The text content of the post (caption, title, etc.).'),
  media: z.array(z.object({ url: z.string() })).optional().describe("An array of media items (images) as data URIs."),
});

const CategorizeContentOutputSchema = z.object({
  category: z.string().describe('The single most accurate category from the provided list.'),
  confidence: z.number().min(0).max(1).describe('The confidence score (0.0 to 1.0) for the chosen category.'),
  reasoning: z.string().describe('A brief explanation for why the content fits the chosen category.'),
});

const prompt = ai.definePrompt({
    name: 'categorizeContentPrompt',
    input: { schema: CategorizeContentInputSchema },
    output: { schema: CategorizeContentOutputSchema },
    prompt: `You are an expert content analyst for a social media app. Your task is to categorize a post into the single MOST relevant category from the list provided below.

Analyze the provided text and/or media content carefully.

**Your Task:**
1.  **Analyze:** Review the user's post content (text and/or image).
2.  **Categorize:** Choose the single best-fitting category from the list of categories. Be very specific. For example, instead of just "Food", choose "Food & Drink > Cooking & Recipes > Desserts & Baking".
3.  **Confidence:** Provide a confidence score from 0.0 (not sure at all) to 1.0 (completely certain).
4.  **Reasoning:** Briefly explain your choice.

**Content to Analyze:**
{{#if text}}
**Text:** {{{text}}}
{{/if}}
{{#if media}}
**Media:**
{{#each media}}
{{media url=this.url}}
{{/each}}
{{/if}}

**Category List (choose ONE):**
${contentCategories.join('\n')}
`,
});

const categorizeContentFlow = ai.defineFlow(
  {
    name: 'categorizeContentFlow',
    inputSchema: CategorizeContentInputSchema,
    outputSchema: CategorizeContentOutputSchema,
  },
  async (input) => {
    if (!input.text && (!input.media || input.media.length === 0)) {
        return {
            category: 'General',
            confidence: 0.5,
            reasoning: 'No content provided to analyze.',
        };
    }
    const { output } = await prompt(input);
    return output!;
  }
);

// Wrapper function for client-side calling
export async function categorizeContent(input: z.infer<typeof CategorizeContentInputSchema>): Promise<z.infer<typeof CategorizeContentOutputSchema>> {
  return await categorizeContentFlow(input);
}
