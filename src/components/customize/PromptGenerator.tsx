"use client";

import { useState } from "react";

interface PromptAnswers {
  tone: string;
  languages: string;
  notesInclude: string;
  notesAvoid: string;
  culturalContext: string;
}

export default function PromptGenerator({
  onComplete,
}: {
  onComplete: (result: {
    tone: string;
    promptInstructions: string;
    welcomeMessage: string;
  }) => void;
}) {
  const [form, setForm] = useState<PromptAnswers>({
    tone: "",
    languages: "",
    notesInclude: "",
    notesAvoid: "",
    culturalContext: "",
  });

  const [systemPrompt, setSystemPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generate-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tone: form.tone,
          languages: form.languages,
          notesInclude: form.notesInclude,
          notesAvoid: form.notesAvoid,
          culturalContext: form.culturalContext,
        }),
      });
      if (!res.ok) throw new Error("Failed to generate prompt");
      const data = await res.json();
      console.log("🧠 GPT Response:", data);

      if (!data.assistantPrompt) {
        throw new Error("GPT response missing assistantPrompt.");
      }
      setSystemPrompt(data.assistantPrompt);
      onComplete({
        tone: form.tone,
        promptInstructions: data.assistantPrompt,
        welcomeMessage: "Hi there! How can I help today?",
      });
    } catch {
      // intentionally left blank
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {!systemPrompt ? (
        <>
          <div>
            <label className="block font-medium text-gray-700 mb-1">
              Tone of Voice
            </label>
            <input
              name="tone"
              type="text"
              placeholder="e.g., Calm, Friendly, Professional"
              value={form.tone}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-md"
            />
          </div>

          <div>
            <label className="block font-medium text-gray-700 mb-1">
              Languages
            </label>
            <input
              name="languages"
              type="text"
              placeholder="e.g., English, Spanish"
              value={form.languages}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-md"
            />
          </div>

          <div>
            <label className="block font-medium text-gray-700 mb-1">
              ✅ What should your assistant always include in responses?
            </label>
            <textarea
              name="notesInclude"
              rows={3}
              placeholder="e.g., Mention nearby urgent care, speak in a warm tone"
              value={form.notesInclude}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-md"
            />
            <ul className="text-xs text-gray-500 mt-1">
              <li>• Include friendly greetings</li>
              <li>• Mention coverage for common insurances</li>
              <li>• Encourage follow-up if needed</li>
            </ul>
          </div>

          <div>
            <label className="block font-medium text-gray-700 mt-4 mb-1">
              🚫 Anything it should avoid?
            </label>
            <textarea
              name="notesAvoid"
              rows={3}
              placeholder="e.g., Avoid giving medical advice or diagnosing"
              value={form.notesAvoid}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-md"
            />
            <ul className="text-xs text-gray-500 mt-1">
              <li>• Don&apos;t offer prescriptions</li>
              <li>• Avoid jokes or sarcasm</li>
            </ul>
          </div>

          <div>
            <label className="block font-medium text-gray-700 mt-4 mb-1">
              🌍 Anything culturally or locally important to know?
            </label>
            <textarea
              name="culturalContext"
              rows={3}
              placeholder="e.g., Many of our patients speak Haitian Creole and value discretion"
              value={form.culturalContext}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-md"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
          >
            {loading ? "Generating..." : "Generate My Assistant"}
          </button>
        </>
      ) : (
        <>
          <h3 className="text-lg font-semibold text-gray-800">
            🧠 Generated System Instructions
          </h3>
          <textarea
            value={systemPrompt}
            readOnly
            className="w-full bg-gray-100 border text-sm text-gray-700 px-4 py-3 rounded-md"
            rows={8}
          />
          <button
            onClick={() => {
              console.log("✅ Generated from GPT:", {
                tone: form.tone,
                promptInstructions: systemPrompt,
                welcomeMessage: "Hi there! How can I help today?",
              });
              onComplete({
                tone: form.tone,
                promptInstructions: systemPrompt,
                welcomeMessage: "Hi there! How can I help today?",
              });
            }}
            className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition"
          >
            ✅ Use This and Continue
          </button>
        </>
      )}
    </div>
  );
}