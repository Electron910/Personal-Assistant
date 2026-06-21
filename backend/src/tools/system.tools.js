import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { spawn } from 'child_process';

export const getSystemTools = () => {
  const openApplicationTool = tool(
    async ({ target, type }) => {
      try {
        let spawnArgs = [];

        if (type === 'url') {

          const urlPattern = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/i;
          if (!urlPattern.test(target)) {
            return `Error: Security block - Invalid or unsafe URL format: '${target}'. Only valid http/https URLs are allowed.`;
          }

          spawnArgs = ['/c', 'start', '""', target];
        } else if (type === 'app') {

          if (/[&|;`$()<>]/.test(target)) {
            return `Error: Security block - Target contains unsafe characters.`;
          }

          const cleanTarget = target.trim();


          const appMap = {
            'spotify': 'spotify:',
            'whatsapp': 'whatsapp:',
            'discord': 'discord:',
            'telegram': 'tg:',
            'zoom': 'zoommtg:',
            'slack': 'slack:',
            'vscode': 'code',
            'calculator': 'calc',
            'chrome': 'chrome',
            'edge': 'msedge'
          };

          const safeApp = appMap[cleanTarget.toLowerCase()] || cleanTarget;


          spawnArgs = ['/c', 'start', '""', safeApp];
        } else {
          return `Error: Invalid type. Must be 'url' or 'app'.`;
        }


        const child = spawn('cmd.exe', spawnArgs, {
          detached: true,
          stdio: 'ignore'
        });

        child.unref();

        return `Successfully opened ${type}: '${target}'`;
      } catch (error) {
        return `Error opening ${type}: ${error.message}`;
      }
    },
    {
      name: 'open_application',
      description: "Opens a system application (like VS Code, Spotify) or a specific web URL (like https://youtube.com) securely in the user's OS.",
      schema: z.object({
        target: z.string().describe('The name of the app (e.g., "vscode", "spotify") or the valid HTTP/HTTPS URL (e.g., "https://youtube.com").'),
        type: z.enum(['url', 'app']).describe('The type of target being opened.'),
      }),
    }
  );

  return [openApplicationTool];
};
