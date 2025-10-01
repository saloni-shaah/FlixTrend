'use server';
import {z} from 'zod';

/**
 * @fileoverview Defines the Zod schemas for the image remixing flow.
 * These schemas validate the input and output of the AI model.
 */

export const RemixImageInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "The source image to be remixed, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  prompt: z
    .string()
    .describe(
      'A text prompt describing the desired style transformation (e.g., "turn this into an anime character", "make this look like a vintage photo").'
    ),
});

export const RemixImageOutputSchema = z.object({
  remixedPhotoDataUri: z
    .string()
    .describe('The newly generated, remixed image as a data URI.'),
});

export type RemixImageInput = z.infer<typeof RemixImageInputSchema>;
export type RemixImageOutput = z.infer<typeof RemixImageOutputSchema>;
