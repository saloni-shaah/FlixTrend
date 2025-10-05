
/**
 * @fileOverview AI-powered moderation and categorization flow for FlixTrend.
 * This single flow analyzes content for safety and assigns it a category.
 */

import { ai, SafetyPolicy } from '@/ai/ai';
import { z } from 'zod';

const postCategories = [
    "Music", "Fashion", "Comedy", "Tech", "Gaming", "Art", "Travel", "Food", 
    "Education", "Lifestyle", "Sports", "News", "DIY", "Science", "Movies", "Other"
] as const;

const ContentModerationInputSchema = z.object({
  text: z.string().optional().describe('All text content combined (caption, title, etc.).'),
  media: z.array(z.object({ url: z.string() })).optional().describe("An array of media items (images, videos) as data URIs. This is currently ignored."),
});

// DEFINITIVE FIX: Added 'category' field to the output schema.
const ContentModerationOutputSchema = z.object({
    analysis: z.string().describe("Your step-by-step reasoning for the safety decision. First, state if any rule is violated and why. If not, state that the content is compliant."),
    decision: z.enum(['approve', 'deny']).describe("Based ONLY on your analysis, decide whether to approve or deny. If your analysis found no clear violation, you MUST approve."),
    reason: z.string().describe("A brief, user-friendly explanation for the decision. If approved, say 'Content approved!'. If denied, explain the violation simply."),
    category: z.enum(postCategories).describe("The single best category for the post from the provided list. Base this on the main topic of the text content."),
});

// DEFINITIVE FIX: Updated prompt to handle both moderation and categorization.
const moderationPrompt = `You are an expert content classifier and a fair and balanced content moderator for a Gen-Z social media app called FlixTrend.
Your goal is to keep the platform safe while allowing for creative expression. You will ONLY analyze the text content provided.

**Your Task (Chain-of-Thought Process):**

**Step 1: Moderation Analysis**
Carefully review the text content against the rules below. In your 'analysis' field, write down your reasoning.
- If a rule is clearly and severely violated, state which rule and why.
- If no rules are violated, explicitly state "Content is compliant."

**Step 2: Moderation Decision**
Based ONLY on your analysis from Step 1, make your 'decision'.
- If your analysis identified a clear and severe violation, you MUST decide 'deny'.
- If your analysis concluded "Content is compliant", you MUST decide 'approve'.

**Step 3: Categorization**
Analyze the text content and assign it to the single most relevant category from the list below. In the 'category' field, provide only the category name.
Categories: ${postCategories.join(', ')}

**Rules (Deny content ONLY for clear and severe violations of the TEXT):**
1. Harmful or Abusive: True hate speech, credible violent threats, harassment, bullying, promotion of self-harm.
2. Spam/Illegal: Promoting illegal acts, scams, or posting pure gibberish.

Be lenient. Do NOT flag edgy humor, slang, or mild profanity. If it's ambiguous, approve it.

**Content to Review:**
TEXT: "{{text}}"
`;

const noSafetyBlocks: SafetyPolicy[] = [
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
];

export const contentModerationFlow = ai.defineFlow(
  {
    name: 'contentModerationFlow',
    inputSchema: ContentModerationInputSchema,
    outputSchema: ContentModerationOutputSchema,
  },
  async (input) => {
    // Media is now ignored. We only process text.
    const finalText = input.text || '';
    
    // If there is no text content to moderate, approve and categorize as 'Other'.
    if (!finalText.trim()) {
        return {
            analysis: "No text content provided. Approved by default.",
            decision: 'approve',
            reason: 'Content approved!',
            category: 'Other',
        }
    }

    const finalPrompt = moderationPrompt
      .replace('"{{text}}"', JSON.stringify(finalText));

    const response = await ai.generate({
      model: 'googleai/gemini-2.0-flash-lite-001',
      prompt: finalPrompt,
      output: { schema: ContentModerationOutputSchema },
      safetySettings: noSafetyBlocks,
      config: {
        temperature: 0.1,
      },
    });

    const output = response.output;
    if (!output) {
      console.error("Moderation flow failed to produce valid output.", response.usage);
      return {
        analysis: "AI model failed to produce a valid response.",
        decision: 'deny',
        reason: 'Could not verify content safety at this time. Please try again.',
        category: 'Other', // Default category on failure
      };
    }

    return output;
  }
);
