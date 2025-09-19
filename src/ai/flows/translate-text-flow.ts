'use server';
/**
 * @fileOverview A Genkit flow for translating text into a specified language.
 *
 * - translateText: The main function to call the flow.
 */

import {ai} from '@/ai/ai';
import {
  TranslateTextInput,
  TranslateTextInputSchema,
  TranslateTextOutputSchema,
} from '@/ai/schemas/translate-text-schema';

const prompt = ai.definePrompt({
  name: 'translateTextPrompt',
  input: {schema: TranslateTextInputSchema},
  output: {schema: TranslateTextOutputSchema},
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
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

export async function translateText(input: TranslateTextInput): Promise<string> {
  const result = await translateTextFlow(input);
  return result.translatedText;
}
