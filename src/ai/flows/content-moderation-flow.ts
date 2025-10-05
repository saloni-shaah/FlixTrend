
/**
 * @fileOverview AI-powered moderation and categorization flow for FlixTrend.
 * This single flow analyzes content for safety and assigns it a category.
 */

import { ai, SafetyPolicy } from '@/ai/ai';
import { z } from 'zod';

const postCategories = [
    "Art", "Animation", "Illustration", "Photography", "Digital Art", "Street Art",
    "Music", "Pop", "Rock", "Hip-Hop", "Electronic", "Classical", "Live Music", "Music Production",
    "Fashion", "Streetwear", "Haute Couture", "DIY Fashion", "Thrifting", "Beauty", "Makeup", "Skincare",
    "Comedy", "Stand-up", "Sketches", "Memes", "Satire",
    "Tech", "Gadgets", "Software Development", "Startups", "AI", "Cybersecurity", "Gaming Hardware",
    "Gaming", "PC Gaming", "Console Gaming", "Mobile Gaming", "Esports", "Indie Games", "Livestreaming",
    "Travel", "Adventure Travel", "Budget Travel", "City Guides", "Nature",
    "Food", "Cooking", "Baking", "Restaurant Reviews", "Street Food", "Healthy Eating",
    "Education", "Science", "History", "Mathematics", "Languages", "Coding Tutorials",
    "Lifestyle", "Vlogging", "Motivation", "Health & Wellness", "Fitness", "Yoga", "Mental Health",
    "Sports", "Football", "Basketball", "Cricket", "Skateboarding", "Surfing", "Extreme Sports",
    "News", "Current Events", "Politics", "Tech News", "World News",
    "DIY", "Home Improvement", "Crafts", "Woodworking", "3D Printing",
    "Movies & TV", "Film Reviews", "TV Show Analysis", "Fan Theories", "Behind the Scenes",
    "Automotive", "Car Reviews", "Motorsports", "Custom Cars", "EVs",
    "Business", "Entrepreneurship", "Marketing", "Finance", "Investing",
    "Literature", "Book Reviews", "Poetry", "Creative Writing",
    "Dance", "Hip-Hop Dance", "Ballet", "Contemporary Dance", "Dance Tutorials",
    "Animals & Pets", "Cute Animals", "Pet Care", "Wildlife",
    "Other"
] as const;

const ContentModerationInputSchema = z.object({
  text: z.string().optional().describe('All text content combined (caption, title, etc.).'),
  media: z.array(z.object({ url: z.string() })).optional().describe("An array of media items (images, videos) as data URIs. This is currently ignored."),
});

const ContentModerationOutputSchema = z.object({
    analysis: z.string().describe("Your step-by-step reasoning for the safety decision. First, state if any rule is violated and why. If not, state that the content is compliant."),
    decision: z.enum(['approve', 'deny']).describe("Based ONLY on your analysis, decide whether to approve or deny. If your analysis found no clear violation, you MUST approve."),
    reason: z.string().describe("A brief, user-friendly explanation for the decision. If approved, say 'Content approved!'. If denied, explain the violation simply."),
    category: z.enum(postCategories).describe("The single best category for the post from the provided list. Base this on the main topic of the text content. Avoid using 'Other' unless no other category is remotely suitable."),
});

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
Analyze the text content and assign it to the single most relevant category from the list below. In the 'category' field, provide only the category name. Avoid the 'Other' category unless the content has no discernible topic.
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
