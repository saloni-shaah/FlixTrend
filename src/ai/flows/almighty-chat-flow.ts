
'use server';
/**
 * @fileOverview The core Genkit flow for the Almighty AI chatbot.
 * This file defines the AI's personalities and handles the chat logic.
 */

import { ai } from '@/ai/ai';
import { z } from 'zod';
import { Message } from 'genkit';

// Define the different "personalities" or modes for the AI
const SYSTEM_PROMPTS = {
  'vibe-check': `You are 'Vibe Check,' a social guru for a Gen-Z audience on the app FlixTrend. Be witty, slightly sarcastic, and use modern slang and emojis. Give advice on social situations, roast user's friends (gently!), or suggest trendy photo ideas. Keep responses short and punchy.`,
  'brainwave': `You are 'Brainwave,' a super-smart study buddy. Explain complex topics (like quantum physics or Shakespeare) in simple, easy-to-understand terms. Use analogies, bullet points, and be encouraging. You can help with homework, summarize articles, and explain concepts.`,
  'creator': `You are 'Creator,' an energetic idea machine and creative partner. Help users brainstorm ideas for startups, YouTube channels, creative projects, or content plans. Be enthusiastic, ask clarifying questions, and provide structured, actionable advice.`,
  'zenith': `You are 'Zenith,' a calm and mindful wellness coach. Provide short, guided breathing exercises, offer daily affirmations, and give simple advice for managing stress. Your tone is gentle, supportive, and peaceful. Use calming emojis like 🧘, ✨, or 🌱.`,
  'epoch': `You are 'Epoch,' a knowledgeable historian and news buff with a slightly quirky personality. You can fact-check claims, provide historical context on current events, or share fascinating "on this day in history" facts. You have web search capabilities and should cite sources when possible.`,
};

const AlmightyChatInputSchema = z.object({
  personality: z.string().describe('The AI personality to use.'),
  history: z.array(z.custom<Message>()).describe("The chat history."),
  prompt: z.string().describe('The user\'s latest message.'),
});

const prompt = ai.definePrompt({
  name: 'almightyChatPrompt',
  input: {
    schema: z.object({
      systemPrompt: z.string(),
      history: z.array(z.custom<Message>()),
      prompt: z.string(),
    }),
  },
  output: { format: 'text' },
  system: `{{systemPrompt}}`,
  messages: [
      "{{#each history}}{{role}}: {{content}}\n{{/each}}",
      "user: {{prompt}}"
  ],
  config: {
    temperature: 0.8,
  },
});

const almightyChatFlow = ai.defineFlow(
  {
    name: 'almightyChatFlow',
    inputSchema: AlmightyChatInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    const systemPrompt = SYSTEM_PROMPTS[input.personality as keyof typeof SYSTEM_PROMPTS] || SYSTEM_PROMPTS['vibe-check'];
    
    const { output } = await ai.generate({
        model: 'googleai/gemini-pro',
        prompt: {
            system: systemPrompt,
            messages: [
                ...input.history.map(m => ({ role: m.role, content: [{ text: m.content[0].text! }] })),
                { role: 'user', content: [{ text: input.prompt }] }
            ],
        },
        config: {
            temperature: 0.8,
        },
    });

    return output!;
  }
);

// Wrapper function for client-side calling
export async function almightyChat(input: z.infer<typeof AlmightyChatInputSchema>): Promise<string> {
  return await almightyChatFlow(input);
}
