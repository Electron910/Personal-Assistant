import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import CoreMemory from '../models/CoreMemory.js';

export const getMemoryTools = (userId) => {
  return [
    new DynamicStructuredTool({
      name: 'save_core_memory',
      description: 'Use this tool to save a new fact or preference about the user to their core memory. This fact will be retrieved automatically in future conversations. Examples: "The user\'s favorite color is blue", "The user is allergic to peanuts".',
      schema: z.object({
        fact: z.string().describe('The fact to remember.'),
      }),
      func: async ({ fact }) => {
        try {
          await CoreMemory.create({ user: userId, content: fact });
          return `Successfully saved memory: "${fact}"`;
        } catch (error) {
          return `Failed to save memory: ${error.message}`;
        }
      },
    }),
    new DynamicStructuredTool({
      name: 'delete_core_memory',
      description: 'Use this tool to delete an existing fact from the user\'s core memory if it is no longer true or relevant. You MUST provide the exact content or ID of the memory to delete.',
      schema: z.object({
        fact: z.string().describe('The exact text of the fact to delete.'),
      }),
      func: async ({ fact }) => {
        try {
          const result = await CoreMemory.findOneAndDelete({ user: userId, content: fact });
          if (result) {
            return `Successfully deleted memory: "${fact}"`;
          } else {
            return `Memory not found: "${fact}". Make sure to provide the exact text.`;
          }
        } catch (error) {
          return `Failed to delete memory: ${error.message}`;
        }
      },
    }),
  ];
};
