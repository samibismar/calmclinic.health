"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { ClinicConfig } from "../config/ClinicConfigs";
import SectionContainer from "../shared/SectionContainer";
import AnimatedText from "../shared/AnimatedText";

interface HowItWorksSectionProps {
  clinic: ClinicConfig;
}

export default function HowItWorksSection({ clinic }: HowItWorksSectionProps) {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    { title: "Patient Arrives", icon: "🚶‍♀️" },
    { title: "Scan QR Code", icon: "📱" },
    { title: "Meet AI Assistant", icon: "🤖" },
    { title: "Helpful Conversation", icon: "💬" },
    { title: "Better Visit", icon: "✨" }
  ];

  return (
    <SectionContainer id="how-it-works" clinic={clinic} backgroundType="pattern">
      <div className="text-center mb-16">
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <div className="text-sm font-medium tracking-wider uppercase mb-4" style={{ color: clinic.colors.secondary }}>
            The patient journey
          </div>
          <AnimatedText
            text="How CalmClinic transforms every visit"
            variant="heading"
            className="mb-6"
          />
          <p className="text-lg max-w-3xl mx-auto" style={{ color: clinic.colors.accent }}>
            A simple, seamless experience that takes patients from anxious to informed in just a few taps.
          </p>
        </motion.div>
      </div>

      <div className="max-w-6xl mx-auto">
        <div className="flex justify-center gap-8 mb-12">
          {steps.map((step, index) => (
            <motion.button
              key={index}
              className="flex flex-col items-center p-4 rounded-xl transition-all duration-300"
              style={{
                backgroundColor: index <= activeStep ? clinic.colors.primary : `${clinic.colors.primary}40`,
                color: 'white'
              }}
              onClick={() => setActiveStep(index)}
              whileHover={{ scale: 1.05 }}
            >
              <div className="text-2xl mb-2">{step.icon}</div>
              <div className="text-sm font-medium">{step.title}</div>
            </motion.button>
          ))}
        </div>

        <div className="text-center">
          <motion.button
            onClick={() => setActiveStep((activeStep + 1) % steps.length)}
            className="px-6 py-3 rounded-full border-2 transition-all duration-300"
            style={{ 
              borderColor: clinic.colors.secondary,
              color: clinic.colors.secondary
            }}
            whileHover={{ 
              backgroundColor: clinic.colors.secondary,
              color: 'white'
            }}
          >
            Next Step &rarr;
          </motion.button>
        </div>
      </div>
    </SectionContainer>
  );
}