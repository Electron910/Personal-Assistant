import axiosClient from './axiosClient';

export const login = async (email, password) => {
  const { data } = await axiosClient.post('/auth/login', { email, password });
  return data;
};

export const signup = async (email, password) => {
  const { data } = await axiosClient.post('/auth/signup', { email, password });
  return data;
};

export const logout = async () => {
  const { data } = await axiosClient.post('/auth/logout');
  return data;
};

export const getProfile = async () => {
  const { data } = await axiosClient.get('/auth/profile');
  return data;
};
