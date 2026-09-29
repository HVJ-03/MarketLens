import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { createScan, listScans, getScan, deleteScan } from '../controllers/scanController.js';
import { createReport } from '../controllers/reportController.js';

const router = Router();

// All scan routes require authentication
router.use(authMiddleware);

// POST   /api/scans              — Create & execute a new market scan
router.post('/', createScan);

// GET    /api/scans               — List user's scans
router.get('/', listScans);

// GET    /api/scans/:id           — Get scan details
router.get('/:id', getScan);

// DELETE /api/scans/:id           — Delete scan and associated data
router.delete('/:id', deleteScan);

// POST   /api/scans/:id/report   — Generate AI report for a scan
router.post('/:id/report', createReport);

export default router;
