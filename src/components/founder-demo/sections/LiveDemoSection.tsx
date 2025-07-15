"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { ClinicConfig } from "../config/ClinicConfigs";
import SectionContainer from "../shared/SectionContainer";
import AnimatedText from "../shared/AnimatedText";

// Import the demo chat interface we already built
import { DEMO_CONVERSATION_HISTORY, DEMO_ACTIVITY_METRICS } from "../../demo/DemoClinicConfig";

interface LiveDemoSectionProps {
  clinic: ClinicConfig;
}

// Simplified embedded chat component
function EmbeddedChatDemo({ clinic }: { clinic: ClinicConfig }) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState(DEMO_CONVERSATION_HISTORY);
  const [isTyping, setIsTyping] = useState(false);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const userMessage = {
      role: 'user',
      content: message.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage("");
    setIsTyping(true);

    // Simulate response delay
    setTimeout(() => {
      const response = {
        role: 'assistant',
        content: "Thank you for your question! This is exactly the kind of helpful conversation your patients would have. Dr. Ranelle can customize every aspect of how I respond to match her practice's approach to patient care.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, response]);
      setIsTyping(false);
    }, 2000);
  };

  return (
    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-md mx-auto">
      {/* Header */}
      <div 
        className="p-4 text-white text-center"
        style={{ backgroundColor: clinic.colors.primary }}
      >
        <h3 className="font-semibold">{clinic.practice_name}</h3>
        <p className="text-sm opacity-90">Dr. {clinic.doctor_name} • {clinic.specialty}</p>
        <div className="mt-2 text-xs bg-white/20 rounded-full px-3 py-1">
          <span className="inline-block w-2 h-2 bg-green-300 rounded-full mr-2 animate-pulse"></span>
          {DEMO_ACTIVITY_METRICS.patients_helped_today} patients helped today
        </div>
      </div>

      {/* Messages */}
      <div className="h-80 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
              msg.role === 'user' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 px-3 py-2 rounded-lg">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Suggested prompts */}
      <div className="px-4 pb-2">
        <div className="flex flex-wrap gap-2">
          {clinic.suggested_prompts.slice(0, 2).map((prompt, index) => (
            <button
              key={index}
              onClick={() => setMessage(prompt)}
              className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full hover:bg-gray-200 transition-colors"
            >
              💡 {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask about your eye care visit..."
            className="flex-1 border border-gray-300 rounded-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            onClick={handleSendMessage}
            className="px-4 py-2 rounded-full text-white text-sm font-medium"
            style={{ backgroundColor: clinic.colors.primary }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LiveDemoSection({ clinic }: LiveDemoSectionProps) {
  const [demoView, setDemoView] = useState<'phone' | 'desktop'>('phone');

  return (
    <SectionContainer id="live-demo" clinic={clinic} backgroundType="solid">
      <div className="grid lg:grid-cols-2 gap-16 items-center">
        
        {/* Demo introduction */}
        <div className="order-2 lg:order-1">
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="text-sm font-medium tracking-wider uppercase mb-4" style={{ color: clinic.colors.secondary }}>
              See it in action
            </div>
            <AnimatedText
              text="Your assistant, fully customized"
              variant="heading"
              className="mb-6"
            />
            <p className="text-lg leading-relaxed mb-6" style={{ color: clinic.colors.accent }}>
              This is exactly what your patients would see when they scan the QR code. 
              Notice the branding, tone, and {clinic.specialty.toLowerCase()}-specific responses.
            </p>
          </motion.div>

          {/* Demo features */}
          <div className="space-y-4 mb-8">
            {[
              {
                icon: "🎨",
                title: "Your Practice Branding",
                description: `${clinic.practice_name} colors and identity throughout`
              },
              {
                icon: "🩺",
                title: "Specialty Knowledge", 
                description: `Understands ${clinic.specialty.toLowerCase()} procedures and terminology`
              },
              {
                icon: "💬",
                title: "Pre-seeded Conversations",
                description: "Real examples of helpful patient interactions"
              },
              {
                icon: "📊",
                title: "Live Activity Metrics",
                description: "Shows real-time engagement and usage"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                className="flex items-start gap-4 p-4 rounded-lg"
                style={{ backgroundColor: `${clinic.colors.primary}10` }}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="text-2xl">{feature.icon}</div>
                <div>
                  <h4 className="font-semibold mb-1">{feature.title}</h4>
                  <p className="text-sm" style={{ color: clinic.colors.accent }}>
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Try it yourself prompt */}
          <motion.div
            className="p-6 rounded-xl border-2 border-dashed"
            style={{ borderColor: clinic.colors.secondary }}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            viewport={{ once: true }}
          >
            <h4 className="font-semibold mb-3" style={{ color: clinic.colors.secondary }}>
              Try it yourself!
            </h4>
            <p className="text-sm mb-3" style={{ color: clinic.colors.accent }}>
              Type a message in the chat to see how your AI assistant would respond. 
              Every response can be customized to match your practice&apos;s approach.
            </p>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: clinic.colors.secondary }}></div>
              <span>No login required • Fully functional demo</span>
            </div>
          </motion.div>
        </div>

        {/* Live demo */}
        <div className="order-1 lg:order-2">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            {/* Demo view toggle */}
            <div className="flex justify-center mb-6">
              <div 
                className="flex p-1 rounded-lg"
                style={{ backgroundColor: `${clinic.colors.primary}20` }}
              >
                <button
                  onClick={() => setDemoView('phone')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    demoView === 'phone' 
                      ? 'text-white shadow-sm' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                  style={{ backgroundColor: demoView === 'phone' ? clinic.colors.primary : 'transparent' }}
                >
                  📱 Mobile View
                </button>
                <button
                  onClick={() => setDemoView('desktop')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    demoView === 'desktop' 
                      ? 'text-white shadow-sm' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                  style={{ backgroundColor: demoView === 'desktop' ? clinic.colors.primary : 'transparent' }}
                >
                  💻 Desktop View
                </button>
              </div>
            </div>

            {/* Demo container */}
            <div className="relative">
              {demoView === 'phone' && (
                <motion.div
                  className="relative"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  {/* Phone frame */}
                  <div className="relative mx-auto p-2 bg-gray-900 rounded-3xl shadow-2xl" style={{ width: 'fit-content' }}>
                    <div className="bg-black rounded-2xl p-1">
                      <EmbeddedChatDemo clinic={clinic} />
                    </div>
                  </div>

                  {/* Floating QR code */}
                  <motion.div
                    className="absolute -right-12 top-8 bg-white p-3 rounded-lg shadow-lg"
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-xs font-bold">
                      QR CODE
                    </div>
                    <div className="text-xs text-center mt-2">Scan to try</div>
                  </motion.div>
                </motion.div>
              )}

              {demoView === 'desktop' && (
                <motion.div
                  className="bg-gray-100 rounded-lg p-4 shadow-xl"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    <div className="flex-1 bg-white rounded px-3 py-1 text-xs">
                      calmclinic.health/demo/fort-worth-eye
                    </div>
                  </div>
                  <EmbeddedChatDemo clinic={clinic} />
                </motion.div>
              )}
            </div>

            {/* Call to action */}
            <motion.div
              className="text-center mt-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              viewport={{ once: true }}
            >
              <p className="text-sm mb-4" style={{ color: clinic.colors.accent }}>
                Want to see the full experience?
              </p>
              <a
                href="/demo/fort-worth-eye"
                target="_blank"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300"
                style={{ 
                  backgroundColor: clinic.colors.secondary,
                  color: 'white'
                }}
              >
                Open Full Demo
                <span>↗</span>
              </a>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </SectionContainer>
  );
}