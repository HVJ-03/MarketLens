import User from '../models/User.js';
import MarketScan from '../models/MarketScan.js';
import Product from '../models/Product.js';
import { searchGoogleShopping, searchRelatedQueries } from '../services/serpApiService.js';
import { normalizeShoppingResults } from '../services/dataNormalizer.js';
import { analyzeScan } from '../services/marketAnalysisService.js';
import { identifyOpportunities } from '../services/opportunityService.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * POST /api/scans — Create and execute a new market scan.
 */
export const createScan = async (req, res, next) => {
  try {
    const { query, country, minPrice, maxPrice } = req.body;

    // Validation
    if (!query || !query.trim()) {
      throw new AppError('Product or category query is required.', 400);
    }
    if (!country) {
      throw new AppError('Country/market is required.', 400);
    }
    if (minPrice != null && maxPrice != null && Number(minPrice) > Number(maxPrice)) {
      throw new AppError('Minimum price cannot exceed maximum price.', 400);
    }

    // Get MongoDB user
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) {
      throw new AppError('User not found. Please sign in again.', 401);
    }

    // Create scan
    const scan = await MarketScan.create({
      userId: user._id,
      query: query.trim(),
      country,
      minPrice: minPrice != null ? Number(minPrice) : null,
      maxPrice: maxPrice != null ? Number(maxPrice) : null,
      status: 'pending',
      searchParams: { query: query.trim(), country, minPrice, maxPrice },
    });

    // Execute scan pipeline asynchronously (don't await — return scan immediately)
    executeScanPipeline(scan._id, scan).catch((err) => {
      console.error(`Scan pipeline failed for ${scan._id}:`, err.message);
    });

    res.status(201).json({ scan });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/scans — List the authenticated user's scans.
 */
export const listScans = async (req, res, next) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) throw new AppError('User not found.', 401);

    const scans = await MarketScan.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.json({ scans });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/scans/:id — Get scan details with ownership verification.
 */
export const getScan = async (req, res, next) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) throw new AppError('User not found.', 401);

    const scan = await MarketScan.findById(req.params.id).lean();
    if (!scan) throw new AppError('Scan not found.', 404);
    if (scan.userId.toString() !== user._id.toString()) {
      throw new AppError('Access denied.', 403);
    }

    res.json({ scan });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/scans/:id — Delete a scan and its products.
 */
export const deleteScan = async (req, res, next) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) throw new AppError('User not found.', 401);

    const scan = await MarketScan.findById(req.params.id);
    if (!scan) throw new AppError('Scan not found.', 404);
    if (scan.userId.toString() !== user._id.toString()) {
      throw new AppError('Access denied.', 403);
    }

    // Delete associated products
    await Product.deleteMany({ scanId: scan._id });
    await scan.deleteOne();

    res.json({ message: 'Scan deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

/**
 * Execute the full scan pipeline:
 * 1. Search via SerpApi
 * 2. Normalize results
 * 3. Store products
 * 4. Run analysis
 * 5. Identify opportunities
 */
async function executeScanPipeline(scanId, scanData) {
  const scan = await MarketScan.findById(scanId);
  if (!scan) return;

  try {
    // Step 1: Searching
    scan.status = 'searching';
    await scan.save();

    const [shoppingData, relatedData] = await Promise.all([
      searchGoogleShopping({
        query: scan.query,
        country: scan.country,
        minPrice: scan.minPrice,
        maxPrice: scan.maxPrice,
      }),
      searchRelatedQueries({
        query: scan.query,
        country: scan.country,
      }),
    ]);

    // Step 2: Normalize
    const normalizedProducts = normalizeShoppingResults(
      shoppingData.shoppingResults,
      scan.country
    );

    if (normalizedProducts.length === 0) {
      scan.status = 'completed';
      scan.scanResults = {
        totalProducts: 0,
        uniqueMerchants: 0,
        priceStats: null,
        priceDistribution: [],
        ratingStats: null,
        topMerchants: [],
        featureFrequency: [],
        competitionLevel: { score: 0, label: 'Unknown', description: 'No products found for this query.' },
        opportunities: [],
        relatedSearches: relatedData.relatedSearches || [],
        trendSignals: [],
      };
      scan.completedAt = new Date();
      await scan.save();
      return;
    }

    // Step 3: Store products
    const productDocs = normalizedProducts.map((p) => ({
      scanId: scan._id,
      ...p,
    }));
    await Product.insertMany(productDocs);

    // Step 4: Analyze
    scan.status = 'analyzing';
    await scan.save();

    const analysisResults = await analyzeScan(scan._id);

    // Step 5: Identify opportunities
    const opportunities = await identifyOpportunities(scan._id, analysisResults);

    // Save all results
    scan.scanResults = {
      ...analysisResults,
      opportunities,
      isLive: !!shoppingData.searchMetadata?.isLive,
      dataSource: shoppingData.searchMetadata?.source || 'SerpApi Live Google Shopping',
      relatedSearches: [
        ...(relatedData.relatedSearches || []),
        ...(shoppingData.relatedSearches || []),
      ].filter((v, i, a) => a.indexOf(v) === i), // deduplicate
      trendSignals: (relatedData.relatedSearches || []).slice(0, 10).map((keyword) => ({
        keyword,
        trendDirection: 'unknown',
        supportingData: {},
      })),
    };
    scan.status = 'completed';
    scan.completedAt = new Date();
    await scan.save();
  } catch (error) {
    console.error(`Scan pipeline error for ${scanId}:`, error.message);
    scan.status = 'failed';
    scan.errorMessage = error.message || 'An unexpected error occurred during the scan.';
    await scan.save();
  }
}
