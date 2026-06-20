import Message from '../models/Message.js';
import Session from '../models/Session.js';
import CoreMemory from '../models/CoreMemory.js';
import { getModelWithTools } from '../services/llm.service.js';
import { queryEpisodes, saveEpisode } from '../services/episodic.service.js';
import { summarizeSession } from '../services/summary.service.js';
import { HumanMessage, AIMessage, ToolMessage, SystemMessage } from '@langchain/core/messages';

// Helper to convert DB messages to LangChain messages
const convertDbToLangChainMessages = (dbMessages) => {
  return dbMessages.map(msg => {
    if (msg.role === 'user') return new HumanMessage(msg.content);
    if (msg.role === 'assistant') {
      const aiMsg = new AIMessage(msg.content || '');
      if (msg.tool_calls && msg.tool_calls.length > 0) {
        aiMsg.tool_calls = msg.tool_calls;
      }
      return aiMsg;
    }
    if (msg.role === 'tool') {
      return new ToolMessage({
        content: msg.content,
        tool_call_id: msg.tool_call_id,
        name: msg.name,
      });
    }
    return new SystemMessage(msg.content);
  });
};

// @desc    Get all chat sessions for user
// @route   GET /api/chat/sessions
// @access  Private
const getSessions = async (req, res, next) => {
  try {
    const sessions = await Session.find({ user: req.user._id }).sort('-updatedAt');
    res.json(sessions);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new session
// @route   POST /api/chat/sessions
// @access  Private
const createSession = async (req, res, next) => {
  try {
    const session = await Session.create({
      user: req.user._id,
      title: req.body.title || 'New Chat',
    });
    res.status(201).json(session);
  } catch (error) {
    next(error);
  }
};

// @desc    Update session title
// @route   PUT /api/chat/sessions/:id
// @access  Private
const updateSessionTitle = async (req, res, next) => {
  try {
    const session = await Session.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { title: req.body.title },
      { new: true }
    );
    if (!session) {
      res.status(404);
      throw new Error('Session not found');
    }
    res.json(session);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a session and its messages
// @route   DELETE /api/chat/sessions/:id
// @access  Private
const deleteSession = async (req, res, next) => {
  try {
    const session = await Session.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!session) {
      res.status(404);
      throw new Error('Session not found');
    }
    await Message.deleteMany({ session: req.params.id });
    res.json({ message: 'Session deleted' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get chat history for a session
// @route   GET /api/chat/history?sessionId=...
// @access  Private
const getChatHistory = async (req, res, next) => {
  try {
    const { sessionId } = req.query;
    if (!sessionId) {
      return res.json([]);
    }
    const messages = await Message.find({ user: req.user._id, session: sessionId }).sort('createdAt');
    res.json(messages);
  } catch (error) {
    next(error);
  }
};

// @desc    Send a message to the agent
// @route   POST /api/chat/message
// @access  Private
const sendMessage = async (req, res, next) => {
  try {
    const { content, sessionId } = req.body;
    const userId = req.user._id;

    if (!content) {
      res.status(400);
      throw new Error('Message content is required');
    }

    let currentSessionId = sessionId;
    let session;
    
    // Create new session if none provided
    if (!currentSessionId) {
      session = await Session.create({
        user: userId,
        title: content.substring(0, 30) + (content.length > 30 ? '...' : ''),
      });
      currentSessionId = session._id;
    } else {
      // Check if session exists and belongs to user
      session = await Session.findOne({ _id: currentSessionId, user: userId });
      if (!session) {
        res.status(404);
        throw new Error('Session not found');
      }
    }

    // 1. Save user message to DB
    const userDbMsg = await Message.create({
      user: userId,
      session: currentSessionId,
      role: 'user',
      content,
    });

    // --- MEMORY CAPABILITIES INJECTION ---

    // A. Fetch Core Memories (Facts)
    const coreMemories = await CoreMemory.find({ user: userId });
    const coreMemoryText = coreMemories.length > 0 
      ? coreMemories.map(m => `- ${m.content}`).join('\n') 
      : 'No explicitly saved facts yet.';

    // B. Fetch Episodic Memories (Semantic Search from past sessions)
    const relevantPastEpisodes = await queryEpisodes(userId, content);
    const episodicMemoryText = relevantPastEpisodes.length > 0
      ? relevantPastEpisodes.join('\n\n')
      : 'No highly relevant past conversations found.';

    // C. Summarization Logic
    let allDbMessages = await Message.find({ user: userId, session: currentSessionId }).sort('createdAt');
    const MAX_UNSUMMARIZED_MESSAGES = 15;
    
    if (allDbMessages.length > MAX_UNSUMMARIZED_MESSAGES) {
      // Summarize the older half of the messages
      const messagesToSummarizeCount = Math.floor(allDbMessages.length / 2);
      const messagesToSummarize = allDbMessages.slice(0, messagesToSummarizeCount);
      const newSummary = await summarizeSession(currentSessionId, messagesToSummarize, session.summary);
      
      // Update session summary in memory
      session.summary = newSummary;
      
      // Delete or just exclude the summarized messages from active context
      // For simplicity here, we keep them in DB for history, but exclude them from LC messages
      allDbMessages = allDbMessages.slice(messagesToSummarizeCount);
    }

    const lcMessages = convertDbToLangChainMessages(allDbMessages);

    // D. Construct final System Prompt with Memory Injections
    let systemPromptContent = 
      "You are an Autonomous System Agent and Personal Assistant. " +
      "If the user asks you to read, edit, or delete a file without providing its absolute path, you MUST autonomously use the `search_system_files` tool to find it first. " +
      "Once you find the absolute path, you may proceed with the requested action (read/edit/delete). " +
      "You have the `open_application` tool to launch any apps or URLs the user requests (e.g., 'Open VS Code', 'Play Spotify', 'Go to YouTube'). " +
      "CRITICAL SPEED RULE: DO NOT use `search_system_files` to find applications! If the user says 'open [app]', directly use `open_application` with the app name. Only search for actual files (like .pdf, .txt, .js). " +
      "SECURITY RULE: Before modifying or deleting files via system tools, you MUST explicitly ask for their permission, unless they clearly provided the path and asked you to perform the action. " +
      "TRANSPARENCY RULE: In your final response to the user, ALWAYS start by briefly listing exactly what actions/tools you performed behind the scenes (e.g., 'I searched your Downloads folder and found 3 files, then I opened Spotify.').\n\n";

    systemPromptContent += `### CORE MEMORIES (Known Facts about the User)\n${coreMemoryText}\n\n`;
    systemPromptContent += `### EPISODIC MEMORIES (Relevant Past Conversations)\n${episodicMemoryText}\n\n`;
    
    if (session.summary) {
      systemPromptContent += `### CURRENT SESSION SUMMARY (Older messages summarized)\n${session.summary}\n\n`;
    }

    const systemPrompt = new SystemMessage(systemPromptContent);

    // 3. Setup LLM with tools
    const { modelWithTools, tools } = getModelWithTools(userId.toString());

    // 4. Agent loop
    let currentMessages = [systemPrompt, ...lcMessages];
    let finalAiResponse = null;

    console.log(`\n[Agent Logger] 🤖 Starting new task for session: ${currentSessionId}`);

    while (true) {
      console.log(`[Agent Logger] ⏳ Model is thinking...`);
      const response = await modelWithTools.invoke(currentMessages);
      currentMessages.push(response);

      let contentStr = '';
      if (typeof response.content === 'string') {
        contentStr = response.content;
      } else if (Array.isArray(response.content)) {
        contentStr = response.content.filter(p => p.type === 'text').map(p => p.text).join('\n');
      }

      // Save AI message to DB
      const aiDbMsg = await Message.create({
        user: userId,
        session: currentSessionId,
        role: 'assistant',
        content: contentStr,
        tool_calls: response.tool_calls || [],
      });

      if (response.tool_calls && response.tool_calls.length > 0) {
        console.log(`[Agent Logger] 🛠️ Model requested ${response.tool_calls.length} tool call(s)`);
        // Execute tools
        for (const toolCall of response.tool_calls) {
          const selectedTool = tools.find(t => t.name === toolCall.name);
          if (selectedTool) {
            console.log(`[Agent Logger] ▶️ Executing tool: ${toolCall.name}`);
            console.log(`[Agent Logger] 📥 Arguments:`, toolCall.args);
            
            let toolResult;
            try {
              toolResult = await selectedTool.invoke(toolCall.args);
              console.log(`[Agent Logger] ✅ Tool ${toolCall.name} succeeded.`);
            } catch (err) {
              toolResult = `Error executing tool: ${err.message}`;
              console.log(`[Agent Logger] ❌ Tool ${toolCall.name} failed:`, err.message);
            }

            const toolMsg = new ToolMessage({
              content: typeof toolResult === 'string' ? toolResult : JSON.stringify(toolResult),
              tool_call_id: toolCall.id,
              name: toolCall.name,
            });

            currentMessages.push(toolMsg);

            // Save Tool message to DB
            await Message.create({
              user: userId,
              session: currentSessionId,
              role: 'tool',
              content: toolMsg.content,
              tool_call_id: toolMsg.tool_call_id,
              name: toolMsg.name,
            });
          }
        }
        // Continue loop to send tool results back to LLM
      } else {
        // No more tool calls, we have our final response
        console.log(`[Agent Logger] 🏁 Task completed. Final response generated.`);
        finalAiResponse = response;
        break;
      }
    }

    let finalContentStr = '';
    if (typeof finalAiResponse.content === 'string') {
      finalContentStr = finalAiResponse.content;
    } else if (Array.isArray(finalAiResponse.content)) {
      finalContentStr = finalAiResponse.content.filter(p => p.type === 'text').map(p => p.text).join('\n');
    }

    // --- Save Episode to ChromaDB Asynchronously ---
    saveEpisode(userId.toString(), content, finalContentStr, currentSessionId).catch(err => {
      console.error("Error saving episode asynchronously:", err);
    });

    res.json({
      role: 'assistant',
      content: finalContentStr,
      sessionId: currentSessionId,
    });
  } catch (error) {
    next(error);
  }
};

export { getSessions, createSession, updateSessionTitle, deleteSession, getChatHistory, sendMessage };
