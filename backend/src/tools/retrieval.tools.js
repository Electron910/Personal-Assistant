import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { getUserVectorStore } from '../services/vectorstore.service.js';
import { getRetrievalCache, setRetrievalCache } from '../services/cache.service.js';

export const getRetrievalTool = (userId) => {
  return tool(
    async ({ query }) => {
      try {
        const cachedResult = await getRetrievalCache(query);
        if (cachedResult) {
          return cachedResult;
        }

        const vectorStore = await getUserVectorStore(userId);
        const retriever = vectorStore.asRetriever({ k: 4 });

        const docs = await retriever.invoke(query);

        if (!docs || docs.length === 0) {
          const emptyResponse = "No relevant information found in the user's uploaded documents.";
          await setRetrievalCache(query, emptyResponse);
          return emptyResponse;
        }

        const formattedDocs = docs.map((doc, idx) => `--- Document ${idx + 1} ---\n${doc.pageContent}`).join('\n\n');
        const finalResponse = `Relevant information found:\n\n${formattedDocs}`;
        
        await setRetrievalCache(query, finalResponse);
        
        return finalResponse;
      } catch (error) {
        return `Error retrieving knowledge: ${error.message}`;
      }
    },
    {
      name: 'retrieve_knowledge',
      description: 'Search the user\'s uploaded documents (knowledge base) for information related to a query. Use this tool when the user asks a question about their uploaded files or you need to fetch information from them.',
      schema: z.object({
        query: z.string().describe('The search query to look up in the documents.'),
      }),
    }
  );
};
