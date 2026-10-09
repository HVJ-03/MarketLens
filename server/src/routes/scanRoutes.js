import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { createScan, listScans, getScan, deleteScan, getScanProducts, compareScans } from '../controllers/scanController.js';
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

// GET    /api/scans/:id/products   — Full product listings (evidence, X-Ray, simulator)
router.get('/:id/products', getScanProducts);

// POST   /api/scans/compare        — Multi-market regional comparison
router.post('/compare', compareScans);

// DELETE /api/scans/:id           — Delete scan and associated data
router.delete('/:id', deleteScan);

// POST   /api/scans/:id/report   — Generate AI report for a scan
router.post('/:id/report', createReport);

export default router;
