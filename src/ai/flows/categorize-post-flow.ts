
'use server';
/**
 * @fileOverview An AI flow to categorize a social media post.
 */

import { ai } from '@/ai/ai';
import { z } from 'zod';

const postCategories = [
    "Music", "Fashion", "Comedy", "Tech", "Gaming", "Art", "Travel", "Food", 
    "Education", "Lifestyle", "Sports", "News", "DIY", "Science", "Movies", "Other"
] as const;

const CategorizePostInputSchema = z.string().describe('The text content of the social media post (caption, title, hashtags, etc.).');

const CategorizePostOutputSchema = z.enum(postCategories).describe("The single best category for the post.");

const prompt = ai.definePrompt({
  name: 'categorizePostPrompt',
  input: { schema: CategorizePostInputSchema },
  output: { schema: CategorizePostOutputSchema },
  prompt: `You are an expert content classifier. Analyze the following social media post content and assign it to the single most relevant category from the provided list.

Categories: ${postCategories.join(', ')}

Post Content:
"{{prompt}}"

Your only output should be a single category name from the list.`,
});

const categorizePostFlow = ai.defineFlow(
  {
    name: 'categorizePostFlow',
    inputSchema: CategorizePostInputSchema,
    outputSchema: CategorizePostOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);

// Wrapper function for client-side calling
export async function categorizePost(input: string): Promise<typeof postCategories[number]> {
  return await categorizePostFlow(input);
}
