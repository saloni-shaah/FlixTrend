
/**
 * @fileOverview AI-powered moderation flow for FlixTrend using chain-of-thought reasoning.
 * This forces the AI to analyze content before making a decision, improving accuracy.
 */

import { ai } from '@/ai/ai';
import { defineFlow } from '@genkit-ai/flow';
import { z } from 'zod';
import { SafetyPolicy } from '@genkit-ai/googleai';


const ContentModerationInputSchema = z.object({
  text: z.string().optional().describe('All text content combined (caption, title, etc.).'),
  media: z.array(z.object({ url: z.string() })).optional().describe("An array of media items (images, videos) as data URIs."),
});

// DEFINITIVE FIX: Added 'analysis' field to force chain-of-thought reasoning.
const ContentModerationOutputSchema = z.object({
    analysis: z.string().describe("Your step-by-step reasoning. First, state if any rule is violated and why. If not, state that the content is compliant."),
    decision: z.enum(['approve', 'deny']).describe("Based ONLY on your analysis, decide whether to approve or deny. If your analysis found no clear violation, you MUST approve."),
    reason: z.string().describe("A brief, user-friendly explanation for the decision. If approved, say 'Content approved!'. If denied, explain the violation simply."),
});

// DEFINITIVE FIX: Updated prompt to implement chain-of-thought.
const moderationPrompt = `You are a fair and balanced content moderator for a Gen-Z social media app called FlixTrend.
Your goal is to keep the platform safe while allowing for creative expression, humor, and slang.

**Your Task (Chain-of-Thought Process):**

**Step 1: Analysis**
Carefully review the content against the rules below. In your 'analysis' field, write down your reasoning.
- If a rule is clearly and severely violated, state which rule and why.
- If no rules are violated, explicitly state "Content is compliant."

**Step 2: Decision**
Based ONLY on your analysis from Step 1, make your 'decision'.
- If your analysis identified a clear and severe violation, you MUST decide 'deny'.
- If your analysis concluded "Content is compliant", you MUST decide 'approve'.

**Rules (Deny content ONLY for clear and severe violations):**
1. Harmful or Abusive: True hate speech, credible violent threats, harassment, bullying, promotion of self-harm, graphic violence, or hard sexually explicit/vulgar material.
2. Spam/Illegal: Promoting illegal acts, scams, or posting pure gibberish.

Be lenient. Do NOT flag edgy humor, slang, or mild profanity. If it's ambiguous, approve it.

**Content to Review:**
TEXT: "{{text}}"
MEDIA: {{mediaList}}
`;

const noSafetyBlocks: SafetyPolicy[] = [
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
];

export const contentModerationFlow = defineFlow(
  {
    name: 'contentModerationFlow',
    inputSchema: ContentModerationInputSchema,
    outputSchema: ContentModerationOutputSchema,
  },
  async (input) => {
    const mediaList = input.media?.map(item => `- ${item.url}`).join('\n') || 'N/A';
    const finalPrompt = moderationPrompt
      .replace('"{{text}}"', JSON.stringify(input.text || ''))
      .replace('{{mediaList}}', mediaList);

    const response = await ai.generate({
      model: 'googleai/gemini-1.5-flash-preview',
      prompt: finalPrompt,
      output: { schema: ContentModerationOutputSchema },
      safetySettings: noSafetyBlocks,
      config: {
        temperature: 0.1,
      },
    });

    const output = response.output();
    if (!output) {
      console.error("Moderation flow failed to produce valid output.", response.usage());
      return {
        analysis: "AI model failed to produce a valid response.",
        decision: 'deny',
        reason: 'Could not verify content safety at this time. Please try again.',
      };
    }

    return output;
  }
);
