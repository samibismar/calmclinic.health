"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import DemoAccess from "@/components/DemoAccess";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-950 text-white font-sans">
      {/* Smooth scroll CSS */}
      <style jsx global>{`
        html {
          scroll-behavior: smooth;
        }
      `}</style>
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-xl font-semibold text-cyan-400">CalmClinic</span>
          <nav className="space-x-6 text-sm text-gray-300 hidden sm:block">
            <a href="#features" className="hover:text-cyan-400 transition">Features</a>
            <a href="#how-it-works" className="hover:text-cyan-400 transition">How It Works</a>
            <a href="#demo" className="hover:text-cyan-400 transition">Demo</a>
          </nav>
          <div className="space-x-3">
            <Link href="/login">
              <button className="text-cyan-400 hover:text-white border border-cyan-500 px-4 py-2 rounded transition text-sm">
                Login
              </button>
            </Link>
            <Link href="/signup-unavailable">
              <button className="bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded transition text-sm font-semibold">
                Sign Up
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="hero" className="px-6 py-24 text-center max-w-5xl mx-auto relative">
        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[
            { left: 25, top: 70, duration: 5, delay: 0.5 },
            { left: 35, top: 65, duration: 4.5, delay: 1.2 },
            { left: 55, top: 80, duration: 6, delay: 0.8 },
            { left: 70, top: 75, duration: 4.8, delay: 2.1 },
            { left: 45, top: 85, duration: 5.5, delay: 0.3 },
            { left: 65, top: 60, duration: 4.2, delay: 1.8 },
            { left: 30, top: 90, duration: 5.8, delay: 1.5 },
            { left: 75, top: 68, duration: 4.6, delay: 0.9 }
          ].map((particle, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-cyan-400/30"
              style={{
                left: `${particle.left}%`,
                top: `${particle.top}%`,
              }}
              animate={{
                y: [-10, -40, -10],
                opacity: [0, 0.6, 0],
              }}
              transition={{
                duration: particle.duration,
                repeat: Infinity,
                delay: particle.delay,
              }}
            />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.h1 
            className="text-5xl md:text-6xl font-bold mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              AI that helps patients
            </span>
            <br />
            <span className="text-white">feel heard.</span>
          </motion.h1>
          
          <motion.p 
            className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Reduce front desk calls by 40%. White-labeled AI assistant that helps patients in your waiting room.
          </motion.p>
          
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <Link href="#demo">
              <motion.button 
                className="bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-3 px-8 rounded-xl transition shadow-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                See Live Demo
              </motion.button>
            </Link>
            <Link href="/signup-unavailable">
              <motion.button 
                className="border border-cyan-500 hover:bg-cyan-500 hover:text-white text-cyan-400 font-semibold py-3 px-8 rounded-xl transition"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Get Started
              </motion.button>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Learn More Section */}
      <section id="learn-more" className="px-6 py-16 text-center bg-gray-900/50">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
            The AI assistant your clinic needs
          </h2>
          <div className="max-w-4xl mx-auto mb-8">
            <p className="text-xl text-gray-300 leading-relaxed mb-6">
              Every clinic gets their own branded AI health assistant. Patients scan a QR code, get instant help, 
              and feel more confident about their care—while your front desk focuses on what matters most.
            </p>
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-cyan-400 font-bold text-lg">✓ No App Required</div>
                <div className="text-sm text-gray-300">Works on any phone</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-cyan-400 font-bold text-lg">✓ Fully Customizable</div>
                <div className="text-sm text-gray-300">Your brand, your way</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-cyan-400 font-bold text-lg">✓ Live in Minutes</div>
                <div className="text-sm text-gray-300">Quick setup process</div>
              </div>
            </div>
          </div>
          <motion.a
            href="#features"
            className="inline-block border border-cyan-500 hover:bg-cyan-500 hover:text-white text-cyan-400 font-semibold py-3 px-8 rounded-xl transition"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Explore Features
          </motion.a>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="px-6 py-20 max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Everything clinics need to engage patients
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            QR-based setup, clinic branding, and AI that actually helps patients feel heard.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              icon: "🤖",
              title: "AI-Powered Assistant",
              description: "Smart conversations that handle patient questions, reduce front desk calls, and improve satisfaction"
            },
            {
              icon: "🎨", 
              title: "Your Clinic's Brand",
              description: "Fully customized with your colors, messaging, and professional identity"
            },
            {
              icon: "📱",
              title: "QR Code Simple",
              description: "Patients scan, chat, and get help instantly. No apps, no accounts, no complexity"
            },
            {
              icon: "⚡",
              title: "Live in Minutes",
              description: "Deploy your AI assistant in under 10 minutes with our simple setup process"
            },
            {
              icon: "📊",
              title: "Real Results",
              description: "Track patient interactions, common questions, and front desk call reduction"
            },
            {
              icon: "🔒",
              title: "HIPAA Compliant",
              description: "Built for healthcare with privacy and security as top priorities"
            }
          ].map((feature, index) => (
            <motion.div
              key={index}
              className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 hover:bg-gray-800/70 transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -5 }}
            >
              <div className="text-3xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
              <p className="text-gray-300">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="px-6 py-20 bg-gray-900">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-cyan-400 mb-4">
            How It Works
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Three simple steps to transform your patient experience
          </p>
        </motion.div>
        
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-12 text-center">
          {[
            {
              step: "1",
              title: "Scan QR Code",
              description: "Patients scan the QR code in your waiting room with their phone camera"
            },
            {
              step: "2", 
              title: "Chat with AI",
              description: "They're instantly connected to your clinic's branded AI assistant"
            },
            {
              step: "3",
              title: "Feel Heard", 
              description: "Get personalized help, reduce anxiety, and prepare for their visit"
            }
          ].map((item, index) => (
            <motion.div
              key={index}
              className="relative"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              viewport={{ once: true }}
            >
              <div className="bg-gradient-to-br from-cyan-500 to-blue-600 w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white mx-auto mb-6 shadow-lg">
                {item.step}
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">{item.title}</h3>
              <p className="text-gray-300 leading-relaxed">{item.description}</p>
              
              {index < 2 && (
                <div className="hidden md:block absolute top-8 -right-6 text-cyan-400">
                  →
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* Demo Section */}
      <section id="demo" className="px-6 py-20 bg-gray-950 border-t border-gray-800">
        <motion.div 
          className="max-w-4xl mx-auto text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            See CalmClinic in action
          </h2>
          <p className="text-xl text-gray-300 mb-12">
            Experience how your clinic's AI assistant will help patients feel heard.
          </p>
          
          <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-8">
            <DemoAccess />
          </div>
        </motion.div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="px-6 py-20 max-w-4xl mx-auto text-center text-gray-400">
        <h2 className="text-2xl font-semibold mb-6 text-cyan-300">Contact Us for a Demo</h2>
        <p className="mb-2">We’re currently partnering with a few local clinics to test CalmClinic and shape it around real workflows.</p>
        <p className="mb-6">If you’re interested, reach out directly — we’d love to show you the product.</p>
        <div className="space-y-2 text-base text-gray-300">
          <p><span className="font-semibold text-white">Call:</span> 817-243-6226</p>
          <p><span className="font-semibold text-white">Sami Bismar:</span> sbismar2025@gmail.com</p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 py-20 text-center bg-gradient-to-br from-gray-900 to-black">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Ready to reduce front desk calls?
            </span>
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Join clinics already using CalmClinic to improve patient satisfaction and reduce staff workload.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/signup-unavailable">
              <motion.button 
                className="bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-4 px-8 rounded-xl transition shadow-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Get Started Free
              </motion.button>
            </Link>
            <Link href="#demo">
              <motion.button 
                className="border border-cyan-500 hover:bg-cyan-500 hover:text-white text-cyan-400 font-semibold py-4 px-8 rounded-xl transition"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                See Live Demo
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Why Clinics Love CalmClinic */}
      <section id="value" className="px-6 py-20 bg-gray-950 border-t border-gray-800">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Proven results that matter
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Real outcomes from clinics using CalmClinic to improve patient care
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                metric: "24/7",
                title: "Always Available",
                description: "Your AI assistant is ready to help patients any time, even after hours"
              },
              {
                metric: "Zero",
                title: "App Downloads Required", 
                description: "Patients just scan a QR code—no installations, accounts, or complexity"
              },
              {
                metric: "Minutes",
                title: "To Get Started",
                description: "Quick setup process gets your clinic's AI assistant live fast"
              },
              {
                metric: "Fully",
                title: "HIPAA Compliant",
                description: "Built specifically for healthcare with security and privacy as priorities"
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                className="bg-gray-800/30 border border-gray-700 rounded-xl p-8 text-center hover:bg-gray-800/50 transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
              >
                <div className="text-4xl md:text-5xl font-bold text-cyan-400 mb-4">
                  {item.metric}
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  {item.title}
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Who It's For */}
      <section id="audience" className="px-6 py-20 bg-black border-t border-gray-800">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-cyan-400 mb-8">Who It&apos;s For</h2>
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