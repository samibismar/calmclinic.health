"use client";

import { motion } from "framer-motion";
// import { useState } from "react";
import { ClinicConfig } from "../config/ClinicConfigs";
import SectionContainer from "../shared/SectionContainer";
import AnimatedText from "../shared/AnimatedText";

interface DifferentiatorsSectionProps {
  clinic: ClinicConfig;
}

export default function DifferentiatorsSection({ clinic }: DifferentiatorsSectionProps) {
  // const [activeFeature, setActiveFeature] = useState(0);

  return (
    <SectionContainer id="differentiators" clinic={clinic} backgroundType="gradient">
      <div className="text-center mb-16">
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <div className="text-sm font-medium tracking-wider uppercase mb-4" style={{ color: clinic.colors.secondary }}>
            What makes us different
          </div>
          <AnimatedText
            text="Why CalmClinic is different"
            variant="heading"
            className="mb-6"
          />
          <p className="text-lg max-w-3xl mx-auto" style={{ color: clinic.colors.text }}>
            Most AI tools aren&apos;t designed for healthcare. CalmClinic is built specifically 
            for medical practices with the right context and boundaries.
          </p>
        </motion.div>
      </div>

      <div className="max-w-6xl mx-auto">
        <div className="text-center p-8">
          <h3 className="text-2xl font-semibold mb-4" style={{ color: clinic.colors.primary }}>
            Designed for healthcare from day one
          </h3>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: clinic.colors.text }}>
            CalmClinic understands medical context, maintains appropriate boundaries, 
            and helps patients feel more prepared for their visits.
          </p>
        </div>
      </div>
    </SectionContainer>
  );
}