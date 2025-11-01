import mongoose from 'mongoose';

const NewsSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    summary: {
      type: String,
      required: true,
      minlength: 30,
      maxlength: 1000,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    sourceName: {
      type: String,
      default: 'Inshorts',
    },
    sourceUrl: {
      type: String,
    },
    isTrending: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft',
    },
    publishedAt: {
      type: Date,
      default: Date.now,
    },
    createdBy: {
      type: String,
      default: 'Admin',
    },
  },
  { timestamps: true }
);

export default mongoose.model('News', NewsSchema);
