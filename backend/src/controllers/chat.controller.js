import Message from '../models/Message.js';
import Session from '../models/Session.js';
import { getModelWithTools } from '../services/llm.service.js';
import { queryEpisodes, saveEpisode } from '../services/episodic.service.js';
import { summarizeSession } from '../services/summary.service.js';
import { HumanMessage, AIMessage, ToolMessage, SystemMessage } from '@langchain/core/messages';
import { getExactCache, setExactCache, getSemanticCache, setSemanticCache, getPromptCache, setPromptCache } from '../services/cache.service.js';
import { getShortTermMemory, getLongTermMemory } from '../services/memory.service.js';

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

const getSessions = async (req, res, next) => {
  try {
    const sessions = await Session.find({ user: req.user._id }).sort('-updatedAt');
    res.json(sessions);
  } catch (error) {
    next(error);
  }
};

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

    if (!currentSessionId) {
      session = await Session.create({
        user: userId,
        title: content.substring(0, 30) + (content.length > 30 ? '...' : ''),
      });
      currentSessionId = session._id;
    } else {
      session = await Session.findOne({ _id: currentSessionId, user: userId });
      if (!session) {
        res.status(404);
        throw new Error('Session not found');
      }
    }

    const exactCacheRes = await getExactCache(content);
    if (exactCacheRes) {
      await Message.create({ user: userId, session: currentSessionId, role: 'user', content });
      await Message.create({ user: userId, session: currentSessionId, role: 'assistant', content: exactCacheRes });
      return res.json({ role: 'assistant', content: exactCacheRes, sessionId: currentSessionId });
    }

    const semanticCacheRes = await getSemanticCache(content);
    if (semanticCacheRes) {
      await Message.create({ user: userId, session: currentSessionId, role: 'user', content });
      await Message.create({ user: userId, session: currentSessionId, role: 'assistant', content: semanticCacheRes });
      return res.json({ role: 'assistant', content: semanticCacheRes, sessionId: currentSessionId });
    }

    const userDbMsg = await Message.create({
      user: userId,
      session: currentSessionId,
      role: 'user',
      content
    });

    const longTermMemories = await getLongTermMemory(userId);
    const coreMemoryText = longTermMemories.length > 0
      ? longTermMemories.map(m => `- ${m}`).join('\n')
      : 'No explicitly saved facts yet.';

    const relevantPastEpisodes = await queryEpisodes(userId, content);
    const episodicMemoryText = relevantPastEpisodes.length > 0
      ? relevantPastEpisodes.join('\n\n')
      : 'No highly relevant past conversations found.';

    let allDbMessages = await getShortTermMemory(currentSessionId, userId, 30);
    const MAX_UNSUMMARIZED_MESSAGES = 15;

    if (allDbMessages.length > MAX_UNSUMMARIZED_MESSAGES) {
      const messagesToSummarizeCount = Math.floor(allDbMessages.length / 2);
      const messagesToSummarize = allDbMessages.slice(0, messagesToSummarizeCount);
      const newSummary = await summarizeSession(currentSessionId, messagesToSummarize, session.summary);
      session.summary = newSummary;
      await session.save();
      allDbMessages = allDbMessages.slice(messagesToSummarizeCount);
    }

    const lcMessages = convertDbToLangChainMessages(allDbMessages);

    let systemPromptContent =
      "You are an Autonomous System Agent and Personal Assistant. " +
      "TOOL USAGE RULE: You MUST answer the user's question using your own internal knowledge first. NEVER use the `open_application` tool to perform a web search for the user unless they explicitly ask you to open a browser or search the web. ONLY use tools if your internal knowledge is completely insufficient or if the user explicitly commands you to perform a system action (like opening an app, fetching data, or editing a file).\n" +
      "If the user asks you to read, edit, or delete a file without providing its absolute path, you MUST autonomously use the `search_system_files` tool to find it first. " +
      "Once you find the absolute path, you may proceed with the requested action (read/edit/delete). " +
      "You have the `open_application` tool to launch any apps or URLs the user requests (e.g., 'Open VS Code', 'Play Spotify', 'Go to YouTube'). " +
      "CRITICAL SPEED RULE: DO NOT use `search_system_files` to find applications! If the user says 'open [app]', directly use `open_application` with the app name. Only search for actual files (like .pdf, .txt, .js). " +
      "TRANSPARENCY RULE: In your final response to the user, ALWAYS start by briefly listing exactly what actions/tools you performed behind the scenes (e.g., 'I searched your Downloads folder and found 3 files, then I opened Spotify.').\n\n";

    systemPromptContent += `### CORE MEMORIES\n${coreMemoryText}\n\n`;
    systemPromptContent += `### EPISODIC MEMORIES\n${episodicMemoryText}\n\n`;

    if (session.summary) {
      systemPromptContent += `### CURRENT SESSION SUMMARY\n${session.summary}\n\n`;
    }

    const systemPrompt = new SystemMessage(systemPromptContent);

    const promptCacheRes = await getPromptCache(systemPromptContent + content);
    if (promptCacheRes) {
      await Message.create({ user: userId, session: currentSessionId, role: 'assistant', content: promptCacheRes });
      return res.json({ role: 'assistant', content: promptCacheRes, sessionId: currentSessionId });
    }

    const { modelWithTools, tools } = getModelWithTools(userId.toString());

    let currentMessages = [systemPrompt, ...lcMessages];
    let finalAiResponse = null;

    while (true) {
      const response = await modelWithTools.invoke(currentMessages);
      currentMessages.push(response);

      let contentStr = '';
      if (typeof response.content === 'string') {
        contentStr = response.content;
      } else if (Array.isArray(response.content)) {
        contentStr = response.content.filter(p => p.type === 'text').map(p => p.text).join('\n');
      }

      const aiDbMsg = await Message.create({
        user: userId,
        session: currentSessionId,
        role: 'assistant',
        content: contentStr,
        tool_calls: response.tool_calls || []
      });

      if (response.tool_calls && response.tool_calls.length > 0) {
        for (const toolCall of response.tool_calls) {
          const selectedTool = tools.find(t => t.name === toolCall.name);
          if (selectedTool) {
            let toolResult;
            try {
              toolResult = await selectedTool.invoke(toolCall.args);
            } catch (err) {
              toolResult = `Error: ${err.message}`;
            }

            const toolMsg = new ToolMessage({
              content: typeof toolResult === 'string' ? toolResult : JSON.stringify(toolResult),
              tool_call_id: toolCall.id,
              name: toolCall.name,
            });

            currentMessages.push(toolMsg);

            await Message.create({
              user: userId,
              session: currentSessionId,
              role: 'tool',
              content: toolMsg.content,
              tool_call_id: toolMsg.tool_call_id,
              name: toolMsg.name
            });
          }
        }
      } else {
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

    await setExactCache(content, finalContentStr);
    await setSemanticCache(content, finalContentStr);
    await setPromptCache(systemPromptContent + content, finalContentStr);

    saveEpisode(userId.toString(), content, finalContentStr, currentSessionId).catch(err => {
      console.error(err);
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
