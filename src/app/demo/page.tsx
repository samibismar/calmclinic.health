import Link from "next/link";
import DemoQRCard from "@/components/demo/DemoQRCard";
import { DEMO_CLINIC_CONFIG, DEMO_ACTIVITY_METRICS } from "@/components/demo/DemoClinicConfig";

export default function DemoHomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0f172a] to-[#0ea5e9] text-[#f8fafc]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#101820]/80 backdrop-blur-md border-b border-[#0ea5e9]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-xl font-semibold text-[#0ea5e9]">CalmClinic Demo</span>
          <nav className="space-x-6 text-sm text-[#f8fafc]">
            <Link href="/" className="hover:text-[#0ea5e9] transition">
              ← Back to Home
            </Link>
          </nav>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Demo Overview */}
        <section className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[#0ea5e9] mb-4">
            Live Demo: Fort Worth Eye Associates
          </h1>
          <p className="text-xl text-[#f8fafc] mb-8 max-w-3xl mx-auto">
            Experience CalmClinic as a patient would - scan the QR code or click the button below to interact with Dr. Ranelle&apos;s AI assistant.
          </p>
          
          <div className="flex justify-center gap-4 mb-8">
            <Link href="/demo/fort-worth-eye">
              <button className="bg-gradient-to-r from-[#0ea5e9] to-[#059669] hover:from-[#2563eb] hover:to-[#059669] text-white font-semibold py-3 px-6 rounded-xl transition shadow-lg">
                🚀 Launch Demo
              </button>
            </Link>
            <Link href="/demo/fort-worth-eye?lang=es">
              <button className="border border-[#0ea5e9] hover:bg-[#0ea5e9] hover:text-white text-[#0ea5e9] font-semibold py-3 px-6 rounded-xl transition">
                🌐 Spanish Demo
              </button>
            </Link>
          </div>
        </section>

        {/* Demo Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Demo QR Card */}
          <div>
            <DemoQRCard size={180} />
          </div>

          {/* Demo Configuration */}
          <div className="bg-[#101820]/80 backdrop-blur-sm border border-[#0ea5e9]/30 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4 text-[#0ea5e9]">Demo Configuration</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[#6b7280]">Practice Name:</span>
                <span>{DEMO_CLINIC_CONFIG.practice_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6b7280]">Doctor:</span>
                <span>Dr. {DEMO_CLINIC_CONFIG.doctor_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6b7280]">Specialty:</span>
                <span>{DEMO_CLINIC_CONFIG.specialty}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6b7280]">Primary Color:</span>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded-full border border-[#6b7280]" 
                    style={{ backgroundColor: DEMO_CLINIC_CONFIG.primary_color }}
                  ></div>
                  <span>{DEMO_CLINIC_CONFIG.primary_color}</span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6b7280]">Languages:</span>
                <span>English, Spanish</span>
              </div>
            </div>
          </div>

          {/* Demo Activity */}
          <div className="bg-[#101820]/80 backdrop-blur-sm border border-[#059669]/30 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4 text-[#059669]">Simulated Activity</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[#6b7280]">Patients Helped Today:</span>
                <span className="text-[#059669] font-semibold">{DEMO_ACTIVITY_METRICS.patients_helped_today}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6b7280]">Active Conversations:</span>
                <span className="text-[#0ea5e9] font-semibold">{DEMO_ACTIVITY_METRICS.active_conversations}</span>
              </div>
              <div className="mt-4">
                <span className="text-xs text-[#6b7280]">Common Questions:</span>
                <ul className="mt-2 space-y-1">
                  {DEMO_ACTIVITY_METRICS.most_common_questions.map((question, index) => (
                    <li key={index} className="text-xs text-[#f8fafc]">• {question}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Suggested Prompts */}
          <div className="bg-[#101820]/80 backdrop-blur-sm border border-[#0ea5e9]/30 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4 text-[#0ea5e9]">Featured Questions</h3>
            <div className="space-y-2">
              {DEMO_CLINIC_CONFIG.suggested_prompts.en.map((prompt, index) => (
                <div key={index} className="bg-[#0ea5e9]/10 rounded-lg p-3 text-sm text-[#f8fafc]">
                  💡 {prompt}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Demo Instructions */}
        <section className="bg-[#101820]/60 border border-[#0ea5e9]/20 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-[#0ea5e9] mb-6">Demo Instructions</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-[#059669] mb-4">For the Presentation</h3>
              <ol className="space-y-3 text-[#f8fafc]">
                <li className="flex items-start gap-3">
                  <span className="bg-[#059669] text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold flex-shrink-0">1</span>
                  <span>Show the QR code on your screen or print the demo card</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-[#059669] text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold flex-shrink-0">2</span>
                  <span>Have Dr. Ranelle scan with her phone camera</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-[#059669] text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold flex-shrink-0">3</span>
                  <span>Demo opens instantly with her practice branding</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-[#059669] text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold flex-shrink-0">4</span>
                  <span>Show pre-seeded conversation history</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-[#059669] text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold flex-shrink-0">5</span>
                  <span>Try asking one of the suggested ophthalmology questions</span>
                </li>
              </ol>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-[#0ea5e9] mb-4">Key Demo Points</h3>
              <ul className="space-y-3 text-[#f8fafc]">
                <li className="flex items-start gap-3">
                  <span className="text-[#0ea5e9]">✓</span>
                  <span>Instant QR-to-chat experience (no downloads, no signup)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#0ea5e9]">✓</span>
                  <span>Fully branded with Fort Worth Eye Associates identity</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#0ea5e9]">✓</span>
                  <span>Ophthalmology-specific responses and disclaimers</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#0ea5e9]">✓</span>
                  <span>Professional medical tone and appropriate scope</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#0ea5e9]">✓</span>
                  <span>Realistic patient activity simulation</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#0ea5e9]">✓</span>
                  <span>Mobile-optimized for waiting room use</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Technical Notes */}
        <section className="mt-8 text-center">
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-yellow-400 mb-2">Technical Notes</h3>
            <p className="text-sm text-[#f8fafc]">
              This demo runs independently of the main database using hardcoded configuration. 
              All responses are pre-programmed for ophthalmology scenarios. 
              The demo is designed to be bulletproof for live presentations.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}