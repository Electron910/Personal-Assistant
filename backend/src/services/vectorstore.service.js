import { Chroma } from '@langchain/community/vectorstores/chroma';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';

const getEmbeddingsModel = () => {
  return new GoogleGenerativeAIEmbeddings({
    model: 'gemini-embedding-001',
    apiKey: process.env.GOOGLE_API_KEY,
  });
};


export const getUserVectorStore = async (userId) => {
  const collectionName = `user_${userId}`;
  
  const vectorStore = new Chroma(getEmbeddingsModel(), {
    collectionName: collectionName,
    url: process.env.CHROMA_URL || 'http://localhost:8000',
  });

  return vectorStore;
};
