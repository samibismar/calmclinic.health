"use client";

import { motion } from "framer-motion";
import { ClinicConfig } from "../config/ClinicConfigs";
import SectionContainer from "../shared/SectionContainer";
import AnimatedText from "../shared/AnimatedText";

interface HeroSectionProps {
  clinic: ClinicConfig;
}

export default function HeroSection({ clinic }: HeroSectionProps) {
  return (
    <SectionContainer id="hero" clinic={clinic} backgroundType="gradient">
      <div className="text-center relative">
        
        {/* Floating particles animation */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full opacity-30"
              style={{ 
                backgroundColor: clinic.colors.secondary,
                left: `${Math.random() * 100}%`,
                top: `${80 + Math.random() * 20}%`,
              }}
              animate={{
                y: [-20, -100],
                opacity: [0, 0.6, 0],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 5,
              }}
            />
          ))}
        </div>

        {/* Practice name and doctor introduction */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <div className="text-sm font-medium tracking-wider uppercase mb-2" style={{ color: clinic.colors.secondary }}>
            Product Showcase
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: clinic.colors.text }}>
            {clinic.practice_name}
          </h1>
        </motion.div>

        {/* Main hero statement */}
        <div className="max-w-5xl mx-auto mb-12">
          <AnimatedText
            text="AI that helps patients feel heard."
            variant="hero"
            className="mb-4"
            stagger={true}
            delay={1}
          />
          <div
            className="bg-gradient-to-r bg-clip-text text-transparent"
            style={{
              backgroundImage: `linear-gradient(135deg, ${clinic.colors.primary}, ${clinic.colors.secondary})`,
              WebkitBackgroundClip: 'text',
              color: 'transparent'
            }}
          >
            <AnimatedText
              text="Smart, clinic-branded, ready to deploy."
              variant="hero"
              stagger={true}
              delay={1.8}
            />
          </div>
        </div>

        {/* Subtitle */}
        <motion.div
          className="max-w-3xl mx-auto mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 2.5 }}
        >
          <p className="text-xl md:text-2xl leading-relaxed" style={{ color: clinic.colors.text }}>
            A thoughtfully designed AI assistant that helps patients prepare for visits 
            and feel more confident about their care.
          </p>
        </motion.div>

        {/* Call to action */}
        <motion.div
          className="flex flex-col sm:flex-row gap-6 justify-center items-center"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 3 }}
        >
          <motion.a
            href="#origin"
            className="group px-10 py-4 rounded-xl font-semibold text-lg transition-all duration-300 shadow-xl"
            style={{ 
              backgroundColor: clinic.colors.primary,
              color: 'white'
            }}
            whileHover={{ 
              scale: 1.05,
              boxShadow: `0 20px 40px ${clinic.colors.primary}40`
            }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="flex items-center gap-2">
              See how it works
              <motion.span
                className="inline-block"
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                &rarr;
              </motion.span>
            </span>
          </motion.a>
          
          <motion.a
            href="#live-demo"
            className="px-10 py-4 rounded-xl font-semibold text-lg border-2 transition-all duration-300"
            style={{ 
              borderColor: clinic.colors.secondary,
              color: clinic.colors.secondary
            }}
            whileHover={{ 
              backgroundColor: clinic.colors.secondary,
              color: 'white',
              scale: 1.05
            }}
            whileTap={{ scale: 0.95 }}
          >
            Try Live Demo
          </motion.a>
        </motion.div>
      </div>
    </SectionContainer>
  );
}