'use server';
/**
 * @fileOverview A Genkit flow for generating LiveKit access tokens.
 *
 * - generateLivekitToken: The main function to call the flow.
 */

import { ai } from '../ai';
import { z } from 'genkit';
import { AccessToken } from 'livekit-server-sdk';

const GenerateLivekitTokenInputSchema = z.object({
  roomName: z.string().describe('The name of the room to join.'),
  identity: z.string().describe('The identity of the user joining the room.'),
  name: z.string().describe('The display name of the user.'),
  isStreamer: z.boolean().optional().default(false).describe('Whether the user is the streamer or just a viewer.'),
});
export type GenerateLivekitTokenInput = z.infer<typeof GenerateLivekitTokenInputSchema>;

const GenerateLivekitTokenOutputSchema = z.object({
  token: z.string().describe('The generated LiveKit access token.'),
});
export type GenerateLivekitTokenOutput = z.infer<typeof GenerateLivekitTokenOutputSchema>;

const generateLivekitTokenFlow = ai.defineFlow(
  {
    name: 'generateLivekitTokenFlow',
    inputSchema: GenerateLivekitTokenInputSchema,
    outputSchema: GenerateLivekitTokenOutputSchema,
  },
  async (input) => {
    const { roomName, identity, name, isStreamer } = input;

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_WS_URL;

    if (!apiKey || !apiSecret || !wsUrl) {
      throw new Error('LiveKit server environment variables are not configured.');
    }

    const at = new AccessToken(apiKey, apiSecret, {
      identity: identity,
      name: name,
    });
    
    // Define permissions
    at.addGrant({
        room: roomName,
        roomJoin: true,
        canPublish: isStreamer, // Only streamers can publish video/audio
        canSubscribe: true,      // Everyone can subscribe (watch/listen)
    });

    const token = await at.toJwt();
    
    return { token };
  }
);

// Wrapper function for client-side calling
export async function generateLivekitToken(input: GenerateLivekitTokenInput): Promise<GenerateLivekitTokenOutput> {
  return await generateLivekitTokenFlow(input);
}
