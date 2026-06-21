import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import Session from '../models/Session.js';
import Message from '../models/Message.js';

const getSummarizationModel = () => {
  return new ChatGoogleGenerativeAI({
    model: 'gemini-2.5-flash',
    apiKey: process.env.GOOGLE_API_KEY,
    temperature: 0.3,
  });
};


export const summarizeSession = async (sessionId, unsummarizedMessages, currentSummary) => {
  try {
    const llm = getSummarizationModel();
    
    
    const prompt = `
You are an AI assistant summarizer. Your goal is to progressively summarize the conversation.
Current Summary:
${currentSummary ? currentSummary : "No previous summary."}

New conversation lines to incorporate into the summary:
${unsummarizedMessages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n')}

Please provide a concise but comprehensive updated summary of the entire conversation so far. Include key facts, context, and user intents. Do NOT output anything other than the new summary.
`;

    const response = await llm.invoke([new HumanMessage(prompt)]);
    const newSummary = response.content;

    
    await Session.findByIdAndUpdate(sessionId, {
      summary: newSummary,
      $inc: { summarizedCount: unsummarizedMessages.length },
    });

    console.log(`[Summarizer] Successfully summarized session ${sessionId}. New summary length: ${newSummary.length}`);
    return newSummary;
  } catch (error) {
    console.error('[Summarizer] Failed to summarize session:', error);
    return currentSummary; 
  }
};
