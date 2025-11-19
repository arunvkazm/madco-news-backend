import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();
import { pipeline } from "@xenova/transformers";


const API_KEY = process.env.OPENAI_API_KEY;
    
const openai = new OpenAI({ apiKey: API_KEY });


// export async function generateSummary(content) {
//   try {

//     const prompt = `
// You are a professional news editor.

// Summarize the following article in **around 60 words**, using **3–5 complete sentences**.
// - Do NOT end a sentence midway.
// - Keep it factual, neutral, concise, and clear.
// - No repetition or opinions.

// Article:
// """${content}"""
//     `;

//     const response = await openai.chat.completions.create({
//       model: "gpt-4o-mini",
//       messages: [{ role: "user", content: prompt }],
//       max_tokens: 100,      // allows full sentences
//       temperature: 0.3      // more stable + factual
//     });

//     let summary = response.choices[0]?.message?.content?.trim() || "";

//     // Ensure summary ends with full sentence (remove incomplete trailing fragment)
//     summary = summary.replace(/[^.!?]*$/, "").trim();

//     return summary;
//   } catch (err) {
//     console.error("AI summary generation error:", err.message);

//     // Fallback: extract complete sentences up to ~60 words
//     if (content) {
//       const sentences = content.split(/(?<=[.!?])\s+/); // split by full sentences
//       const picked = [];
//       let count = 0;

//       for (const s of sentences) {
//         const words = s.split(/\s+/).length;
//         if (count + words > 65) break;
//         picked.push(s);
//         count += words;
//       }

//       return picked.join(" ").trim() || "";
//     }

//     return "";
//   }
// }

let summarizer = null;
async function loadSummarizer() {
  if (!summarizer) {
    summarizer = await pipeline("summarization", "Xenova/bart-large-cnn");
    console.log("🟢 Summarizer loaded");
  }
  return summarizer;
}

export async function generateSummary(content) {
  try {
    const model = await loadSummarizer();

    // 1️⃣ Raw summary
    const raw = await model(content, {
      max_length: 140,
      min_length: 60,
      do_sample: false,
    });

    let summary = raw[0].summary_text.trim();

    // 2️⃣ Split into sentences
    let sentences = summary.split(/(?<=[.!?])\s+/).filter(Boolean);

    // 3️⃣ Make 3–5 sentences, approx 60 words
    let final = [];
    let count = 0;

    for (const s of sentences) {
      const w = s.split(" ").length;
      if (count + w > 65) break;
      final.push(s);
      count += w;

      if (final.length === 5) break;
    }

    // Ensure minimum 3 sentences
    while (final.length < 3 && sentences.length > final.length) {
      final.push(sentences[final.length]);
    }

    return final.join(" ");

  } catch (err) {
    console.error("Summary error:", err.message);

    // fallback
    return content.split(/\s+/).slice(0, 60).join(" ") + "...";
  }
}
