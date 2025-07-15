"use client";

import { motion } from "framer-motion";
import { ClinicConfig } from "../config/ClinicConfigs";
import SectionContainer from "../shared/SectionContainer";
import AnimatedText from "../shared/AnimatedText";
import StaticChatInterface from "@/components/StaticChatInterface";

interface LiveDemoSectionProps {
  clinic: ClinicConfig;
}


export default function LiveDemoSection({ clinic }: LiveDemoSectionProps) {
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
              text="Your assistant, exactly as patients see it"
              variant="heading"
              className="mb-6"
            />
            <p className="text-lg leading-relaxed mb-6" style={{ color: clinic.colors.accent }}>
              This is the exact interface your patients interact with on their phones. 
              Notice the clean, professional design and {clinic.specialty.toLowerCase()}-specific responses.
            </p>
          </motion.div>

          {/* Demo features */}
          <div className="space-y-4 mb-8">
            {[
              {
                icon: "🎨",
                title: "Your Practice Branding",
                description: `${clinic.practice_name} colors, messaging, and professional identity`
              },
              {
                icon: "🩺",
                title: "Specialty-Specific Intelligence", 
                description: `Deep understanding of ${clinic.specialty.toLowerCase()} procedures and patient concerns`
              },
              {
                icon: "💬",
                title: "Real Patient Conversations",
                description: "Helpful interactions tailored to your practice"
              },
              {
                icon: "📱",
                title: "Mobile-First Design",
                description: "Clean, professional interface optimized for mobile use"
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
              Type a message in the chat to see how your AI assistant responds. 
              Every response is customized to match your practice&apos;s approach to patient care.
            </p>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: clinic.colors.secondary }}></div>
              <span>Fully functional • No login required</span>
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
            {/* Realistic phone frame */}
            <div className="relative mx-auto" style={{ width: 'fit-content' }}>
              {/* Phone outer frame */}
              <div className="relative p-2 bg-gray-900 rounded-[3rem] shadow-2xl" style={{ width: '340px' }}>
                {/* Phone screen bezel */}
                <div className="bg-black rounded-[2.5rem] p-1">
                  {/* Phone screen */}
                  <div className="bg-white rounded-[2.25rem] overflow-hidden relative" style={{ aspectRatio: '9/19.5' }}>
                    {/* Screen content with your actual ChatInterface */}
                    <div className="w-full h-full">
                      <StaticChatInterface clinicConfig={clinic} />
                    </div>
                  </div>
                </div>
                
                {/* Phone frame details */}
                <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-gray-700 rounded-full"></div>
                <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-gray-800 rounded-full"></div>
              </div>

              {/* Floating QR code */}
              <motion.div
                className="absolute -right-16 top-12 bg-white p-3 rounded-lg shadow-lg border border-gray-200"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-xs font-bold text-gray-600">
                  QR CODE
                </div>
                <div className="text-xs text-center mt-2 text-gray-600">Scan to try</div>
              </motion.div>

              {/* Floating activity indicator */}
              <motion.div
                className="absolute -left-16 top-24 bg-white p-3 rounded-lg shadow-lg border border-gray-200"
                animate={{ x: [-5, 5, -5] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-gray-600">Live</span>
                </div>
              </motion.div>
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
                Experience the full assistant
              </p>
              <a
                href={`/chat?c=q-1749792526975`}
                target="_blank"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:shadow-lg transform hover:-translate-y-0.5"
                style={{ 
                  backgroundColor: clinic.colors.secondary,
                  color: 'white'
                }}
              >
                Try Live Demo
                <span>↗</span>
              </a>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </SectionContainer>
  );
}