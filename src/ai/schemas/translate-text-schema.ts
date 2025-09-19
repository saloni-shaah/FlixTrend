import {z} from 'zod';

/**
 * @fileOverview Zod schemas for the text translation AI flow.
 */

export const TranslateTextInputSchema = z.object({
  text: z.string().describe('The text to be translated.'),
  targetLanguage: z
    .string()
    .describe(
      'The target language to translate the text into (e.g., "Hindi", "Arabic", "Spanish").'
    ),
});

export type TranslateTextInput = z.infer<typeof TranslateTextInputSchema>;

export const TranslateTextOutputSchema = z.object({
  translatedText: z.string().describe('The translated text.'),
});
