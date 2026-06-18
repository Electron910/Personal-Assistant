import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { DocxLoader } from '@langchain/community/document_loaders/fs/docx';
import { Document } from '@langchain/core/documents';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { getUserVectorStore } from './vectorstore.service.js';
import fs from 'fs';
import path from 'path';

export const ingestDocument = async (userId, filePath) => {
  try {
    const ext = path.extname(filePath).toLowerCase();
    let loader;

    if (ext === '.pdf') {
      loader = new PDFLoader(filePath);
    } else if (ext === '.docx' || ext === '.doc') {
      loader = new DocxLoader(filePath);
    } else if (ext === '.txt') {
      loader = {
        load: async () => {
          const text = fs.readFileSync(filePath, 'utf-8');
          return [new Document({ pageContent: text, metadata: { source: filePath } })];
        }
      };
    } else {
      throw new Error('Unsupported file type');
    }

    const docs = await loader.load();

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 150,
    });

    const splitDocs = await splitter.splitDocuments(docs);

    // Sanitize metadata: ChromaDB only accepts strings, numbers, and booleans.
    const cleanedDocs = splitDocs.map(doc => {
      const safeMetadata = {};
      for (const [key, value] of Object.entries(doc.metadata)) {
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          safeMetadata[key] = value;
        }
      }
      return new Document({
        pageContent: doc.pageContent,
        metadata: safeMetadata
      });
    });

    const vectorStore = await getUserVectorStore(userId);
    await vectorStore.addDocuments(cleanedDocs);

    // Clean up uploaded file
    fs.unlinkSync(filePath);

    return { success: true, chunks: splitDocs.length };
  } catch (error) {
    // Clean up on error as well
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    throw error;
  }
};
