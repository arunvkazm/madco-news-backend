import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateSummary(content) {
  try {
    const prompt = `
You are a professional news editor. Summarize the following article into a short, factual, and engaging paragraph of about **60 words** (around 3–5 sentences). 
Avoid opinions or repetition. Keep it concise and clear.

Article:
"""${content}"""
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 160, // slightly higher to allow ~60 words naturally
      temperature: 0.5, // balanced creativity
    });

    return response.choices[0]?.message?.content?.trim() || "";
  } catch (err) {
    console.error("AI summary generation error:", err.message);
    // Fallback: use first ~60 words from content
    if (content) {
      const words = content.split(/\s+/).slice(0, 60).join(" ");
      return words.endsWith(".") ? words : words + "...";
    }
    return "";
  }
}
