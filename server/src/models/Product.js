import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    scanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MarketScan',
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: '',
    },
    price: {
      type: Number,
      default: null,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    rating: {
      type: Number,
      default: null,
    },
    reviewCount: {
      type: Number,
      default: null,
    },
    merchant: {
      type: String,
      default: '',
    },
    source: {
      type: String,
      default: 'google_shopping',
    },
    productUrl: {
      type: String,
      default: '',
    },
    imageUrl: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
    features: {
      type: [String],
      default: [],
    },
    rawData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Product', productSchema);
