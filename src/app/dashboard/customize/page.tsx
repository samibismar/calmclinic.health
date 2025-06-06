"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CustomizePage() {
  const router = useRouter();
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [tone, setTone] = useState("calm");
  const [customTone, setCustomTone] = useState("");
  const [languages, setLanguages] = useState<string[]>([]);
  const [customLanguage, setCustomLanguage] = useState("");
  const [promptInstructions, setPromptInstructions] = useState("");
  const [selectedPromptPreset, setSelectedPromptPreset] = useState("");
  const [exampleQuestions, setExampleQuestions] = useState<string[]>([
    "What should I do before a blood test?",
    "Can I take Tylenol before my appointment?",
    "How long is the wait time?"
  ]);
  const [newQuestion, setNewQuestion] = useState("");

  const [doctorName, setDoctorName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [officeInstructions, setOfficeInstructions] = useState("");

  const [brandColor, setBrandColor] = useState("#5BBAD5");
  const [backgroundStyle, setBackgroundStyle] = useState("");
  const [chatAvatarName, setChatAvatarName] = useState("");

  const handleSave = async () => {
    const payload = {
      welcomeMessage,
      tone,
      languages,
      promptInstructions,
      exampleQuestions,
      doctorName,
      specialty,
      officeInstructions,
      brandColor,
      backgroundStyle,
      chatAvatarName,
    };

    try {
      const response = await fetch("/api/dashboard/save-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Ensure session cookie is sent
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to save settings.");
      }

      alert("Settings saved successfully!");
      router.push("/dashboard");
    } catch (err) {
      console.error("Save error:", err);
      alert("Something went wrong while saving. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white shadow rounded-lg p-8 space-y-10">
        <h1 className="text-2xl font-bold text-gray-900">Customize Your Assistant</h1>
        <p className="text-sm text-gray-500">Fields marked with <span className="text-red-500">*</span> are required.</p>

        {/* Assistant Behavior */}
        <section>
          <h2 className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-1 mb-4">Assistant Behavior</h2>
          <div className="mb-6">
            <label htmlFor="welcomeMessage" className="block text-sm font-medium text-gray-700">
              Welcome Message
            </label>
            <input
              type="text"
              id="welcomeMessage"
              name="welcomeMessage"
              value={welcomeMessage}
              onChange={(e) => setWelcomeMessage(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Hi there! I'm here to help while you wait."
            />
            <p className="text-sm text-gray-500 mt-1">
              This is the first thing patients see when the assistant starts.
            </p>
          </div>
          <div className="mb-6">
            <label htmlFor="tone" className="block text-sm font-medium text-gray-700">
              Tone of Voice <span className="text-red-500">*</span>
            </label>
            <select
              id="tone"
              name="tone"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="calm">Calm & Professional (default)</option>
              <option value="friendly">Friendly & Warm</option>
              <option value="energetic">Energetic & Conversational</option>
            </select>
            <input
              type="text"
              value={customTone}
              onChange={(e) => {
                setCustomTone(e.target.value);
                setTone(e.target.value);
              }}
              placeholder="Or enter a custom tone"
              className="mt-3 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
            <p className="text-sm text-gray-500 mt-1">
              This affects how the assistant talks to patients.
            </p>
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Supported Languages
            </label>
            <div className="space-y-2">
              {["English", "Spanish", "French", "Arabic"].map((lang) => (
                <label key={lang} className="flex items-center text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={languages.includes(lang)}
                    onChange={() => {
                      setLanguages((prev) =>
                        prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
                      );
                    }}
                    className="mr-2"
                  />
                  {lang}
                </label>
              ))}
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={customLanguage}
                  onChange={(e) => setCustomLanguage(e.target.value)}
                  placeholder="Other language"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customLanguage && !languages.includes(customLanguage)) {
                      setLanguages([...languages, customLanguage]);
                      setCustomLanguage("");
                    }
                  }}
                  className="px-3 py-2 bg-blue-100 text-blue-700 rounded-md text-sm hover:bg-blue-200"
                >
                  Add
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Choose which languages your assistant should support.
            </p>
          </div>
          <div className="mb-6">
            <label htmlFor="promptInstructions" className="block text-sm font-medium text-gray-700">
              AI Prompt Instructions <span className="text-red-500">*</span>
            </label>
            <label htmlFor="promptPreset" className="block text-sm font-medium text-gray-700 mb-1">
              Prompt Presets
            </label>
            <select
              id="promptPreset"
              value={selectedPromptPreset}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedPromptPreset(val);
                setPromptInstructions(val);
              }}
              className="block w-full mb-3 px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">Select a preset...</option>
              <option value="Act like a friendly medical assistant helping patients while they wait.">
                Friendly & Helpful Assistant
              </option>
              <option value="Behave like a calm and professional assistant for a doctor&apos;s office.">
                Calm & Professional
              </option>
              <option value="Speak clearly and concisely, avoiding medical jargon.">
                Clear & Simple
              </option>
            </select>
            <textarea
              id="promptInstructions"
              name="promptInstructions"
              value={promptInstructions}
              onChange={(e) => setPromptInstructions(e.target.value)}
              rows={4}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="E.g. &quot;Act like a friendly medical assistant helping patients while they wait...&quot;"
            />
            <p className="text-sm text-gray-500 mt-1">
              These instructions tell the assistant how to behave. Be specific and clear.
            </p>
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Example Questions
            </label>
            <ul className="list-disc ml-5 mb-2 text-sm text-gray-700">
              {exampleQuestions.map((q, idx) => (
                <li key={idx}>{q}</li>
              ))}
            </ul>
            <div className="flex space-x-2">
              <input
                type="text"
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                placeholder="Add a new question..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              <button
                type="button"
                onClick={() => {
                  if (newQuestion.trim()) {
                    setExampleQuestions((prev) => [...prev, newQuestion.trim()]);
                    setNewQuestion("");
                  }
                }}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-md text-sm hover:bg-blue-200"
              >
                Add
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              These are shown to patients to guide them. You can include repetitive questions your clinic often gets (e.g. &quot;Can I eat before my blood test?&quot;).
            </p>
          </div>
        </section>

        {/* Clinic Details */}
        <section>
          <h2 className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-1 mb-4">Clinic Details</h2>
          <div className="mb-6">
            <label htmlFor="doctorName" className="block text-sm font-medium text-gray-700">
              Doctor Name
            </label>
            <input
              type="text"
              id="doctorName"
              name="doctorName"
              value={doctorName}
              onChange={(e) => setDoctorName(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Dr. Jane Smith"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="specialty" className="block text-sm font-medium text-gray-700">
              Specialty
            </label>
            <input
              type="text"
              id="specialty"
              name="specialty"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Internal Medicine"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="officeInstructions" className="block text-sm font-medium text-gray-700">
              Office Instructions
            </label>
            <textarea
              id="officeInstructions"
              name="officeInstructions"
              value={officeInstructions}
              onChange={(e) => setOfficeInstructions(e.target.value)}
              rows={3}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="E.g. &quot;Please check in at the front desk and fill out the intake form while you wait.&quot;"
            />
            <p className="text-sm text-gray-500 mt-1">
              Optional — shown if you want to give patients any special instructions when they start.
            </p>
          </div>
        </section>

        {/* Appearance */}
        <section>
          <h2 className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-1 mb-4">Appearance</h2>
          <div className="mb-6">
            <label htmlFor="brandColor" className="block text-sm font-medium text-gray-700">
              Primary Brand Color
            </label>
            <input
              type="color"
              id="brandColor"
              name="brandColor"
              value={brandColor}
              onChange={(e) => setBrandColor(e.target.value)}
              className="mt-2 h-10 w-20 cursor-pointer"
            />
            <p className="text-sm text-gray-500 mt-1">
              Optional — used for accents like buttons and highlights.
            </p>
          </div>

          <div className="mb-6">
            <label htmlFor="clinicLogo" className="block text-sm font-medium text-gray-700">
              Clinic Logo
            </label>
            <input
              type="file"
              id="clinicLogo"
              name="clinicLogo"
              accept="image/*"
              className="mt-1 block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:border file:border-gray-300 file:rounded-md file:bg-gray-100 file:text-sm file:font-semibold file:text-gray-700 hover:file:bg-gray-200"
            />
            <p className="text-sm text-gray-500 mt-1">
              Optional — your clinic&apos;s logo shown in the assistant UI. Use a clear square image under 1MB (PNG or JPG preferred).
            </p>
          </div>

          <div className="mb-6">
            <label htmlFor="backgroundStyle" className="block text-sm font-medium text-gray-700">
              Background Style
            </label>
            <input
              type="text"
              id="backgroundStyle"
              name="backgroundStyle"
              value={backgroundStyle}
              onChange={(e) => setBackgroundStyle(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="E.g. &quot;CalmClinic gradient&quot; or soft background"
            />
            <p className="text-sm text-gray-500 mt-1">
              Optional — control the visual background of your assistant experience.
            </p>
          </div>

          <div className="mb-6">
            <label htmlFor="chatAvatarName" className="block text-sm font-medium text-gray-700">
              Chat Avatar Name
            </label>
            <input
              type="text"
              id="chatAvatarName"
              name="chatAvatarName"
              value={chatAvatarName}
              onChange={(e) => setChatAvatarName(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="E.g. &quot;CalmBot&quot; or &quot;Clinic Assistant&quot;"
            />
            <p className="text-sm text-gray-500 mt-1">
              Optional — this is the name that appears next to the assistant avatar.
            </p>
          </div>
        </section>

        <button
          onClick={handleSave}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg shadow-md transition"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}