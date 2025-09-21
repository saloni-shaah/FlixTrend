import { z } from 'genkit';

/**
 * @fileOverview Zod schemas for the image remixing AI flow.
 */

export const RemixImageInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a person or scene, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  prompt: z
    .string()
    .describe(
      'A text prompt describing the desired style transformation (e.g., "turn this into an anime character", "make this look like a vintage film still").'
    ),
});
export type RemixImageInput = z.infer<typeof RemixImageInputSchema>;

export const RemixImageOutputSchema = z.object({
  remixedPhotoDataUri: z.string().describe('The remixed image as a data URI.'),
});
export type RemixImageOutput = z.infer<typeof RemixImageOutputSchema>;
