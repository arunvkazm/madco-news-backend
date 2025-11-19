import mongoose from "mongoose";

const SummaryQueueSchema = new mongoose.Schema(
  {
    newsId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "News",
      required: true,
    },

    content: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "processing"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model("SummaryQueue", SummaryQueueSchema);
