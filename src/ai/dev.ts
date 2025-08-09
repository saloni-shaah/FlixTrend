import { config } from 'dotenv';
config();

import '@/ai/flows/image-creation.ts';
import '@/ai/flows/ai-moderation.ts';
import '@/ai/flows/smart-reply.ts';
import '@/ai/flows/trend-detection.ts';
import '@/ai/flows/content-generation.ts';