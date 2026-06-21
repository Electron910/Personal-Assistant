import { createClient } from 'redis';
import { Chroma } from '@langchain/community/vectorstores/chroma';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://127.0.0.1:6379'
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));

redisClient.connect().catch(console.error);

const getEmbeddingsModel = () => {
  return new GoogleGenerativeAIEmbeddings({
    model: 'gemini-embedding-001',
    apiKey: process.env.GOOGLE_API_KEY,
  });
};

const getSemanticVectorStore = async () => {
  return new Chroma(getEmbeddingsModel(), {
    collectionName: 'semantic_cache',
    url: process.env.CHROMA_URL || 'http://localhost:8000',
  });
};

export const getExactCache = async (key) => {
  try {
    const value = await redisClient.get(`exact:${key}`);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    return null;
  }
};

export const setExactCache = async (key, value, expirationInSeconds = 3600) => {
  try {
    await redisClient.setEx(`exact:${key}`, expirationInSeconds, JSON.stringify(value));
  } catch (error) {
  }
};

export const getPromptCache = async (prompt) => {
  try {
    const value = await redisClient.get(`prompt:${prompt}`);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    return null;
  }
};

export const setPromptCache = async (prompt, value, expirationInSeconds = 3600) => {
  try {
    await redisClient.setEx(`prompt:${prompt}`, expirationInSeconds, JSON.stringify(value));
  } catch (error) {
  }
};

export const getRetrievalCache = async (query) => {
  try {
    const value = await redisClient.get(`retrieval:${query}`);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    return null;
  }
};

export const setRetrievalCache = async (query, value, expirationInSeconds = 3600) => {
  try {
    await redisClient.setEx(`retrieval:${query}`, expirationInSeconds, JSON.stringify(value));
  } catch (error) {
  }
};

export const getSemanticCache = async (query, threshold = 0.85) => {
  try {
    const vectorStore = await getSemanticVectorStore();
    const results = await vectorStore.similaritySearchWithScore(query, 1);
    
    if (results.length > 0) {
      const [doc, score] = results[0];
      if (score >= threshold) {
        return JSON.parse(doc.metadata.response);
      }
    }
    return null;
  } catch (error) {
    return null;
  }
};

export const setSemanticCache = async (query, response) => {
  try {
    const vectorStore = await getSemanticVectorStore();
    await vectorStore.addDocuments([
      {
        pageContent: query,
        metadata: {
          response: JSON.stringify(response),
          timestamp: new Date().toISOString(),
        },
      }
    ]);
  } catch (error) {
  }
};
