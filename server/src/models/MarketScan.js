import mongoose from 'mongoose';

const marketScanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    query: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      default: '',
    },
    country: {
      type: String,
      required: true,
      default: 'in',
    },
    minPrice: {
      type: Number,
      default: null,
    },
    maxPrice: {
      type: Number,
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'searching', 'analyzing', 'completed', 'failed'],
      default: 'pending',
    },
    searchParams: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    scanResults: {
      isLive: {
        type: Boolean,
        default: false,
      },
      dataSource: {
        type: String,
        default: '',
      },
      totalProducts: Number,
      uniqueMerchants: Number,
      priceStats: {
        min: Number,
        max: Number,
        average: Number,
        median: Number,
        stdDev: Number,
      },
      priceDistribution: [
        {
          range: String,
          min: Number,
          max: Number,
          count: Number,
        },
      ],
      ratingStats: {
        average: Number,
        distribution: mongoose.Schema.Types.Mixed,
      },
      topMerchants: [
        {
          name: String,
          count: Number,
        },
      ],
      featureFrequency: [
        {
          feature: String,
          count: Number,
          percentage: Number,
        },
      ],
      competitionLevel: {
        score: Number,
        label: String,
        description: String,
      },
      opportunities: [
        {
          title: String,
          description: String,
          evidence: String,
          confidence: {
            type: String,
            enum: ['high', 'medium', 'low'],
          },
          supportingProducts: [String],
        },
      ],
      opportunityMap: {
        points: [
          {
            id: String,
            title: String,
            price: Number,
            rating: Number,
            reviewCount: Number,
            merchant: String,
            productUrl: String,
            imageUrl: String,
            currency: String,
            weight: Number,
          },
        ],
        whitespaceZones: [
          {
            bandLabel: String,
            priceMin: Number,
            priceMax: Number,
            ratingThreshold: Number,
            competitorCount: Number,
            avgDensity: Number,
            ratingBand: String,
            rationale: String,
            sampleProductId: String,
            supportingProducts: [
              {
                id: String,
                title: String,
                price: Number,
                rating: Number,
                merchant: String,
              },
            ],
          },
        ],
        stats: {
          totalProducts: Number,
          pricedProducts: Number,
          ratedProducts: Number,
          medianPrice: Number,
          medianRating: Number,
        },
      },
      radarScorecard: {
        axes: [
          {
            axis: String,
            value: Number,
            higherMeans: String,
          },
        ],
        summary: {
          totalProducts: Number,
          uniqueMerchants: Number,
          fieldsComplete: Number,
        },
      },
      featureGap: {
        tableStakes: [
          {
            feature: String,
            count: Number,
            percentage: Number,
            category: String,
            interpretation: String,
          },
        ],
        differentiatorGaps: [
          {
            feature: String,
            count: Number,
            percentage: Number,
            category: String,
            interpretation: String,
          },
        ],
        totalProducts: Number,
        uniqueFeatureCount: Number,
      },
      relatedSearches: [String],
      trendSignals: [
        {
          keyword: String,
          trendDirection: {
            type: String,
            enum: ['rising', 'stable', 'declining', 'unknown'],
          },
          supportingData: mongoose.Schema.Types.Mixed,
        },
      ],
    },
    errorMessage: {
      type: String,
      default: '',
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for user's scans sorted by date
marketScanSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model('MarketScan', marketScanSchema);
