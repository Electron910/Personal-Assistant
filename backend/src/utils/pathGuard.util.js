import path from 'path';
import fs from 'fs';


export const getSafeFilePath = (userId, requestedPath) => {
  
  const baseDir = path.resolve(process.cwd(), `storage/users/${userId}/files`);
  
  
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
  }

  
  const resolvedPath = path.resolve(baseDir, requestedPath);

  
  
  if (!resolvedPath.startsWith(baseDir)) {
    throw new Error('Path traversal detected. Access denied.');
  }

  return resolvedPath;
};

export const getUserBaseDir = (userId) => {
  const baseDir = path.resolve(process.cwd(), `storage/users/${userId}/files`);
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
  }
  return baseDir;
};
