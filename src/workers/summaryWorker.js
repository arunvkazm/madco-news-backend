import dotenv from "dotenv";
dotenv.config(); // <-- IMPORTANT: load env BEFORE anything else

import mongoose from "mongoose";
import SummaryQueue from "../models/SummaryQueue.js";
import News from "../models/News.js";
import { generateSummary } from "../utils/aiSummary.js";

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("🟢 Worker connected to DB"))
  .catch((err) => console.log("❌ Worker DB connection error:", err.message));

async function startWorker() {
  console.log("🟢 Summary worker started...");

  while (true) {
   const job = await News.findOneAndUpdate(
      { summaryStatus: "pending" },
      { summaryStatus: "processing" },
      { new: true }
    );

    if (!job) {
      console.log("⏳ No pending summaries...");
      await new Promise((r) => setTimeout(r, 2000));
      continue;
    }

    try {
      console.log("📝 Processing job:", job._id);

      const summary = await generateSummary(job.summary);

      console.log("📝 Generated summary:", summary);

      const updatedNews = await News.findByIdAndUpdate(
        job._id,
        {
          summary,
          summaryStatus: "completed",
        },
        { new: true }
      );

      console.log("📝 Summary Status:", updatedNews.summaryStatus);
      console.log("✨ Completed:", job._id);
  

      console.log("✨ Summary generated for news:", job.id);
    } catch (err) {
      console.error("❌ Worker error:", err.message);

      job.status = "pending";
      await job.save();
    }
  }
}

startWorker();
