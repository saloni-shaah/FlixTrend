
'use server';

/**
 * @fileOverview An AI flow to remix an image with a specific style using Genkit.
 *
 * - remixImage - The main function to call the flow.
 */

import { ai } from '../genkit';
import {
  RemixImageInput,
  RemixImageInputSchema,
  RemixImageOutput,
  RemixImageOutputSchema,
} from '../schemas/remix-image-schema';

const remixImageFlow = ai.defineFlow(
  {
    name: 'remixImageFlow',
    inputSchema: RemixImageInputSchema,
    outputSchema: RemixImageOutputSchema,
  },
  async ({ photoDataUri, prompt }) => {
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.5-flash-image-preview',
      prompt: [{ media: { url: photoDataUri } }, { text: prompt }],
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!media?.url) {
      throw new Error('Image generation failed to produce an image.');
    }

    return { remixedPhotoDataUri: media.url };
  }
);

export async function remixImage(
  input: RemixImageInput
): Promise<RemixImageOutput> {
  return await remixImageFlow(input);
}
