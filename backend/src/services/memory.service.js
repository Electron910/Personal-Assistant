import CoreMemory from '../models/CoreMemory.js';
import Message from '../models/Message.js';
import Session from '../models/Session.js';

export const getShortTermMemory = async (sessionId, userId, limit = 15) => {
  try {
    const messages = await Message.find({ user: userId, session: sessionId })
      .sort('-createdAt')
      .limit(limit);
    return messages.reverse();
  } catch (error) {
    return [];
  }
};

export const getLongTermMemory = async (userId) => {
  try {
    const coreMemories = await CoreMemory.find({ user: userId });
    return coreMemories.map(m => m.content);
  } catch (error) {
    return [];
  }
};

export const addLongTermMemory = async (userId, content) => {
  try {
    const memory = await CoreMemory.create({ user: userId, content });
    return memory;
  } catch (error) {
    return null;
  }
};

export const clearShortTermMemory = async (sessionId, userId) => {
  try {
    await Message.deleteMany({ session: sessionId, user: userId });
    return true;
  } catch (error) {
    return false;
  }
};
