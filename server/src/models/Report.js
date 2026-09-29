import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    scanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MarketScan',
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    executiveSummary: {
      type: String,
      default: '',
    },
    marketOverview: {
      type: String,
      default: '',
    },
    competitionAnalysis: {
      type: String,
      default: '',
    },
    pricingAnalysis: {
      type: String,
      default: '',
    },
    trendAnalysis: {
      type: String,
      default: '',
    },
    opportunitySignals: [
      {
        title: String,
        description: String,
        evidence: String,
        confidence: String,
      },
    ],
    risks: [
      {
        title: String,
        description: String,
      },
    ],
    keyObservations: {
      type: [String],
      default: [],
    },
    limitations: {
      type: [String],
      default: [],
    },
    metadata: {
      query: String,
      country: String,
      totalProducts: Number,
      uniqueMerchants: Number,
      scanDate: Date,
      generatedAt: Date,
    },
  },
  {
    timestamps: true,
  }
);

reportSchema.index({ userId: 1, createdAt: -1 });
reportSchema.index({ scanId: 1 });

export default mongoose.model('Report', reportSchema);
