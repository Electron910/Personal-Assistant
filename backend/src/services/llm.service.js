import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { getFileTools } from '../tools/file.tools.js';
import { getRetrievalTool } from '../tools/retrieval.tools.js';
import { getSystemTools } from '../tools/system.tools.js';
import { getMemoryTools } from '../tools/memory.tools.js';

export const getModelWithTools = (userId) => {
  const llm = new ChatGoogleGenerativeAI({
    model: 'gemini-2.5-flash',
    apiKey: process.env.GOOGLE_API_KEY,
    temperature: 0,
  });

  const fileTools = getFileTools(userId);
  const retrievalTool = getRetrievalTool(userId);
  const systemTools = getSystemTools();
  const memoryTools = getMemoryTools(userId);

  const tools = [...fileTools, retrievalTool, ...systemTools, ...memoryTools];

  const modelWithTools = llm.bindTools(tools);

  return { modelWithTools, tools };
};
