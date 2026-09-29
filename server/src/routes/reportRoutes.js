import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { listReports, getReport, deleteReport } from '../controllers/reportController.js';

const router = Router();

// All report routes require authentication
router.use(authMiddleware);

// GET    /api/reports           — List user's reports
router.get('/', listReports);

// GET    /api/reports/:id       — Get report details
router.get('/:id', getReport);

// DELETE /api/reports/:id       — Delete report
router.delete('/:id', deleteReport);

export default router;
