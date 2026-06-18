import axiosClient from './axiosClient';

export const getHistory = async (sessionId) => {
  const url = sessionId ? `/chat/history?sessionId=${sessionId}` : '/chat/history';
  const { data } = await axiosClient.get(url);
  return data;
};

export const sendMessage = async (content, sessionId) => {
  const { data } = await axiosClient.post('/chat/message', { content, sessionId });
  return data;
};
