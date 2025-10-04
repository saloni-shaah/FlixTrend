
"use server";
import { ai } from '@/ai/ai';
import { z } from 'zod';
import { contentModerationFlow } from "@/ai/flows/content-moderation-flow";
import { searchDuckDuckGo } from "@/ai/flows/search-flow";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFirestore, doc, getDoc, setDoc, serverTimestamp, increment } from "firebase/firestore";
import { app, auth, db } from '@/utils/firebaseClient'; // Import app for storage initialization and db

// --- USAGE LIMITS ---
const USAGE_LIMITS = {
    text: 60,
    image: 2,
    search: 1,
};

type UsageType = keyof typeof USAGE_LIMITS;

/**
 * Checks if the user has exceeded their monthly usage limit for a given AI feature.
 * If not, it increments their usage count.
 * @param userId - The ID of the user.
 * @param type - The type of feature being used ('text', 'image', 'search').
 * @returns An object indicating if the request is allowed and a message.
 */
async function checkAndIncrementUsage(userId: string, type: UsageType): Promise<{ allowed: boolean; message: string }> {
    const userDocRef = doc(db, 'users', userId);

    try {
        const docSnap = await getDoc(userDocRef);
        if (!docSnap.exists()) {
            return { allowed: false, message: "User profile not found." };
        }

        const userData = docSnap.data();
        const isPremium = userData.isPremium && (!userData.premiumUntil || userData.premiumUntil.toDate() > new Date());
        
        // Premium users have unlimited access
        if (isPremium) {
            return { allowed: true, message: "Premium access." };
        }

        const now = new Date();
        const usage = userData.aiUsage || {};
        const lastReset = usage.lastReset?.toDate() || new Date(0);

        // Check if it's a new month
        if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
            // Reset counts for the new month
            usage.textCount = 0;
            usage.imageCount = 0;
            usage.searchCount = 0;
            usage.lastReset = serverTimestamp();
        }

        const currentCount = usage[`${type}Count`] || 0;
        const limit = USAGE_LIMITS[type];

        if (currentCount >= limit) {
            return { allowed: false, message: `You have reached your monthly limit of ${limit} ${type} generations. Please upgrade to Premium for unlimited access.` };
        }

        // Increment the count and proceed
        await setDoc(userDocRef, {
            aiUsage: {
                ...usage,
                [`${type}Count`]: increment(1),
                lastReset: usage.lastReset || serverTimestamp() // Ensure lastReset is set on first use
            }
        }, { merge: true });

        return { allowed: true, message: "Usage tracked." };

    } catch (error: any) {
        console.error("Error in checkAndIncrementUsage:", error);
        return { allowed: false, message: "Could not verify usage limits." };
    }
}


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
    inputSchema: z.object({ query: z.string(), userId: z.string() }), // Add userId to the tool input
    outputSchema: z.string(),
  },
  async (input) => {
    // Check usage limit for search
    const usageCheck = await checkAndIncrementUsage(input.userId, 'search');
    if (!usageCheck.allowed) {
        return usageCheck.message;
    }
    return searchDuckDuckGo(input.query);
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
        
        // Check usage limit for text
        const usageCheck = await checkAndIncrementUsage(input.userId, 'text');
        if (!usageCheck.allowed) {
            return { success: null, failure: usageCheck.message };
        }

        const { output } = await almightyPrompt(
            { userName: input.userName, message: input.message, context: input.context },
            { tools: { webSearch: { userId: input.userId } } } // Pass userId to the tool
        );
        
        if (!output?.response) {
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
      "A photo of an object, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
  ),
  prompt: z.string().describe(
      'A text prompt describing the desired style transformation (e.g., "turn this into an anime character").'
  ),
  userId: z.string(),
});

const ImageOutputSchema = z.object({
  remixedPhotoDataUri: z.string().describe('The data URI of the generated or remixed image.'),
});

export async function remixImageAction(input: z.infer<typeof RemixImageInputSchema>): Promise<{success: z.infer<typeof ImageOutputSchema> | null, failure: string | null}> {
    const usageCheck = await checkAndIncrementUsage(input.userId, 'image');
    if (!usageCheck.allowed) {
        return { success: null, failure: usageCheck.message };
    }
    
    try {
        const { media } = await ai.generate({
            model: 'googleai/gemini-1.5-pro-latest',
            prompt: [{ media: { url: input.photoDataUri } }, { text: input.prompt }],
            config: {
                responseModalities: ['IMAGE'],
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
    const usageCheck = await checkAndIncrementUsage(input.userId, 'image');
    if (!usageCheck.allowed) {
        return { success: null, failure: usageCheck.message };
    }

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

// Client-side action to upload files
export async function uploadFileToFirebaseStorage(formData: FormData): Promise<{ success: { url: string } | null; failure: string | null }> {
    const file = formData.get('file') as File;
    const user = auth.currentUser;

    if (!user || !file) {
        return { success: null, failure: 'Authentication or file is missing.' };
    }

    try {
        const storageInstance = getStorage(app);
        const fileName = `${user.uid}-${Date.now()}-${file.name}`;
        const storageRef = ref(storageInstance, `user_uploads/${fileName}`);
        const snapshot = await uploadBytes(storageRef, file, { contentType: file.type });
        const downloadURL = await getDownloadURL(snapshot.ref);
        return { success: { url: downloadURL }, failure: null };
    } catch (error: any) {
        console.error('Upload failed:', error);
        return { success: null, failure: error.message || 'File upload failed.' };
    }
}
