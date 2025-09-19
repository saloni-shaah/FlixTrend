'use server';
/**
 * @fileOverview A Genkit flow for translating text into a specified language.
 *
 * - translateText: The main function to call the flow.
 * - TranslateTextInputSchema: The Zod schema for the input.
 */

import {ai} from '@/ai/ai';
import {z} from 'zod';

export const TranslateTextInputSchema = z.object({
  text: z.string().describe('The text to be translated.'),
  targetLanguage: z.string().describe('The target language to translate the text into (e.g., "Hindi", "Arabic", "Spanish").'),
});

export type TranslateTextInput = z.infer<typeof TranslateTextInputSchema>;

const TranslateTextOutputSchema = z.object({
    translatedText: z.string().describe('The translated text.'),
});

const prompt = ai.definePrompt({
    name: 'translateTextPrompt',
    input: { schema: TranslateTextInputSchema },
    output: { schema: TranslateTextOutputSchema },
    prompt: `Translate the following text into {{targetLanguage}}.

Text:
{{{text}}}

Only return the translated text, with no additional commentary or explanations.`,
});


const translateTextFlow = ai.defineFlow(
  {
    name: 'translateTextFlow',
    inputSchema: TranslateTextInputSchema,
    outputSchema: TranslateTextOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);


export async function translateText(input: TranslateTextInput): Promise<string> {
    const result = await translateTextFlow(input);
    return result.translatedText;
}
