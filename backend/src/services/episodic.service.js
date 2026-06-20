import { Chroma } from '@langchain/community/vectorstores/chroma';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';

const getEmbeddingsModel = () => {
  return new GoogleGenerativeAIEmbeddings({
    model: 'gemini-embedding-001',
    apiKey: process.env.GOOGLE_API_KEY,
  });
};

/**
 * Gets a Chroma vector store instance for episodic memory scoped to a specific user.
 */
export const getEpisodicVectorStore = async (userId) => {
  const collectionName = `user_${userId}_episodes`;
  
  const vectorStore = new Chroma(getEmbeddingsModel(), {
    collectionName: collectionName,
    url: process.env.CHROMA_URL || 'http://localhost:8000',
  });

  return vectorStore;
};

/**
 * Saves a conversational turn (User message + Assistant reply) to episodic memory.
 */
export const saveEpisode = async (userId, userMessage, assistantReply, sessionId) => {
  try {
    const vectorStore = await getEpisodicVectorStore(userId);
    
    const pageContent = `User: ${userMessage}\nAssistant: ${assistantReply}`;
    
    await vectorStore.addDocuments([
      {
        pageContent,
        metadata: {
          sessionId: sessionId.toString(),
          timestamp: new Date().toISOString(),
        },
      }
    ]);
  } catch (error) {
    console.error('[Episodic Memory] Failed to save episode:', error);
  }
};

/**
 * Queries the episodic memory for past conversations relevant to the current query.
 */
export const queryEpisodes = async (userId, query, k = 3) => {
  try {
    const vectorStore = await getEpisodicVectorStore(userId);
    const results = await vectorStore.similaritySearch(query, k);
    return results.map(r => r.pageContent);
  } catch (error) {
    console.error('[Episodic Memory] Failed to query episodes:', error);
    return [];
  }
};
