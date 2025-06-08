"use client";

import { useState } from "react";
import AssistantPersonalityForm from "@/components/customize/AssistantPersonalityForm";
import ExampleQuestionsForm from "@/components/customize/ExampleQuestionsForm";
import ClinicIdentityForm from "@/components/customize/ClinicIdentityForm";
import BrandingForm from "@/components/customize/BrandingForm";
import { useRouter } from "next/navigation";

export default function CustomizePage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  // Removed prefillData and default to initial values only
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
  const [brandColor, setBrandColor] = useState<string>("#5BBAD5");
  const [backgroundStyle, setBackgroundStyle] = useState("");
  const [chatAvatarName, setChatAvatarName] = useState("");
  const [clinicName, setClinicName] = useState("");

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
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to save settings.");

      alert("Settings saved successfully!");
      router.push("/dashboard");
    } catch (err) {
      console.error("Save error:", err);
      alert("Something went wrong while saving. Please try again.");
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <ClinicIdentityForm
            clinicName={clinicName}
            setClinicName={setClinicName}
            doctorName={doctorName}
            setDoctorName={setDoctorName}
            specialty={specialty}
            setSpecialty={setSpecialty}
            officeInstructions={officeInstructions}
            setOfficeInstructions={setOfficeInstructions}
            brandColor={brandColor}
            setBrandColor={setBrandColor}
            chatAvatarName={chatAvatarName}
            setChatAvatarName={setChatAvatarName}
          />
        );
      case 1:
        return (
          <BrandingForm
            brandColor={brandColor}
            setBrandColor={setBrandColor}
            backgroundStyle={backgroundStyle}
            setBackgroundStyle={setBackgroundStyle}
            chatAvatarName={chatAvatarName}
            setChatAvatarName={setChatAvatarName}
          />
        );
      case 2:
        return (
          <AssistantPersonalityForm
            tone={tone}
            setTone={setTone}
            customTone={customTone}
            setCustomTone={setCustomTone}
            welcomeMessage={welcomeMessage}
            setWelcomeMessage={setWelcomeMessage}
            promptInstructions={promptInstructions}
            setPromptInstructions={setPromptInstructions}
            languages={languages}
            setLanguages={setLanguages}
            customLanguage={customLanguage}
            setCustomLanguage={setCustomLanguage}
            selectedPromptPreset={selectedPromptPreset}
            setSelectedPromptPreset={setSelectedPromptPreset}
          />
        );
      case 3:
        return (
          <ExampleQuestionsForm
            exampleQuestions={exampleQuestions}
            setExampleQuestions={setExampleQuestions}
            newQuestion={newQuestion}
            setNewQuestion={setNewQuestion}
          />
        );
      case 4:
        return (
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-gray-900">🧠 Let AI Help You Customize</h2>

            <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 shadow-sm">
              <h3 className="text-md font-semibold text-gray-700 mb-2">🧠 Generated System Instructions</h3>
              <div className="text-sm text-gray-800 whitespace-pre-wrap bg-white border rounded-md p-3">
                {promptInstructions || "Your assistant’s instructions will appear here once generated or manually entered."}
              </div>
            </div>

            <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm">
              <label className="text-sm font-semibold text-gray-700 block mb-2">
                ✍️ Customize System Instructions
              </label>
              <p className="text-sm text-gray-500 mb-3">
                Use the field below to provide specific instructions that will shape your assistant’s behavior. You may include guidance on tone of voice, topics to avoid, or any clinic-specific preferences or values. Examples of helpful context include handling common insurance questions, addressing frequently asked concerns, or ensuring sensitive communication practices. You can also include anything else that will tailor your assistant’s AI behavior to reflect exactly what you want (e.g., preferred vocabulary, follow-up behavior, cultural considerations, etc.). If left blank, the assistant will generate a default prompt using your previously provided information.
              </p>
              <textarea
                value={promptInstructions}
                onChange={(e) => setPromptInstructions(e.target.value)}
                rows={6}
                className="w-full border rounded-md p-3 text-sm text-gray-800"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
              <button
                onClick={async () => {
                  try {
                    const response = await fetch("/api/generate-prompt", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ tone, languages, notes: promptInstructions }),
                    });
                    const data = await response.json();
                    setPromptInstructions(data.assistantPrompt);
                  } catch (err) {
                    console.error("AI generation failed", err);
                    alert("Failed to generate instructions. Try again.");
                  }
                }}
                className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-6 rounded-lg shadow-md transition"
              >
                🪄 Use AI to Generate Instructions
              </button>
              <button
                onClick={() => setStep(5)}
                className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg shadow-md transition"
              >
                ✅ Use This and Continue
              </button>
              <button
                className="w-full sm:w-auto underline text-sm text-gray-500 hover:text-gray-700"
                onClick={() => setStep(5)}
              >
                Do it manually instead
              </button>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="bg-gradient-to-br from-[#0f172a] to-[#1e293b] rounded-2xl shadow-xl border border-gray-700 p-8 space-y-6 text-white max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-2">✅ Preview Your Assistant</h2>
            <p className="text-sm text-gray-400 mb-6">This is how your assistant will appear to patients based on your current settings.</p>

            <div className="rounded-xl p-6 shadow-lg text-center" style={{ backgroundColor: "#ffffff", color: "#111827" }}>
              <div className="w-16 h-16 mx-auto mb-2 bg-gray-200 rounded-md" />
              <h3 className="text-xl font-bold mb-1" style={{ color: brandColor }}>{doctorName || "Dr. Smith"}</h3>
              <p className="text-sm text-gray-500 mb-4">{specialty || "General Practice"}</p>
              <p className="mb-6">{welcomeMessage || `Hi! I'm ${chatAvatarName || "your assistant"}. How can I help today?`}</p>

              <div className="flex flex-wrap gap-2 justify-center text-sm">
                {(exampleQuestions.length > 0 ? exampleQuestions : [
                  "What should I tell the doctor?",
                  "How long will the appointment take?",
                  "Should I mention all my symptoms?"
                ]).slice(0, 4).map((q, i) => (
                  <div key={i} className="bg-gray-100 px-3 py-2 rounded-full text-gray-700">
                    {q}
                  </div>
                ))}
              </div>

              {/* Mock chat input box */}
              <div className="mt-6 flex items-center gap-2 border border-gray-300 rounded-md px-4 py-2">
                <input
                  type="text"
                  disabled
                  placeholder="Type a question about your symptoms..."
                  className="flex-1 text-sm bg-transparent text-gray-500 placeholder-gray-400 outline-none"
                />
                <button className="bg-green-600 text-white px-4 py-1 rounded-md text-sm" disabled>Send</button>
              </div>

              <div className="mt-6 text-left">
                <h4 className="text-md font-semibold text-gray-700 mb-1">🧠 System Instructions</h4>
                <div className="bg-gray-100 p-4 rounded-md text-sm text-gray-800 whitespace-pre-wrap">
                  {promptInstructions || "Your assistant’s instructions will appear here once generated or manually entered."}
                </div>
              </div>

              <p className="mt-6 text-xs text-gray-400">This assistant is for educational purposes only.</p>
            </div>

            <p className="text-sm text-gray-400 text-center mt-4">
              To test your assistant with these settings, press <strong>Save &amp; Finish Setup</strong>, then go to your dashboard and click <strong>&ldquo;View Chat&rdquo;</strong> in the top right.
            </p>
            <button
              onClick={handleSave}
              className="mt-6 w-full bg-cyan-600 hover:bg-cyan-700 text-white font-medium py-3 rounded-lg shadow-md transition"
            >
              ✅ Save & Finish Setup
            </button>
            <button
              onClick={() => setStep(4)}
              className="w-full text-sm text-gray-400 hover:text-white underline"
            >
              ← Back
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        <h1 className="text-2xl font-bold text-gray-900 text-center">Customize Your Assistant</h1>
        <div className="bg-white p-6 rounded-lg shadow-md space-y-10">
          {renderStep()}
          <div className="flex justify-between">
            {step > 0 && step < 5 && (
              <button
                onClick={() => setStep(step - 1)}
                className="text-sm text-gray-500 hover:underline"
              >
                ← Back
              </button>
            )}
            {step < 5 && (
              <button
                onClick={() => setStep(step + 1)}
                className="ml-auto bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Next →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}