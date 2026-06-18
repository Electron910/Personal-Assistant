import express from 'express';
import { uploadDocument } from '../controllers/document.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import upload from '../middleware/upload.middleware.js';

const router = express.Router();

router.use(protect); // Require authentication

router.route('/upload').post(upload.single('document'), uploadDocument);

export default router;
