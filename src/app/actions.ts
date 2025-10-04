
"use server";
import { ai } from '@/ai/ai';
import { z } from 'genkit';
import { contentModerationFlow } from "@/ai/flows/content-moderation-flow";
import { searchDuckDuckGo } from "@/ai/flows/search-flow";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { app } from '@/utils/firebaseClient'; // Import app for storage initialization

const AlmightyResponseInputSchema = z.object({
    userName: z.string().describe("The name of the user who is interacting with the AI."),
    message: z.string().describe("The user's current message."),
    context: z.string().optional().describe("The recent history of the conversation, for context."),
});

const AlmightyResponseOutputSchema = z.object({
    response: z.string().describe("The AI's response to the user's message, crafted in a friendly, Gen-Z style. Use emojis where appropriate. Keep it concise."),
});

const searchTool = ai.defineTool(
  {
    name: 'webSearch',
    description: 'Use this to search the web for real-time information, current events, or topics you are not an expert on.',
    inputSchema: z.object({ query: z.string() }),
    outputSchema: z.string(),
  },
  async (input) => searchDuckDuckGo(input.query)
);


const almightyPrompt = ai.definePrompt({
    name: 'almightyPrompt',
    input: { schema: AlmightyResponseInputSchema },
    output: { schema: AlmightyResponseOutputSchema },
    prompt: `You are Almighty, a witty, friendly, and slightly quirky AI companion for the Gen-Z social media app FlixTrend. Your personality is a mix of helpful, funny, and knowledgeable. You use modern slang and emojis naturally. Your name is Almighty.

Your primary goal is to have an engaging and helpful conversation.
- If a user greets you (hi, hello, etc.) or asks your name, respond naturally and conversationally.
- If a user asks for information you don't have, use the webSearch tool to find it.
- Your knowledge is up to 2023. For anything more recent, you MUST use the webSearch tool.
- Be ethical. Do not generate harmful, abusive, or explicit content. Politely decline any such requests.

User's Name: {{{userName}}}

Conversation History (for context):
{{{context}}}

User's latest message:
"{{{message}}}"
`,
    tools: [searchTool],
});

export async function getAlmightyResponse(input: z.infer<typeof AlmightyResponseInputSchema>): Promise<{ success: z.infer<typeof AlmightyResponseOutputSchema> | null, failure: string | null }> {
    try {
        const { output } = await almightyPrompt(input);
        
        if (!output?.response) {
          console.error("AI response was null or empty.", output);
          return { success: null, failure: "The AI returned an empty response. It might be feeling a bit shy!" };
        }
        
        return { success: output, failure: null };

    } catch (err: any) {
        console.error("Almighty AI action error:", err);
        return { success: null, failure: err.message || "An unknown error occurred while talking to the AI." };
    }
}


const RemixImageInputSchema = z.object({
  photoUrl: z.string().url().describe(
      "A public URL of a photo, accessible by the server."
  ),
  prompt: z.string().describe(
      'A text prompt describing the desired style transformation (e.g., "turn this into an anime character").'
  ),
});

const ImageOutputSchema = z.object({
  imageUrl: z.string().url().describe('The public URL of the generated or remixed image.'),
});

// This is a server-side helper now, not exported to client.
async function uploadBufferToFirebaseStorage(buffer: Buffer, contentType: string, fileName: string) {
    const storage = getStorage(app);
    const storageRef = ref(storage, `ai_generated/${fileName}`);
    const snapshot = await uploadBytes(storageRef, buffer, { contentType });
    return await getDownloadURL(snapshot.ref);
}

export async function remixImageAction(input: z.infer<typeof RemixImageInputSchema>): Promise<{success: z.infer<typeof ImageOutputSchema> | null, failure: string | null}> {
    try {
        const { media } = await ai.generate({
            model: 'googleai/gemini-1.5-flash-latest', // Correct model for image-to-image
            prompt: [{ media: { url: input.photoUrl } }, { text: input.prompt }],
            config: {
                responseModalities: ['IMAGE'],
            },
        });

        if (!media?.url) {
            throw new Error('Image generation failed to produce an image.');
        }

        const base64Data = media.url.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');
        const fileName = `remixed-${Date.now()}.png`;

        const finalUrl = await uploadBufferToFirebaseStorage(buffer, 'image/png', fileName);
        
        return { success: { imageUrl: finalUrl }, failure: null };

    } catch(err: any) {
        console.error("Remix image action error:", err);
        return { success: null, failure: err.message || 'An unknown error occurred during image remixing.' };
    }
}

const GenerateImageInputSchema = z.object({
  prompt: z.string().describe('A text prompt describing the desired image.'),
});

export async function generateImageAction(input: z.infer<typeof GenerateImageInputSchema>): Promise<{ success: z.infer<typeof ImageOutputSchema> | null; failure: string | null }> {
    try {
        const { media } = await ai.generate({
            model: 'googleai/imagen-4.0-fast-generate-001', // Correct text-to-image model
            prompt: `Generate an image of: ${input.prompt}`,
        });

        if (!media?.url) {
            throw new Error('Image generation failed to produce an image.');
        }

        const base64Data = media.url.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');
        const fileName = `generated-${Date.now()}.png`;

        const finalUrl = await uploadBufferToFirebaseStorage(buffer, 'image/png', fileName);

        return { success: { imageUrl: finalUrl }, failure: null };
    } catch (err: any) {
        console.error("Generate image action error:", err);
        return { success: null, failure: err.message || 'An unknown error occurred during image generation.' };
    }
}

const ModerationInputSchema = z.object({
  text: z.string().optional(),
  media: z.array(z.object({ url: z.string() })).optional(),
});

export async function runContentModerationAction(input: z.infer<typeof ModerationInputSchema>) {
    try {
        const result = await contentModerationFlow(input);
        return { success: result, failure: null };
    } catch (error: any) {
        console.error("Content moderation action error:", error);
        return { success: null, failure: error.message || "An unknown error occurred during moderation." };
    }
}

    