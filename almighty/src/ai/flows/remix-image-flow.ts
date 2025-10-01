'use server';

/**
 * @fileOverview A Genkit flow for remixing an image based on a text prompt.
 *
 * - remixImageFlow: The primary flow that calls the image generation model.
 * - remixImage: An exported wrapper function for client-side invocation.
 */

import {ai} from '@/ai/ai';
import {
  RemixImageInput,
  RemixImageInputSchema,
  RemixImageOutput,
  RemixImageOutputSchema,
} from '../schemas/remix-image-schema';

export const remixImageFlow = ai.defineFlow(
  {
    name: 'remixImageFlow',
    inputSchema: RemixImageInputSchema,
    outputSchema: RemixImageOutputSchema,
  },
  async (input) => {
    const {media} = await ai.generate({
      model: 'googleai/gemini-2.5-flash-image-preview',
      prompt: [{media: {url: input.photoDataUri}}, {text: input.prompt}],
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!media?.url) {
      throw new Error('Image generation failed to produce an image.');
    }

    return {remixedPhotoDataUri: media.url};
  }
);

export async function remixImage(
  input: RemixImageInput
): Promise<RemixImageOutput> {
  return await remixImageFlow(input);
}
