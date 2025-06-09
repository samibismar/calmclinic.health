import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      doctorName,
      specialty,
      tone = "",
      customTone = "",
      notes = "",
      avoidList = "",
    } = body || {};

    const rawLanguages = body?.languages || "";
    const languages = typeof rawLanguages === "string"
      ? rawLanguages.split(",").map(l => l.trim()).filter(Boolean)
      : Array.isArray(rawLanguages) ? rawLanguages : [];

    const safeTone = typeof tone === "string" ? tone : "";
    const safeCustomTone = typeof customTone === "string" ? customTone : "";
    const toneDescription = (safeCustomTone || safeTone || "").trim();

    const userPrompt = `
You are an expert in crafting system prompts for GPT-based assistants working in healthcare clinics. Based on the clinic's preferences and context provided below, generate a detailed system prompt that governs how the AI assistant should behave.

Key requirements:

• Clinic Lead: Dr. ${doctorName || "Smith"}, a specialist in ${specialty || "general medicine"}.
• Tone of Voice: ${toneDescription || "friendly and professional"}.
• Supported Languages: ${languages.join(", ") || "English"}.
• Additional Clinic Instructions: ${notes || "None specified."}
${avoidList?.trim() ? `• 🚫 Must avoid: ${avoidList.trim()}.` : ""}

Guidelines:
- The assistant should act as a helpful, friendly, and informative representative of the clinic.
- Never provide diagnoses or medical advice unless explicitly instructed.
- Avoid casual or unprofessional language, and follow the clinic's preferences exactly.
- Embed all instructions naturally into the system prompt, without explicitly listing them like bullet points.
- Write in a polished, natural tone as if this prompt were to be fed directly into the GPT system.

Return only the system prompt string, written as a direct instruction to the assistant.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a GPT prompt engineer creating assistant personas for healthcare clinics.",
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      temperature: 0.7,
    });

    const assistantPrompt = completion.choices[0]?.message?.content?.trim();

    return NextResponse.json({ assistantPrompt });
  } catch (err) {
    console.error("Error generating prompt:", err);
    return NextResponse.json({ error: "Failed to generate prompt" }, { status: 500 });
  }
}