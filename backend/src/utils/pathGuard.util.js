import path from 'path';
import fs from 'fs';

/**
 * Resolves a requested filename to an absolute path within the user's sandboxed storage directory.
 * Prevents path traversal attacks.
 * 
 * @param {string} userId - The user's ID
 * @param {string} requestedPath - The file path requested by the LLM
 * @returns {string} The safely resolved absolute path
 * @throws {Error} If the path resolves outside the sandbox
 */
export const getSafeFilePath = (userId, requestedPath) => {
  // Define the base directory for the user
  const baseDir = path.resolve(process.cwd(), `storage/users/${userId}/files`);
  
  // Ensure the base directory exists
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
  }

  // Resolve the requested path against the base directory
  const resolvedPath = path.resolve(baseDir, requestedPath);

  // Check if the resolved path still starts with the base directory
  // path.resolve normalizes paths and resolves '..' segments.
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
