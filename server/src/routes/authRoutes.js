import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { getMe, syncUser } from '../controllers/authController.js';

const router = Router();

// All auth routes require authentication
router.use(authMiddleware);

// GET  /api/auth/me   — Get current user profile from MongoDB
router.get('/me', getMe);

// POST /api/auth/sync — Sync Firebase user to MongoDB
router.post('/sync', syncUser);

export default router;
