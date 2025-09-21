
'use server';

/**
 * @fileOverview An AI chatbot flow that impersonates Almighty.
 *
 * - chatWithAlmighty - A function that handles the conversation with the Almighty impersonator.
 * - ChatWithAlmightyInput - The input type for the chatWithAlmighty function.
 * - ChatWithAlmightyOutput - The return type for the chatWithAlmighty function.
 */

import {ai} from '../genkit';
import {z} from 'genkit';

const ChatWithAlmightyInputSchema = z.object({
  userName: z.string().describe('The name of the user who is chatting.'),
  message: z.string().describe('The user message to be sent to the chatbot.'),
  context: z.string().describe('The context of the conversation.'),
  file: z
    .object({
      dataUrl: z
        .string()
        .describe(
          "A file as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
        ),
      name: z.string().describe('The name of the file.'),
    })
    .optional()
    .describe('An optional file attached by the user.'),
});
export type ChatWithAlmightyInput = z.infer<typeof ChatWithAlmightyInputSchema>;

const ChatWithAlmightyOutputSchema = z.object({
  response: z.string().describe('The chatbot response to the user message.'),
  updatedContext: z.string().describe('The updated conversation context.'),
});
export type ChatWithAlmightyOutput = z.infer<typeof ChatWithAlmightyOutputSchema>;

export async function chatWithAlmighty(
  input: ChatWithAlmightyInput
): Promise<ChatWithAlmightyOutput> {
  return chatWithAlmightyFlow(input);
}

const prompt = ai.definePrompt({
  name: 'chatWithAlmightyPrompt',
  input: {schema: ChatWithAlmightyInputSchema},
  output: {schema: z.object({ response: z.string() })},
  prompt: `You are Almighty, an AI assistant with a Gen-Z/Gen-Alpha personality. You're witty, a bit informal, and use modern slang. Your goal is to be helpful but also feel like a cool, knowledgeable friend. Your name is Almighty.

You are integrated into a social media app called FlixTrend. The user you are talking to is named {{{userName}}}. Use their name to make the conversation more personal.

Based on the conversation context, respond to the user's message. Keep it concise, fun, and on-brand.

{{#if file}}
The user attached a file named {{{file.name}}}. Analyze it and weave it into your response.
File: {{media url=file.dataUrl}}
{{/if}}

Context:
{{{context}}}

User Message: {{{message}}}

Your Response (as Almighty):`,
});

const chatWithAlmightyFlow = ai.defineFlow(
  {
    name: 'chatWithAlmightyFlow',
    inputSchema: ChatWithAlmightyInputSchema,
    outputSchema: ChatWithAlmightyOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    const newContext = `${input.context}\nUser: ${input.message}\nAlmighty: ${
      output!.response
    }`;

    return {
      response: output!.response,
      updatedContext: newContext,
    };
  }
);
