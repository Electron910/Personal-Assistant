import axiosClient from './axiosClient';

export const uploadDocument = async (file) => {
  const formData = new FormData();
  formData.append('document', file);

  const { data } = await axiosClient.post('/document/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return data;
};
