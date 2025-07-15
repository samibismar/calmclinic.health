"use client";

import { motion } from "framer-motion";
import { ClinicConfig } from "../config/ClinicConfigs";

interface SectionContainerProps {
  children: React.ReactNode;
  id: string;
  className?: string;
  fullHeight?: boolean;
  clinic: ClinicConfig;
  backgroundType?: 'gradient' | 'solid' | 'pattern';
}

export default function SectionContainer({ 
  children, 
  id, 
  className = "", 
  fullHeight = true,
  clinic,
  backgroundType = 'gradient'
}: SectionContainerProps) {
  
  const getBackgroundStyle = () => {
    switch (backgroundType) {
      case 'gradient':
        return {
          background: `linear-gradient(135deg, ${clinic.colors.background} 0%, ${clinic.colors.primary}15 100%)`
        };
      case 'solid':
        return {
          backgroundColor: clinic.colors.background
        };
      case 'pattern':
        return {
          backgroundColor: clinic.colors.background,
          backgroundImage: `radial-gradient(${clinic.colors.primary}20 1px, transparent 1px)`,
          backgroundSize: '30px 30px'
        };
      default:
        return {};
    }
  };

  return (
    <motion.section
      id={id}
      className={`
        relative
        ${fullHeight ? 'min-h-screen' : 'min-h-[80vh]'}
        flex items-center justify-center
        px-6 py-20
        ${className}
      `}
      style={{
        ...getBackgroundStyle(),
        color: clinic.colors.text
      }}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      viewport={{ once: true, margin: "-100px" }}
    >
      <div className="max-w-7xl w-full mx-auto relative z-10">
        {children}
      </div>
      
      {/* Subtle overlay pattern */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, ${clinic.colors.primary} 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />
    </motion.section>
  );
}