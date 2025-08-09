// Image Creation Genkit Flow

'use server';

/**
 * @fileOverview Image Creation flow for the Almighty AI Panel.
 *
 * - createImage - A function that handles the image creation process.
 * - CreateImageInput - The input type for the createImage function.
 * - CreateImageOutput - The return type for the createImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CreateImageInputSchema = z.object({
  prompt: z.string().describe('The prompt for generating the image.'),
});
export type CreateImageInput = z.infer<typeof CreateImageInputSchema>;

const CreateImageOutputSchema = z.object({
  imageUrl: z.string().describe('The data URI of the generated image.'),
});
export type CreateImageOutput = z.infer<typeof CreateImageOutputSchema>;

export async function createImage(input: CreateImageInput): Promise<CreateImageOutput> {
  return createImageFlow(input);
}

const createImageFlow = ai.defineFlow(
  {
    name: 'createImageFlow',
    inputSchema: CreateImageInputSchema,
    outputSchema: CreateImageOutputSchema,
  },
  async input => {
    const {media} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: input.prompt,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!media?.url) {
      throw new Error('Failed to generate image.');
    }

    return {imageUrl: media.url};
  }
);
