import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { getSafeFilePath, getUserBaseDir } from '../utils/pathGuard.util.js';

export const getFileTools = (userId) => {
  const createFileTool = tool(
    async ({ filename, content }) => {
      try {
        const safePath = getSafeFilePath(userId, filename);
        fs.writeFileSync(safePath, content, 'utf8');
        return `File '${filename}' created successfully.`;
      } catch (error) {
        return `Error creating file: ${error.message}`;
      }
    },
    {
      name: 'create_file',
      description: 'Create a new file with the specified name and content.',
      schema: z.object({
        filename: z.string().describe('The name of the file to create (e.g., notes.txt).'),
        content: z.string().describe('The textual content to write to the file.'),
      }),
    }
  );

  const readFileTool = tool(
    async ({ filename }) => {
      try {
        const safePath = getSafeFilePath(userId, filename);
        if (!fs.existsSync(safePath)) {
          return `Error: File '${filename}' does not exist.`;
        }
        const content = fs.readFileSync(safePath, 'utf8');
        return `Content of '${filename}':\n${content}`;
      } catch (error) {
        return `Error reading file: ${error.message}`;
      }
    },
    {
      name: 'read_file',
      description: 'Read the contents of an existing file.',
      schema: z.object({
        filename: z.string().describe('The name of the file to read.'),
      }),
    }
  );

  const deleteFileTool = tool(
    async ({ filename }) => {
      try {
        const safePath = getSafeFilePath(userId, filename);
        if (!fs.existsSync(safePath)) {
          return `Error: File '${filename}' does not exist.`;
        }
        fs.unlinkSync(safePath);
        return `File '${filename}' deleted successfully.`;
      } catch (error) {
        return `Error deleting file: ${error.message}`;
      }
    },
    {
      name: 'delete_file',
      description: 'Delete an existing file.',
      schema: z.object({
        filename: z.string().describe('The name of the file to delete.'),
      }),
    }
  );

  const listFilesTool = tool(
    async () => {
      try {
        const baseDir = getUserBaseDir(userId);
        const files = fs.readdirSync(baseDir);
        if (files.length === 0) {
          return 'No files found.';
        }
        return `Files:\n${files.join('\n')}`;
      } catch (error) {
        return `Error listing files: ${error.message}`;
      }
    },
    {
      name: 'list_files',
      description: 'List all files available in the user storage.',
      schema: z.object({}),
    }
  );

  const readSystemFileTool = tool(
    async ({ absolute_path }) => {
      try {
        if (!fs.existsSync(absolute_path)) {
          return `Error: File at '${absolute_path}' does not exist.`;
        }

        const ext = path.extname(absolute_path).toLowerCase();
        
        if (ext === '.pdf') {
          const loader = new PDFLoader(absolute_path, { splitPages: false });
          const docs = await loader.load();
          return `Content of PDF '${absolute_path}':\n\n${docs.map(d => d.pageContent).join('\n')}`;
        } else {
          const content = fs.readFileSync(absolute_path, 'utf8');
          return `Content of '${absolute_path}':\n${content}`;
        }
      } catch (error) {
        return `Error reading system file: ${error.message}`;
      }
    },
    {
      name: 'read_system_file',
      description: 'Reads the content of a system file given its absolute path. ONLY use this when explicitly asked by the user to read a specific file path. BEFORE using this tool, you must ask the user for permission to read the file.',
      schema: z.object({
        absolute_path: z.string().describe('The absolute path of the file to read on the system.'),
      }),
    }
  );

  const deleteSystemFileTool = tool(
    async ({ absolute_path }) => {
      try {
        if (!fs.existsSync(absolute_path)) {
          return `Error: File at '${absolute_path}' does not exist.`;
        }
        fs.unlinkSync(absolute_path);
        return `System file '${absolute_path}' deleted successfully.`;
      } catch (error) {
        return `Error deleting system file: ${error.message}`;
      }
    },
    {
      name: 'delete_system_file',
      description: 'Deletes a system file given its absolute path. ONLY use this when explicitly asked by the user to delete a specific file. BEFORE using this tool, you must ask the user for permission.',
      schema: z.object({
        absolute_path: z.string().describe('The absolute path of the file to delete on the system.'),
      }),
    }
  );

  const createSystemFileTool = tool(
    async ({ absolute_path, content }) => {
      try {
        
        const dir = path.dirname(absolute_path);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(absolute_path, content, 'utf8');
        return `System file '${absolute_path}' created successfully.`;
      } catch (error) {
        return `Error creating system file: ${error.message}`;
      }
    },
    {
      name: 'create_system_file',
      description: 'Creates a new system file with the specified content at a given absolute path. ONLY use this when explicitly asked by the user to create a file at a specific system location. BEFORE using this tool, you must ask the user for permission.',
      schema: z.object({
        absolute_path: z.string().describe('The absolute path of the file to create on the system.'),
        content: z.string().describe('The textual content to write to the file.'),
      }),
    }
  );

  const editSystemFileTool = tool(
    async ({ absolute_path, operation, content, target_string }) => {
      try {
        if (!fs.existsSync(absolute_path)) {
          return `Error: File at '${absolute_path}' does not exist. Cannot edit a non-existent file.`;
        }
        
        if (operation === 'overwrite') {
          fs.writeFileSync(absolute_path, content, 'utf8');
        } else if (operation === 'append') {
          fs.appendFileSync(absolute_path, '\n' + content, 'utf8');
        } else if (operation === 'replace_string') {
          if (!target_string) return `Error: target_string is required for replace_string operation.`;
          const currentContent = fs.readFileSync(absolute_path, 'utf8');
          const newContent = currentContent.replace(target_string, content);
          fs.writeFileSync(absolute_path, newContent, 'utf8');
        } else {
          return `Error: Invalid operation '${operation}'.`;
        }
        
        return `System file '${absolute_path}' edited successfully using operation '${operation}'.`;
      } catch (error) {
        return `Error editing system file: ${error.message}`;
      }
    },
    {
      name: 'edit_system_file',
      description: 'Edits an existing system file. Supports overwriting the file, appending to it, or replacing a specific string. ONLY use this when explicitly asked to edit or modify a specific file.',
      schema: z.object({
        absolute_path: z.string().describe('The absolute path of the file to edit on the system.'),
        operation: z.enum(['overwrite', 'append', 'replace_string']).describe('The editing operation to perform.'),
        content: z.string().describe('The completely new textual content (if overwrite), or the content to append (if append), or the replacement string (if replace_string).'),
        target_string: z.string().optional().describe('The exact string to be replaced (required ONLY if operation is replace_string).'),
      }),
    }
  );

  const getFileMetadataTool = tool(
    async ({ absolute_path }) => {
      try {
        if (!fs.existsSync(absolute_path)) {
          return `Error: File at '${absolute_path}' does not exist.`;
        }
        const stats = fs.statSync(absolute_path);
        return JSON.stringify({
          size_bytes: stats.size,
          created_at: stats.birthtime,
          modified_at: stats.mtime,
          is_directory: stats.isDirectory()
        }, null, 2);
      } catch (error) {
        return `Error getting metadata: ${error.message}`;
      }
    },
    {
      name: 'get_file_metadata',
      description: 'Retrieves metadata (size, creation date, modification date) for a specific file or directory.',
      schema: z.object({
        absolute_path: z.string().describe('The absolute path of the file/directory.'),
      }),
    }
  );

  const searchSystemFilesTool = tool(
    async ({ search_query, target_directory }) => {
      try {
        const homeDir = os.homedir();
        let baseDir = homeDir; 
        
        
        const lowerDir = (target_directory || '').toLowerCase();
        if (lowerDir.includes('download')) baseDir = path.join(homeDir, 'Downloads');
        else if (lowerDir.includes('desktop')) baseDir = path.join(homeDir, 'Desktop');
        else if (lowerDir.includes('document')) baseDir = path.join(homeDir, 'Documents');
        else if (path.isAbsolute(target_directory)) {
            baseDir = target_directory;
        }

        if (!fs.existsSync(baseDir)) {
          return `Error: Directory '${baseDir}' does not exist.`;
        }

        const results = [];
        let count = 0;
        const maxResults = 50;
        const maxDepth = 6;
        const query = search_query.toLowerCase();

        const walkAsync = async (dir, depth = 0) => {
          if (count >= maxResults || depth > maxDepth) return;
          try {
            const files = await fs.promises.readdir(dir, { withFileTypes: true });
            for (const dirent of files) {
              if (count >= maxResults) return;
              
              const file = dirent.name;
              
              if (file.toLowerCase() === 'windows' || file === 'node_modules' || file === '.git' || file === 'appdata' || file.startsWith('.')) continue;

              const fullPath = path.join(dir, file);
              
              if (dirent.isDirectory()) {
                await walkAsync(fullPath, depth + 1);
              } else {
                if (file.toLowerCase().includes(query)) {
                  results.push(fullPath);
                  count++;
                }
              }
            }
          } catch (err) {
            
          }
        };

        await walkAsync(baseDir);

        if (results.length === 0) {
          return `No files found matching '${search_query}' in '${baseDir}'.`;
        }
        return `Found ${results.length} files matching '${search_query}' in '${baseDir}':\n${results.join('\n')}\n\nNote: Search was limited to depth ${maxDepth} and ${maxResults} results.`;
      } catch (error) {
        return `Error searching files: ${error.message}`;
      }
    },
    {
      name: 'search_system_files',
      description: 'Searches for files by name/extension anywhere on the system. Use this to find a file when you only know its name but not its exact absolute path. Returns a list of absolute paths.',
      schema: z.object({
        search_query: z.string().describe('The filename, extension, or partial string to search for (e.g., "resume.pdf", ".pdf", "project").'),
        target_directory: z.string().optional().describe('Optional specific directory to search in. Defaults to the C:\\ drive to search the entire system.'),
      }),
    }
  );

  return [createFileTool, readFileTool, deleteFileTool, listFilesTool, readSystemFileTool, deleteSystemFileTool, createSystemFileTool, editSystemFileTool, getFileMetadataTool, searchSystemFilesTool];
};
