'use server';
/**
 * @fileOverview A comprehensive AI chatbot flow for FlixTrend's "Almighty AI".
 *
 * This file defines the core logic for the chatbot, including its personality,
 * knowledge base about the app, and its ability to use tools to perform actions
 * on behalf of the user, such as creating posts or initiating calls.
 *
 * - almightyChat: The main function to interact with the chatbot.
 * - AlmighyChatRequest: The input type for the almightyChat function.
 * - ChatMessage: The type for a single message in the chat history.
 */

import { ai } from '@/ai/ai';
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from 'firebase/firestore';
import { z } from 'zod';
import { app } from '@/utils/firebaseClient'; // Import the initialized app

const db = getFirestore(app); // Pass the app instance to getFirestore

// Define the schema for a single chat message.
export const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  parts: z.array(z.object({ text: z.string() })),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

// Define the input schema for the main chat flow.
export const AlmighyChatRequestSchema = z.object({
  history: z.array(ChatMessageSchema),
  userId: z.string(),
  displayName: z.string(),
});
export type AlmighyChatRequest = z.infer<typeof AlmighyChatRequestSchema>;

// Define the tool for creating a new post.
const createPostTool = ai.defineTool(
  {
    name: 'createPost',
    description: 'Creates a new text post in the user\'s VibeSpace feed.',
    inputSchema: z.object({
      content: z.string().describe('The text content of the post.'),
    }),
    outputSchema: z.object({
      success: z.boolean(),
      postId: z.string().optional(),
    }),
  },
  async ({ content }, { a: { userId, displayName } }) => {
    try {
      const user = { uid: userId, displayName: displayName };
      const profileSnap = await getDoc(doc(db, 'users', user.uid));
      const profileData = profileSnap.exists() ? profileSnap.data() : {};

      const postData = {
        userId: user.uid,
        displayName: profileData.name || user.displayName,
        username: profileData.username,
        avatar_url: profileData.avatar_url,
        type: 'text',
        content: content,
        createdAt: serverTimestamp(),
      };
      const docRef = await addDoc(collection(db, 'posts'), postData);
      return { success: true, postId: docRef.id };
    } catch (error) {
      console.error('Error creating post with tool:', error);
      return { success: false };
    }
  }
);

// Define the tool for initiating a video call.
const initiateCallTool = ai.defineTool(
  {
    name: 'initiateCall',
    description: 'Initiates a video call with another user by their username.',
    inputSchema: z.object({
      username: z
        .string()
        .describe(
          'The username of the person to call, without the @ symbol.'
        ),
    }),
    outputSchema: z.any(), // The user profile of the person being called.
  },
  async ({ username }) => {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', username));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        return null; // User not found
      }
      const userDoc = querySnapshot.docs[0];
      return { uid: userDoc.id, ...userDoc.data() };
    } catch (error) {
      console.error('Error finding user for call:', error);
      return null;
    }
  }
);

// Define the main prompt for the Almighty AI chatbot.
const almightyPrompt = ai.definePrompt({
  name: 'almightyPrompt',
  // Provide the tools the AI can use.
  tools: [createPostTool, initiateCallTool],
  // Give the AI its personality and instructions.
  system: `You are Almighty AI, the witty, helpful, and slightly sarcastic Gen-Z chatbot for the social media app FlixTrend. Your goal is to be incredibly helpful and engaging.

  **Your Personality:**
  - **Gen-Z Voice:** Use modern slang (like "vibe," "slay," "no cap," "bet"). Keep it casual and fun.
  - **Emojis are a must:** Use emojis liberally to add personality. ✨🤖🚀
  - **Slightly Sarcastic but Always Helpful:** You can be a little sassy, but your primary goal is to help the user.
  - **Context-Aware:** You know who you're talking to (the user's display name is provided).

  **About FlixTrend (Your Knowledge Base):**
  - **VibeSpace (Home Feed):** The main feed. It's real-time, not algorithmic. Users post text, photos, videos, polls, and audio.
  - **Flashes (Stories):** Ephemeral stories that last 24 hours. Users can add Spotify songs and interactive polls.
  - **Scope (Explore Page):** Where users discover trending hashtags, creators, and "Short Vibes" (a vertical video feed).
  - **Squad & Signal (Profile & Chat):** 'Squad' is the profile page. 'Signal' is the end-to-end encrypted chat feature for mutuals.
  - **Almighty AI (That's you!):** A helpful AI assistant that can answer questions, create posts, and even initiate calls for the user.
  - **Key Features:** Real-time feed, Spotify integration, AI-powered tools, privacy-focused (no data selling, E2E chat).

  **Your Capabilities (Tools):**
  - **Create Posts:** If a user asks you to post something, use the \`createPost\` tool. Example: "Almighty, post 'loving the new update!'"
  - **Initiate Calls:** If a user asks you to call someone, use the \`initiateCall\` tool with their username. Example: "yo almighty, call @coolgal" -> you call 'coolgal'.

  **Interaction Guidelines:**
  - When a tool is used successfully, confirm it in a fun way. E.g., "Bet, post is live! 🚀" or "Aight, calling them for you now! 🤙"
  - If a tool fails or you can't find a user, be helpful. E.g., "Oof, couldn't find a user with that name. You sure that's their @?"
  - If you don't know an answer, don't make it up. Just say something like, "ngl, that's above my pay grade, but I can help with anything about FlixTrend!"`,
  
  // The user's chat history will be passed in here.
  messages: z.array(ChatMessageSchema),
});

// Define the main chat flow.
const almightyChatFlow = ai.defineFlow(
  {
    name: 'almightyChatFlow',
    inputSchema: AlmighyChatRequestSchema,
    outputSchema: z.object({
        textResponse: z.string().optional(),
        toolResponse: z.any().optional(),
    }),
  },
  async (request) => {
    const { history, userId, displayName } = request;
    // Call the Gemini model with the prompt and history.
    const { response } = await ai.generate({
      model: 'googleai/gemini-1.5-flash-latest',
      prompt: almightyPrompt,
      messages: history,
      // Pass user info to the tools' context
      context: { userId, displayName },
    });

    // Check if the AI decided to use a tool.
    if (response.toolRequests.length > 0) {
        const toolRequest = response.toolRequests[0];
        // Execute the requested tool
        const toolResponse = await toolRequest.run();

        return {
            toolResponse: {
                name: toolRequest.tool,
                output: toolResponse
            },
            textResponse: response.text || `Done. ✅`, // Ensure text response
        };
    }

    // If no tool was used, just return the AI's text response.
    return { textResponse: response.text };
  }
);

// Export a wrapper function for the client to call easily.
export async function almightyChat(request: AlmighyChatRequest) {
  return await almightyChatFlow(request);
}
