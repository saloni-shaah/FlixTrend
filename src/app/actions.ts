
"use server";
import { ai } from '@/ai/ai';
import { z } from 'genkit';
import { contentModerationFlow } from "@/ai/flows/content-moderation-flow";
import { searchDuckDuckGo } from "@/ai/flows/search-flow";

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
- Keep your responses concise, fun, and easy to read.

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
  photoDataUri: z.string().describe(
      "A photo as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
  ),
  prompt: z.string().describe(
      'A text prompt describing the desired style transformation (e.g., "turn this into an anime character").'
  ),
});

const RemixImageOutputSchema = z.object({
  remixedPhotoDataUri: z.string().describe('The remixed image as a data URI.'),
});

export async function remixImageAction(input: z.infer<typeof RemixImageInputSchema>): Promise<{success: z.infer<typeof RemixImageOutputSchema> | null, failure: string | null}> {
    try {
        const { media } = await ai.generate({
            model: 'googleai/gemini-2.5-flash-image-preview',
            prompt: [{ media: { url: input.photoDataUri } }, { text: input.prompt }],
            config: {
                responseModalities: ['TEXT', 'IMAGE'],
            },
        });

        if (!media?.url) {
            throw new Error('Image generation failed to produce an image.');
        }

        return { success: { remixedPhotoDataUri: media.url }, failure: null };

    } catch(err: any) {
        console.error("Remix image action error:", err);
        return { success: null, failure: err.message || 'An unknown error occurred during image remixing.' };
    }
}

const ModerationInputSchema = z.object({
  text: z.string().optional(),
  media: z.array(z.object({ url: z.string() })).optional(),
});

export async function runContentModerationAction(input: z.infer<typeof ModerationInputSchema>) {
    try {
        // Now running the flow securely on the server.
        const result = await contentModerationFlow(input);
        return { success: result, failure: null };
    } catch (error: any) {
        console.error("Content moderation action error:", error);
        return { success: null, failure: error.message || "An unknown error occurred during moderation." };
    }
}


// Server action to handle file uploads
export async function uploadFileToFirebaseStorage(formData: FormData) {
    const { getStorage, ref, uploadBytes, getDownloadURL } = await import("firebase/storage");
    const { auth } = await import('@/utils/firebaseClient');
    
    const file = formData.get('file') as File;
    const user = auth.currentUser;
    if (!user || !file) {
        return { success: null, failure: 'Authentication or file is missing.' };
    }

    try {
        const storage = getStorage();
        const fileName = `${user.uid}-${Date.now()}-${file.name}`;
        const storageRef = ref(storage, `user_uploads/${fileName}`);

        const snapshot = await uploadBytes(storageRef, file, {
            contentType: file.type,
        });

        const downloadURL = await getDownloadURL(snapshot.ref);

        return { success: { url: downloadURL }, failure: null };
    } catch (error: any) {
        console.error("Upload error:", error);
        return { success: null, failure: `Upload failed: ${error.message}` };
    }
}
