"use client";

import { motion } from "framer-motion";
import { ClinicConfig } from "../config/ClinicConfigs";
import SectionContainer from "../shared/SectionContainer";
import AnimatedText from "../shared/AnimatedText";

interface OriginStorySectionProps {
  clinic: ClinicConfig;
}

export default function OriginStorySection({ clinic }: OriginStorySectionProps) {
  return (
    <SectionContainer id="origin" clinic={clinic} backgroundType="solid">
      <div className="grid lg:grid-cols-2 gap-16 items-center">
        
        {/* Left side - Story content */}
        <div className="order-2 lg:order-1">
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="text-sm font-medium tracking-wider uppercase mb-4" style={{ color: clinic.colors.secondary }}>
              What makes this different
            </div>
            <AnimatedText
              text="Built specifically for medical practices"
              variant="heading"
              className="mb-8"
            />
          </motion.div>

          {/* Product features */}
          <div className="space-y-8">
            {/* Intelligent Patient Engagement */}
            <motion.div
              className="relative pl-8 border-l-2"
              style={{ borderColor: clinic.colors.primary }}
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <div className="absolute w-4 h-4 rounded-full -left-2 top-1" style={{ backgroundColor: clinic.colors.primary }} />
              <div className="text-sm font-medium mb-2" style={{ color: clinic.colors.secondary }}>
                Medical Context Awareness
              </div>
              <p className="text-lg leading-relaxed" style={{ color: clinic.colors.text }}>
                Understands medical questions and provides helpful, appropriate responses while maintaining professional boundaries and proper scope.
              </p>
            </motion.div>

            {/* Seamless Integration */}
            <motion.div
              className="relative pl-8 border-l-2"
              style={{ borderColor: clinic.colors.primary }}
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              viewport={{ once: true }}
            >
              <div className="absolute w-4 h-4 rounded-full -left-2 top-1" style={{ backgroundColor: clinic.colors.primary }} />
              <div className="text-sm font-medium mb-2" style={{ color: clinic.colors.secondary }}>
                Simple Setup
              </div>
              <p className="text-lg leading-relaxed" style={{ color: clinic.colors.text }}>
                Quick deployment with QR codes and custom branding. Patients can access it instantly without downloads or signups.
              </p>
            </motion.div>

            {/* Enterprise Security */}
            <motion.div
              className="relative pl-8 border-l-2"
              style={{ borderColor: clinic.colors.secondary }}
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="absolute w-4 h-4 rounded-full -left-2 top-1" style={{ backgroundColor: clinic.colors.secondary }} />
              <div className="text-sm font-medium mb-2" style={{ color: clinic.colors.secondary }}>
                Privacy-First Design
              </div>
              <p className="text-lg leading-relaxed font-medium" style={{ color: clinic.colors.text }}>
                Built with healthcare privacy in mind. No patient data is stored, and all conversations are designed to be HIPAA-conscious.
              </p>
            </motion.div>
          </div>

          {/* Quote or emphasis */}
          <motion.div
            className="mt-12 p-6 rounded-xl bg-gradient-to-r from-transparent to-white/5 border-l-4"
            style={{ borderColor: clinic.colors.secondary }}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            viewport={{ once: true }}
          >
            <p className="text-xl font-semibold leading-relaxed" style={{ color: clinic.colors.text }}>
              Help patients feel more prepared and confident about their care while reducing common pre-visit anxiety.
            </p>
            <div className="text-sm mt-4" style={{ color: clinic.colors.accent }}>
              — The goal that drives everything we build
            </div>
          </motion.div>
        </div>

        {/* Right side - Visual elements */}
        <div className="order-1 lg:order-2">
          <motion.div
            className="relative"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
            viewport={{ once: true }}
          >
            {/* Main visual container */}
            <div 
              className="rounded-2xl p-8 shadow-2xl backdrop-blur-sm"
              style={{ backgroundColor: `${clinic.colors.primary}15` }}
            >
              
              {/* Clinic representation */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center text-2xl" 
                     style={{ backgroundColor: clinic.colors.primary, color: 'white' }}>
                  🏥
                </div>
                <h3 className="text-xl font-semibold">{clinic.practice_name}</h3>
                <p style={{ color: clinic.colors.accent }}>{clinic.specialty} Practice</p>
              </div>

              {/* Product capabilities */}
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-3 rounded-lg" style={{ backgroundColor: `${clinic.colors.background}20` }}>
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: clinic.colors.secondary }} />
                  <span className="text-sm">24/7 patient assistance</span>
                </div>
                <div className="flex items-center gap-4 p-3 rounded-lg" style={{ backgroundColor: `${clinic.colors.background}20` }}>
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: clinic.colors.secondary }} />
                  <span className="text-sm">Specialty-specific responses</span>
                </div>
                <div className="flex items-center gap-4 p-3 rounded-lg" style={{ backgroundColor: `${clinic.colors.background}20` }}>
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: clinic.colors.secondary }} />
                  <span className="text-sm">Complete practice branding</span>
                </div>
              </div>

              {/* Technical specs */}
              <motion.div
                className="text-center my-6"
                animate={{ y: [0, 5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <div className="text-sm" style={{ color: clinic.colors.accent }}>
                  Ready for Healthcare
                </div>
                <div className="text-xs mt-1" style={{ color: clinic.colors.accent }}>
                  ✓ Privacy-conscious ✓ Medical context ✓ Reliable uptime
                </div>
              </motion.div>

              {/* Product branding */}
              <div 
                className="p-4 rounded-lg border-2"
                style={{ borderColor: clinic.colors.secondary, backgroundColor: `${clinic.colors.secondary}10` }}
              >
                <div className="text-center">
                  <div className="text-lg font-semibold mb-2">CalmClinic</div>
                  <div className="text-sm" style={{ color: clinic.colors.accent }}>
                    AI assistant for better patient experiences
                  </div>
                </div>
              </div>
            </div>

            {/* Floating elements */}
            <motion.div
              className="absolute -top-4 -right-4 w-8 h-8 rounded-full"
              style={{ backgroundColor: clinic.colors.secondary }}
              animate={{ 
                rotate: 360,
                scale: [1, 1.2, 1]
              }}
              transition={{ 
                rotate: { duration: 10, repeat: Infinity, ease: "linear" },
                scale: { duration: 2, repeat: Infinity }
              }}
            />
            <motion.div
              className="absolute -bottom-6 -left-6 w-6 h-6 rounded-full"
              style={{ backgroundColor: clinic.colors.primary }}
              animate={{ 
                y: [0, -10, 0],
                opacity: [0.7, 1, 0.7]
              }}
              transition={{ duration: 3, repeat: Infinity, delay: 1 }}
            />
          </motion.div>
        </div>
      </div>
    </SectionContainer>
  );
}