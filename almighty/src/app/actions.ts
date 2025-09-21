
"use server";

import { chatWithAlmighty } from "../ai/flows/ai-chatbot-impersonation";
import type { ChatWithAlmightyInput } from "../ai/flows/ai-chatbot-impersonation";
import { remixImage } from "../ai/flows/remix-image-flow";
import {
  RemixImageInput,
  RemixImageInputSchema,
} from '../ai/schemas/remix-image-schema';

export async function getAlmightyResponse(input: ChatWithAlmightyInput) {
  try {
    const output = await chatWithAlmighty(input);
    return { success: output };
  } catch (error) {
    console.error(error);
    return { failure: "An error occurred while communicating with the AI." };
  }
}

export async function remixImageAction(input: RemixImageInput) {
  const parsedInput = RemixImageInputSchema.safeParse(input);
  if (!parsedInput.success) {
    return { failure: "Invalid input" };
  }

  try {
    const output = await remixImage(parsedInput.data);
    return { success: output };
  } catch (error) {
    console.error(error);
    return { failure: "An error occurred while remixing the image." };
  }
}
