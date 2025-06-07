import Link from "next/link";
export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-950 text-white font-sans">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-xl font-semibold text-cyan-400">CalmClinic</span>
          <nav className="space-x-6 text-sm text-gray-300 hidden sm:block">
            <a href="#features" className="hover:text-cyan-400 transition">Features</a>
            <a href="#how-it-works" className="hover:text-cyan-400 transition">How It Works</a>
            <a href="#testimonials" className="hover:text-cyan-400 transition">Testimonials</a>
          </nav>
          <div className="space-x-3">
            <Link href="/login">
              <button className="text-cyan-400 hover:text-white border border-cyan-500 px-4 py-2 rounded transition text-sm">
                Login
              </button>
            </Link>
            <Link href="/signup">
              <button className="bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded transition text-sm font-semibold">
                Sign Up
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="hero" className="px-6 py-24 text-center max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold text-cyan-400 mb-6">
          CalmClinic: AI Health Assistant for Clinics
        </h1>
        <p className="text-xl text-gray-300 mb-8">
          A white-labeled, QR-based AI assistant that helps patients in your waiting room — trusted, customizable, and beautifully simple.
        </p>
        <div className="flex justify-center">
          <Link href="/signup">
            <button className="bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-3 px-6 rounded-xl transition shadow-lg">
              Try CalmClinic
            </button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="px-6 py-20 max-w-5xl mx-auto grid gap-12 sm:grid-cols-2 text-gray-200">
        <div>
          <h2 className="text-3xl font-semibold mb-4 text-cyan-300">What CalmClinic Offers</h2>
          <ul className="space-y-4 text-lg">
            <li>
              • AI-powered chat assistant for patient questions and education
            </li>
            <li>
              • Clinic-branded customization with live updates
            </li>
            <li>
              • AI tools for symptom insights and care direction (coming soon)
            </li>
            <li>
              • QR-based setup — no apps, no downloads, no hassle
            </li>
          </ul>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl p-6 flex flex-col gap-4 max-w-md mx-auto">
          <div className="flex justify-between items-center text-gray-300">
            <span className="text-sm font-medium text-cyan-300">CalmClinic AI Chat</span>
            <span className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded">Live Preview</span>
          </div>
          <div className="bg-black rounded-lg px-4 py-3 text-gray-100 text-sm leading-relaxed border border-gray-600">
            👋 Hello! I’m your clinic’s AI assistant. <br />
            I can help answer your questions while you wait.<br /><br />
            Ask me anything — symptoms, wait time, visit prep, and more!
          </div>
            <div className="flex gap-2 text-xs text-gray-400">
              <div className="bg-gray-700 px-3 py-1 rounded-full">{'💡"What should I bring?"'}</div>
              <div className="bg-gray-700 px-3 py-1 rounded-full">💡&quot;How long is the wait?&quot;</div>
            </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="px-6 py-20 bg-gray-900">
        <h2 className="text-3xl font-bold text-center text-cyan-400 mb-12">
          How It Works
        </h2>
        <div className="max-w-4xl mx-auto grid sm:grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-5xl mb-4">1</div>
            <p>Scan the QR code in the waiting room</p>
          </div>
          <div>
            <div className="text-5xl mb-4">2</div>
            <p>Chat with your clinic’s AI assistant</p>
          </div>
          <div>
            <div className="text-5xl mb-4">3</div>
            <p>Get help, feel heard, and prep for your visit</p>
          </div>
        </div>
      </section>

      {/* Testimonials / Trust Section */}
      <section id="testimonials" className="px-6 py-20 max-w-4xl mx-auto text-center text-gray-400">
        <h2 className="text-2xl font-semibold mb-6 text-cyan-300">Trusted by clinics</h2>
        <p className="italic mb-4">
          "CalmClinic transformed our waiting room experience. Patients love it."
        </p>
        <p>— Placeholder Clinic Name</p>
      </section>

      {/* Final CTA */}
      <section className="px-6 py-16 text-center">
        <h2 className="text-3xl font-bold mb-6 text-cyan-400">
          Ready to transform your clinic?
        </h2>
        <div className="flex justify-center gap-4">
          <Link href="/signup">
            <button className="bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-3 px-6 rounded-xl transition shadow-lg">
              Sign Up Now
            </button>
          </Link>
          <a href="#value">
            <button className="border border-cyan-500 hover:bg-cyan-500 hover:text-white text-cyan-400 font-semibold py-3 px-6 rounded-xl transition">
              Learn More
            </button>
          </a>
        </div>
      </section>

      {/* Why Clinics Love CalmClinic */}
      <section id="value" className="px-6 py-20 bg-gray-950 border-t border-gray-800">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-cyan-400 mb-8">Why Clinics Love CalmClinic</h2>
          <div className="grid sm:grid-cols-2 gap-10 text-left text-gray-300 text-lg">
            <div>
              <h3 className="text-xl font-semibold text-cyan-300 mb-2">Reduces Front Desk Overload</h3>
              <p>Patients get answers to common questions — like hours, directions, or visit expectations — without needing to wait in line.</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-cyan-300 mb-2">Improves Patient Satisfaction</h3>
              <p>With an AI that listens and guides them while they wait, patients feel acknowledged and supported — right from the start.</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-cyan-300 mb-2">Easy, QR-Based Setup</h3>
              <p>No app downloads. No accounts. Just a QR code and a simple chat. Your clinic is live in minutes.</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-cyan-300 mb-2">Clinic Branding, Your Way</h3>
              <p>Customize tone, instructions, and even the assistant&apos;s name. CalmClinic becomes an extension of your care philosophy.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Who It's For */}
      <section id="audience" className="px-6 py-20 bg-black border-t border-gray-800">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-cyan-400 mb-8">Who It’s For</h2>
          <div className="grid sm:grid-cols-3 gap-8 text-left text-gray-300 text-lg">
            <div>
              <h3 className="text-xl font-semibold text-cyan-300 mb-2">Primary Care Clinics</h3>
              <p>Improve communication, triage better, and prep patients for common visit types.</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-cyan-300 mb-2">Urgent Care Centers</h3>
              <p>Help patients get care faster by reducing repetitive questions and confusion in busy lobbies.</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-cyan-300 mb-2">Specialty Practices</h3>
              <p>Deliver helpful info specific to your treatments and approach — even before patients walk in.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}