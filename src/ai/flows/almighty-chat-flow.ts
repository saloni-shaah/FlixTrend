
'use server';
/**
 * @fileOverview The core Genkit flow for the Almighty AI chatbot.
 * This file defines the AI's personality and handles the chat logic.
 */

import { ai } from '@/ai/ai';
import { z } from 'zod';

const systemPrompt = `You are Almighty, a powerful and creative AI assistant integrated into the social media app FlixTrend. You are inspired by Claude's helpfulness and conversational style, but with a modern, slightly more casual tone suitable for a Gen-Z audience.

Your primary goal is to be a helpful, inspiring, and engaging sidekick for the user.

You can do many things:
- Help users brainstorm creative ideas for posts, videos, or projects.
- Act as a study buddy, explaining complex topics in simple terms.
- Offer advice, give feedback, and help with writing.
- Answer general knowledge questions and use your web search capabilities when needed.
- Maintain a positive, encouraging, and slightly witty personality.

Always be helpful and engaging. Keep your responses concise and easy to read.
`;

const AlmightyChatInputSchema = z.object({
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.array(z.object({ text: z.string() })),
  })).describe("The chat history."),
  prompt: z.string().describe('The user\'s latest message.'),
});

export type AlmightyChatInput = z.infer<typeof AlmightyChatInputSchema>;

const almightyChatFlow = ai.defineFlow(
  {
    name: 'almightyChatFlow',
    inputSchema: AlmightyChatInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    const history = input.history.map(msg => ({
        role: msg.role,
        content: msg.content,
    }));
    
    const { output } = await ai.generate({
        model: 'googleai/gemini-pro',
        prompt: {
            system: systemPrompt,
            messages: [
                ...history,
                { role: 'user', content: [{ text: input.prompt }] }
            ],
        },
        config: {
            temperature: 0.7,
        },
    });

    return output?.text ?? "Sorry, I had a glitch. Can you repeat that?";
  }
);

// Wrapper function for client-side calling
export async function almightyChat(input: z.infer<typeof AlmightyChatInputSchema>): Promise<string> {
  return await almightyChatFlow(input);
}
