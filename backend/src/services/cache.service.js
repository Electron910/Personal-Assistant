import { createClient } from 'redis';
import { Chroma } from '@langchain/community/vectorstores/chroma';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';

let isRedisConnected = false;

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
  disableOfflineQueue: true,
  socket: {
    reconnectStrategy: false
  }
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error', err);
  isRedisConnected = false;
});

redisClient.on('connect', () => {
  isRedisConnected = true;
});

redisClient.connect().catch((err) => {
  console.error('Failed to connect to Redis. Caching will be bypassed.');
  isRedisConnected = false;
});

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
  if (!isRedisConnected) return null;
  try {
    const value = await redisClient.get(`exact:${key}`);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    return null;
  }
};

export const setExactCache = async (key, value, expirationInSeconds = 3600) => {
  if (!isRedisConnected) return;
  try {
    await redisClient.setEx(`exact:${key}`, expirationInSeconds, JSON.stringify(value));
  } catch (error) {
  }
};

export const getPromptCache = async (prompt) => {
  if (!isRedisConnected) return null;
  try {
    const value = await redisClient.get(`prompt:${prompt}`);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    return null;
  }
};

export const setPromptCache = async (prompt, value, expirationInSeconds = 3600) => {
  if (!isRedisConnected) return;
  try {
    await redisClient.setEx(`prompt:${prompt}`, expirationInSeconds, JSON.stringify(value));
  } catch (error) {
  }
};

export const getRetrievalCache = async (query) => {
  if (!isRedisConnected) return null;
  try {
    const value = await redisClient.get(`retrieval:${query}`);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    return null;
  }
};

export const setRetrievalCache = async (query, value, expirationInSeconds = 3600) => {
  if (!isRedisConnected) return;
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
