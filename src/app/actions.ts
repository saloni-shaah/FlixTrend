
"use server";
import { ai } from '@/ai/ai';
import { z } from 'zod';
import { contentModerationFlow } from "@/ai/flows/content-moderation-flow";
import { searchDuckDuckGo } from "@/ai/flows/search-flow";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { app } from '@/utils/firebaseClient'; // Import app for storage initialization

const AlmightyResponseInputSchema = z.object({
    userName: z.string().describe("The name of the user who is interacting with the AI."),
    message: z.string().describe("The user's current message."),
    context: z.string().optional().describe("The recent history of the conversation, for context."),
    userId: z.string().describe("The UID of the user making the request."),
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
  async (input) => {
    // Usage check for search must be handled client-side before calling the parent action.
    return await searchDuckDuckGo(input.query);
  }
);


const almightyPrompt = ai.definePrompt({
    name: 'almightyPrompt',
    input: { schema: z.object({ userName: z.string(), message: z.string(), context: z.string().optional() }) },
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
        if (!input.message) {
            return { success: { response: "What's up?" }, failure: null };
        }
        
        const { output } = await almightyPrompt({
            userName: input.userName,
            message: input.message,
            context: input.context,
        });
        
        if (!output?.response) {
          return { success: null, failure: "The AI returned an empty response. It might be feeling a bit shy!" };
        }
        
        return { success: output, failure: null };

    } catch (err: any) {
        console.error("Almighty AI action error:", err);
        return { success: null, failure: err.message || "An unknown error occurred while talking to the AI." };
    }
}

const GenerateImageInputSchema = z.object({
  prompt: z.string().describe('A text prompt describing the desired image.'),
  userId: z.string(),
});

// This is a server-side helper now, not exported to client.
async function uploadBufferToFirebaseStorage(buffer: Buffer, contentType: string, fileName: string) {
    const storage = getStorage(app);
    const storageRef = ref(storage, `ai_generated/${fileName}`);
    const snapshot = await uploadBytes(storageRef, buffer, { contentType });
    return await getDownloadURL(snapshot.ref);
}

export async function generateImageAction(input: z.infer<typeof GenerateImageInputSchema>): Promise<{ success: { imageUrl: string } | null; failure: string | null }> {
    // Usage check for 'image' needs to be done on the client before calling this.
    try {
        const { media } = await ai.generate({
            model: 'googleai/imagen-4.0-fast-generate-001',
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

// Client-side action to upload files using Base64
export async function uploadFileToFirebaseStorage(
    { base64, contentType, fileName, userId }: { base64: string; contentType: string; fileName: string; userId: string; }
): Promise<{ success: { url: string } | null; failure: string | null }> {
    if (!userId || !base64 || !contentType || !fileName) {
        return { success: null, failure: 'Authentication or file data is missing.' };
    }

    try {
        const storageInstance = getStorage(app);
        const uniqueFileName = `${userId}-${Date.now()}-${fileName}`;
        const storageRef = ref(storageInstance, `user_uploads/${uniqueFileName}`);
        
        // Convert base64 to buffer
        const buffer = Buffer.from(base64, 'base64');
        
        const snapshot = await uploadBytes(storageRef, buffer, { contentType });
        const downloadURL = await getDownloadURL(snapshot.ref);
        return { success: { url: downloadURL }, failure: null };
    } catch (error: any) {
        console.error('Upload failed:', error);
        return { success: null, failure: error.message || 'File upload failed.' };
    }
}
