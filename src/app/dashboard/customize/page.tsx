"use client";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import ExampleQuestionsForm from "@/components/customize/ExampleQuestionsForm";
import ClinicIdentityForm from "@/components/customize/ClinicIdentityForm";
import { useRouter } from "next/navigation";

export default function CustomizePage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [clinicData, setClinicData] = useState<{
    practice_name?: string;
    doctor_name?: string;
    slug?: string;
    specialty?: string;
    primary_color?: string;
  } | null>(null);

  // Initialize all state with empty values - will be populated from database
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [tone, setTone] = useState("calm");
  const [customTone, setCustomTone] = useState("");
  const [languages, setLanguages] = useState<string[]>([]);
  const [promptInstructions, setPromptInstructions] = useState("");
  const [exampleQuestions, setExampleQuestions] = useState<string[]>([
    "What should I do before a blood test?",
    "Can I take Tylenol before my appointment?",
    "How long is the wait time?"
  ]);
  const [newQuestion, setNewQuestion] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [brandColor, setBrandColor] = useState<string>("#5BBAD5");
  const [clinicName, setClinicName] = useState("");
  const [hasAcceptedPrompt, setHasAcceptedPrompt] = useState(false);
  const [hasGeneratedPrompt, setHasGeneratedPrompt] = useState(false);
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [avoidList, setAvoidList] = useState("");

  const handleSave = async () => {
    if (!doctorName || !specialty || !tone || !promptInstructions) {
      toast.error("Please fill in all required fields.");
      return;
    }
    const payload = {
      welcomeMessage,
      tone,
      languages,
      promptInstructions,
      exampleQuestions,
      doctorName,
      specialty,
      brandColor,
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

      toast.success("Settings saved successfully!");
      router.push("/dashboard?setup=complete");
    } catch (err) {
      console.error("Save error:", err);
      toast.error("Something went wrong while saving. Please try again.");
    }
  };

  // Fetch clinic settings using the same pattern as dashboard
  useEffect(() => {
    const fetchClinicSettings = async () => {
      try {
        // Use the same API endpoint as dashboard to get clinic data
        const response = await fetch("/api/dashboard/data", {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch clinic data");
        }

        const { clinic } = await response.json();
        setClinicData(clinic);

        // Now fetch the full clinic details from database
        const settingsResponse = await fetch(`/api/clinic-settings?slug=${clinic.slug}`, {
          credentials: "include",
        });

        if (settingsResponse.ok) {
          const settings = await settingsResponse.json();
          
          // Populate form with saved values, fallback to clinic data from dashboard
          setDoctorName(settings.doctor_name || clinic.doctor_name || "");
          setSpecialty(settings.specialty || clinic.specialty || "");
          setWelcomeMessage(settings.welcome_message || "");
          setBrandColor(settings.primary_color || clinic.primary_color || "#5BBAD5");
          setTone(settings.tone || "calm");
          setCustomTone(settings.custom_tone || "");
          setLanguages(settings.languages || []);
          setPromptInstructions(settings.ai_instructions || "");
          setClinicName(settings.practice_name || clinic.practice_name || "");
          setAvoidList(settings.avoid_list || "");

          // Handle example questions with fallback
          if (settings.suggested_prompts?.en) {
            setExampleQuestions(settings.suggested_prompts.en);
          } else if (settings.example_questions) {
            setExampleQuestions(settings.example_questions);
          }

          // If prompt instructions exist, mark as generated/accepted
          if (settings.ai_instructions) {
            setHasGeneratedPrompt(true);
            setHasAcceptedPrompt(true);
          }
        } else {
          // If no detailed settings found, use basic clinic data
          setDoctorName(clinic.doctor_name || "");
          setSpecialty(clinic.specialty || "");
          setBrandColor(clinic.primary_color || "#5BBAD5");
          setClinicName(clinic.practice_name || "");
        }
      } catch (error) {
        console.error("Error fetching clinic settings:", error);
        toast.error("Failed to load your settings. Please try refreshing the page.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchClinicSettings();
  }, []);

  // Show loading spinner while fetching data
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-3xl mx-auto space-y-8">
          <h1 className="text-2xl font-bold text-gray-900 text-center">Customize Your Assistant</h1>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Loading your current settings...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
            brandColor={brandColor}
            setBrandColor={setBrandColor}
            session={null} // Not needed anymore
          />
        );
      case 1:
        return (
          <ExampleQuestionsForm
            exampleQuestions={exampleQuestions}
            setExampleQuestions={setExampleQuestions}
            newQuestion={newQuestion}
            setNewQuestion={setNewQuestion}
          />
        );
      case 2:
        return (
          <div className="space-y-8 bg-gradient-to-br from-[#0f172a] to-[#1e293b] rounded-2xl shadow-xl border border-gray-700 p-8 text-white">
            <h2 className="text-2xl font-bold text-white">🧠 Let AI Help You Customize</h2>

            {/* Assistant Personality settings */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-sm">
              <h3 className="text-md font-semibold text-white mb-3">🎭 Assistant Personality</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-white block mb-1">Tone of Voice</label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full border border-gray-600 bg-gray-900 text-white rounded-md p-2 text-sm"
                  >
                    <option value="calm">Calm</option>
                    <option value="friendly">Friendly</option>
                    <option value="professional">Professional</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                {tone === "custom" && (
                  <div>
                    <label className="text-sm font-semibold text-white block mb-1">Custom Tone Description</label>
                    <input
                      value={customTone}
                      onChange={(e) => setCustomTone(e.target.value)}
                      className="w-full border border-gray-600 bg-gray-900 text-white rounded-md p-2 text-sm"
                    />
                  </div>
                )}

                <div>
                  <label className="text-sm font-semibold text-white block mb-1">Languages</label>
                  <input
                    type="text"
                    placeholder="e.g. English, Spanish"
                    value={languages.join(", ")}
                    onChange={(e) => setLanguages(e.target.value.split(",").map(s => s.trim()))}
                    className="w-full border border-gray-600 bg-gray-900 text-white rounded-md p-2 text-sm"
                  />
                </div>

                {/* Doctor Name and Specialty display */}
                <div>
                  <label className="text-sm font-semibold text-white block mb-1">Doctor Name</label>
                  <input
                    type="text"
                    value={doctorName}
                    disabled
                    className="w-full border border-gray-600 bg-gray-900 text-white rounded-md p-2 text-sm opacity-75"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-white block mb-1">Specialty</label>
                  <input
                    type="text"
                    value={specialty}
                    disabled
                    className="w-full border border-gray-600 bg-gray-900 text-white rounded-md p-2 text-sm opacity-75"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-white block mb-1">Things the Assistant Should Avoid Saying</label>
                  <textarea
                    value={avoidList}
                    onChange={(e) => setAvoidList(e.target.value)}
                    placeholder="e.g. Avoid medical advice, avoid saying 'I don't know', avoid giving legal guidance"
                    className="w-full border border-gray-600 bg-gray-900 text-white rounded-md p-2 text-sm"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-white block mb-1">Any Other Instructions for Your AI Assistant</label>
                  <textarea
                    value={promptInstructions}
                    onChange={(e) => setPromptInstructions(e.target.value)}
                    placeholder="Write anything else the assistant should keep in mind when speaking to patients."
                    className="w-full border border-gray-600 bg-gray-900 text-white rounded-md p-2 text-sm"
                    rows={3}
                  />
                  <div className="text-xs text-gray-400 mt-2 leading-relaxed">
                    <p className="mb-1">Need ideas? You can add:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>A reminder to always greet patients politely</li>
                      <li>Instructions to prioritize clear, simple explanations</li>
                      <li>A note to recommend following up with the doctor for any uncertainties</li>
                      <li>Any culturally relevant communication styles</li>
                      <li>Information you always want mentioned (e.g. office hours, location, insurance info)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-sm">
              <h3 className="text-md font-semibold text-white mb-2">🧠 Generated System Instructions</h3>
              <div className="text-sm text-white whitespace-pre-wrap bg-gray-800 border border-gray-700 rounded-md p-3">
                {promptInstructions || "Your assistant's instructions will appear here once generated or manually entered."}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
              <button
                onClick={async () => {
                  setIsGeneratingPrompt(true);
                  try {
                    const response = await fetch("/api/generate-prompt", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        tone,
                        languages,
                        doctorName,
                        specialty,
                        notes: promptInstructions,
                        avoidList,
                      }),
                    });
                    const data = await response.json();
                    setPromptInstructions(data.assistantPrompt);
                    setHasGeneratedPrompt(true);
                  } catch (err) {
                    console.error("AI generation failed", err);
                    alert("Failed to generate instructions. Try again.");
                  } finally {
                    setIsGeneratingPrompt(false);
                  }
                }}
                className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-6 rounded-lg shadow-md transition"
              >
                {isGeneratingPrompt ? "Generating..." : "🪄 Use AI to Generate Instructions"}
              </button>
              {hasGeneratedPrompt && (
                <button
                  onClick={() => {
                    setHasAcceptedPrompt(true);
                  }}
                  className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg shadow-md transition"
                >
                  ✅ Use This and Continue
                </button>
              )}
              <button
                className="w-full sm:w-auto underline text-sm text-gray-300 hover:text-white"
                onClick={() => setStep(5)}
              >
                Do it manually instead
              </button>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="bg-gradient-to-br from-[#0f172a] to-[#1e293b] rounded-2xl shadow-xl border border-gray-700 p-8 space-y-6 text-white max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-2">✅ Preview Your Assistant</h2>
            <p className="text-sm text-gray-400 mb-6">This is how your assistant will appear to patients based on your current settings.</p>

            <div className="rounded-xl p-6 shadow-lg text-center" style={{ backgroundColor: "#ffffff", color: "#111827" }}>
              <div className="w-16 h-16 mx-auto mb-2 rounded-md" style={{ backgroundColor: brandColor }} />
              <h3 className="text-xl font-bold mb-1" style={{ color: brandColor }}>{doctorName || "Dr. Smith"}</h3>
              <p className="text-sm text-gray-500 mb-4">{specialty || "General Practice"}</p>
              <p className="mb-6">{welcomeMessage || "Hi! I'm your assistant. How can I help today?"}</p>

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
                  {promptInstructions || "Your assistant's instructions will appear here once generated or manually entered."}
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

          {/* Error/Warning messages for required fields */}
          {step === 0 && (!doctorName || !specialty) && (
            <div className="bg-red-100 text-red-700 border border-red-300 rounded-md p-4 text-sm">
              Please complete all required fields in this section:
              <ul className="list-disc list-inside mt-2">
                {!doctorName && <li>Doctor Name</li>}
                {!specialty && <li>Specialty</li>}
              </ul>
            </div>
          )}

          {step === 2 && !hasAcceptedPrompt && (
            <div className="bg-cyan-100 text-cyan-800 border border-cyan-300 rounded-md p-4 text-sm">
              Please use the AI tool to generate instructions and accept them before continuing.
            </div>
          )}

          <div className="flex justify-between">
            {step > 0 && step < 4 && (
              <button
                onClick={() => setStep(step - 1)}
                className="text-sm text-gray-500 hover:underline"
              >
                ← Back
              </button>
            )}
            {step < 3 && (
              <>
                {step !== 2 && (
                  <button
                    onClick={() => {
                    if (step === 0) {
                      const missing = [];
                      if (!doctorName) missing.push("Doctor Name");
                      if (!specialty) missing.push("Specialty");
                      if (missing.length > 0) {
                        toast.error(`Please fill in the following required field(s): ${missing.join(", ")}`);
                        return;
                      }
                    }
                      setStep(step + 1);
                    }}
                    className="ml-auto bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  >
                    Next →
                  </button>
                )}
                {step === 2 && hasAcceptedPrompt && (
                  <button
                    onClick={() => setStep(3)}
                    className="ml-auto bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  >
                    Next →
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}