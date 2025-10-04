'use server';
/**
 * @fileOverview A Genkit flow for performing a web search using the Tavily API.
 */
import { ai } from '@/ai/ai';
import { z } from 'zod';

const SearchInputSchema = z.object({
  query: z.string(),
});

async function performTavilySearch(query: string): Promise<string> {
  console.log(`Performing Tavily search for: ${query}`);
  try {
    // Dynamically import Tavily to prevent constructor issues at build time.
    const Tavily = (await import('tavily')).default;
    const tavilyClient = new Tavily(process.env.TAVILY_API_KEY || '');
    
    const searchResult = await tavilyClient.search(query, {
        searchDepth: "basic"
    });
    
    return JSON.stringify(searchResult.results, null, 2);
  } catch (error) {
    console.error("Tavily search failed:", error);
    return `The web search failed with an error: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

const searchFlow = ai.defineFlow(
  {
    name: 'searchFlow',
    inputSchema: SearchInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    return await performTavilySearch(input.query);
  }
);

export async function searchDuckDuckGo(query: string): Promise<string> {
  return await searchFlow({ query });
}
