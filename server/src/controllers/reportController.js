import User from '../models/User.js';
import MarketScan from '../models/MarketScan.js';
import Product from '../models/Product.js';
import Report from '../models/Report.js';
import { generateMarketReport } from '../services/aiService.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * POST /api/scans/:id/report — Generate an AI report for a completed scan.
 */
export const createReport = async (req, res, next) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) throw new AppError('User not found.', 401);

    const scan = await MarketScan.findById(req.params.id).lean();
    if (!scan) throw new AppError('Scan not found.', 404);
    if (scan.userId.toString() !== user._id.toString()) {
      throw new AppError('Access denied.', 403);
    }
    if (scan.status !== 'completed') {
      throw new AppError('Scan must be completed before generating a report.', 400);
    }

    // Get sample products for AI context
    const products = await Product.find({ scanId: scan._id })
      .sort({ rating: -1 })
      .limit(15)
      .lean();

    const sampleProducts = products.map((p) => ({
      title: p.title,
      price: p.price,
      merchant: p.merchant,
      rating: p.rating,
      reviewCount: p.reviewCount,
    }));

    // Generate AI report
    const reportData = await generateMarketReport({
      query: scan.query,
      country: scan.country,
      analysisResults: scan.scanResults || {},
      sampleProducts,
      opportunities: scan.scanResults?.opportunities || [],
      relatedSearches: scan.scanResults?.relatedSearches || [],
    });

    // Save report
    const report = await Report.create({
      userId: user._id,
      scanId: scan._id,
      title: `Market Report: ${scan.query}`,
      ...reportData,
      metadata: {
        query: scan.query,
        country: scan.country,
        totalProducts: scan.scanResults?.totalProducts || 0,
        uniqueMerchants: scan.scanResults?.uniqueMerchants || 0,
        scanDate: scan.createdAt,
        generatedAt: new Date(),
      },
    });

    res.status(201).json({ report });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/reports — List the authenticated user's reports.
 */
export const listReports = async (req, res, next) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) throw new AppError('User not found.', 401);

    const reports = await Report.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .select('-rawData')
      .lean();

    res.json({ reports });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/reports/:id — Get a specific report with ownership verification.
 */
export const getReport = async (req, res, next) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) throw new AppError('User not found.', 401);

    const report = await Report.findById(req.params.id).lean();
    if (!report) throw new AppError('Report not found.', 404);
    if (report.userId.toString() !== user._id.toString()) {
      throw new AppError('Access denied.', 403);
    }

    res.json({ report });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/reports/:id — Delete a report.
 */
export const deleteReport = async (req, res, next) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) throw new AppError('User not found.', 401);

    const report = await Report.findById(req.params.id);
    if (!report) throw new AppError('Report not found.', 404);
    if (report.userId.toString() !== user._id.toString()) {
      throw new AppError('Access denied.', 403);
    }

    await report.deleteOne();
    res.json({ message: 'Report deleted successfully.' });
  } catch (error) {
    next(error);
  }
};
