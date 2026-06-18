import { Chroma } from '@langchain/community/vectorstores/chroma';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';

const getEmbeddingsModel = () => {
  return new GoogleGenerativeAIEmbeddings({
    model: 'gemini-embedding-001',
    apiKey: process.env.GOOGLE_API_KEY,
  });
};

/**
 * Gets a Chroma vector store instance scoped to a specific user.
 * @param {string} userId - The user ID to scope the collection.
 * @returns {Chroma} The Chroma vector store instance.
 */
export const getUserVectorStore = async (userId) => {
  const collectionName = `user_${userId}`;
  
  const vectorStore = new Chroma(getEmbeddingsModel(), {
    collectionName: collectionName,
    url: process.env.CHROMA_URL || 'http://localhost:8000',
  });

  return vectorStore;
};
