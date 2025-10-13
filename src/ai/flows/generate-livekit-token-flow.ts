
'use server';
/**
 * @fileOverview A Genkit flow for generating LiveKit access tokens.
 *
 * This file exports a function `generateLivekitToken` that creates a secure
 * token for a user to join a LiveKit room, either as a streamer or a viewer.
 */

import { AccessToken } from 'livekit-server-sdk';
import { z } from 'zod';
import { ai } from '@/ai/genkit';

const LivekitTokenInputSchema = z.object({
  roomName: z.string().describe('The name of the room the user is joining.'),
  identity: z.string().describe('The unique identifier for the user.'),
  name: z.string().describe('The display name of the user.'),
  isStreamer: z.boolean().describe('Whether the user is a streamer or a viewer.'),
});

const LivekitTokenOutputSchema = z.object({
  token: z.string().optional().describe('The generated LiveKit access token.'),
  error: z.string().optional().describe('An error message if token generation fails.'),
});

export type LivekitTokenInput = z.infer<typeof LivekitTokenInputSchema>;
export type LivekitTokenOutput = z.infer<typeof LivekitTokenOutputSchema>;

/**
 * Defines the Genkit flow for generating a LiveKit token.
 */
const generateLivekitTokenFlow = ai.defineFlow(
  {
    name: 'generateLivekitTokenFlow',
    inputSchema: LivekitTokenInputSchema,
    outputSchema: LivekitTokenOutputSchema,
  },
  async (input) => {
    const { roomName, identity, name, isStreamer } = input;

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!apiKey || !apiSecret) {
      console.error('LiveKit API key or secret is not set in environment variables.');
      return { error: 'Server configuration error for live streaming.' };
    }

    try {
      const at = new AccessToken(apiKey, apiSecret, {
        identity: identity,
        name: name,
      });

      at.addGrant({
        room: roomName,
        roomJoin: true,
        canPublish: isStreamer,
        canSubscribe: true,
      });

      const token = await at.toJwt();
      return { token };
    } catch (e: any) {
      console.error('Error generating LiveKit token:', e);
      return { error: e.message };
    }
  }
);

/**
 * Wraps and exports the Genkit flow for client-side use.
 * @param input - The data required to generate the token.
 * @returns An object containing the token or an error message.
 */
export async function generateLivekitToken(input: LivekitTokenInput): Promise<LivekitTokenOutput> {
  return generateLivekitTokenFlow(input);
}
