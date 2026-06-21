import express from 'express';
import { getSessions, createSession, updateSessionTitle, deleteSession, getChatHistory, sendMessage } from '../controllers/chat.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect); 

router.route('/sessions').get(getSessions).post(createSession);
router.route('/sessions/:id').put(updateSessionTitle).delete(deleteSession);

router.route('/history').get(getChatHistory);
router.route('/message').post(sendMessage);

export default router;
