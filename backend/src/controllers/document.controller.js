import { ingestDocument } from '../services/ingestion.service.js';

// @desc    Upload and ingest a document
// @route   POST /api/document/upload
// @access  Private
const uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400);
      throw new Error('Please upload a file');
    }

    const userId = req.user._id;
    const filePath = req.file.path;

    const result = await ingestDocument(userId.toString(), filePath);

    res.status(200).json({
      message: 'Document ingested successfully',
      chunksAdded: result.chunks,
    });
  } catch (error) {
    next(error);
  }
};

export { uploadDocument };
