
'use server';
/**
 * @fileOverview A Genkit flow for generating LiveKit access tokens.
 *
 * - generateLivekitToken - A function that creates a LiveKit token for a user.
 * - GenerateLivekitTokenInput - The input type for the generateLivekitToken function.
 * - GenerateLivekitTokenOutput - The return type for the generateLivekitToken function.
 */
import { ai } from '@/ai/genkit';
import { AccessToken } from 'livekit-server-sdk';
import { z } from 'genkit';

const GenerateLivekitTokenInputSchema = z.object({
  roomName: z.string().describe('The name of the room to join.'),
  identity: z.string().describe('The unique identity of the user.'),
  name: z.string().describe('The display name of the user.'),
  isStreamer: z.boolean().describe('Whether the user is a streamer or a viewer.'),
});
export type GenerateLivekitTokenInput = z.infer<typeof GenerateLivekitTokenInputSchema>;

const GenerateLivekitTokenOutputSchema = z.object({
  token: z.string().describe('The generated LiveKit access token.'),
});
export type GenerateLivekitTokenOutput = z.infer<typeof GenerateLivekitTokenOutputSchema>;

export async function generateLivekitToken(
  input: GenerateLivekitTokenInput
): Promise<GenerateLivekitTokenOutput> {
  return generateLivekitTokenFlow(input);
}

const generateLivekitTokenFlow = ai.defineFlow(
  {
    name: 'generateLivekitTokenFlow',
    inputSchema: GenerateLivekitTokenInputSchema,
    outputSchema: GenerateLivekitTokenOutputSchema,
  },
  async (input) => {
    const { roomName, identity, name, isStreamer } = input;

    if (!process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET) {
      throw new Error('LiveKit server API key or secret not configured.');
    }

    const at = new AccessToken(
      process.env.LIVEKIT_API_KEY,
      process.env.LIVEKIT_API_SECRET,
      {
        identity: identity,
        name: name,
      }
    );

    at.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: isStreamer,
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await at.toJwt();
    return { token };
  }
);
