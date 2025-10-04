
'use server';
/**
 * @fileOverview A Genkit flow for performing a web search using the Tavily API.
 */
import { ai } from '@/ai/ai';
import { z } from 'zod';
import * as Tavily from 'tavily';

const SearchInputSchema = z.object({
  query: z.string(),
});

// Initialize the Tavily client. It will automatically use the TAVILY_API_KEY from your .env file.
const tavilyClient = new (Tavily as any)(process.env.TAVILY_API_KEY || '');

async function performTavilySearch(query: string): Promise<string> {
  console.log(`Performing Tavily search for: ${query}`);
  try {
    // Perform a basic search. You can also use 'advanced' for more complex queries.
    const searchResult = await tavilyClient.search(query, {
        searchDepth: "basic"
    });
    // We'll return a formatted string of the results for the AI to consume.
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
