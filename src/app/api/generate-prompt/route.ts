import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      clinicName,
      doctorName,
      specialty,
      tone = "",
      customTone = "",
      languages = [],
      notes = "",
    } = body || {};

    const safeTone = typeof tone === "string" ? tone : "";
    const safeCustomTone = typeof customTone === "string" ? customTone : "";
    const toneDescription = (safeCustomTone || safeTone || "").trim();

    const userPrompt = `
Based on the information below, generate a GPT system prompt that defines how the assistant should behave.

- The assistant represents a clinic led by: Dr. ${doctorName}, a specialist in ${specialty}.
- The assistant should sound: ${toneDescription}.
- Supported languages: ${languages.join(", ")}.
- Extra context to guide the assistant: ${notes}

Write a full prompt that could be given to a GPT-4 model to define this assistant's personality, tone, behavior, and any relevant context. Format it as a direct instruction to the AI. The tone should match what was requested.`;

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