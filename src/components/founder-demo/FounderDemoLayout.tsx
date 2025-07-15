"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ClinicConfig } from "./config/ClinicConfigs";

// Import sections
import HeroSection from "./sections/HeroSection";
import OriginStorySection from "./sections/OriginStorySection";
import HowItWorksSection from "./sections/HowItWorksSection";
import DifferentiatorsSection from "./sections/DifferentiatorsSection";
import LiveDemoSection from "./sections/LiveDemoSection";
import CallToActionSection from "./sections/CallToActionSection";

// Import AI Guide
import AITourGuide from "./ai-guide/AITourGuide";

interface FounderDemoLayoutProps {
  clinic: ClinicConfig;
}

export default function FounderDemoLayout({ clinic }: FounderDemoLayoutProps) {
  const [currentSection, setCurrentSection] = useState('hero');
  const [tourEnabled, setTourEnabled] = useState(false);
  
  // Scroll spy to track current section
  useEffect(() => {
    const sections = ['hero', 'origin', 'how-it-works', 'differentiators', 'live-demo', 'cta'];
    
    const observerOptions = {
      root: null,
      rootMargin: '-50% 0px -50% 0px',
      threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setCurrentSection(entry.target.id);
        }
      });
    }, observerOptions);

    sections.forEach((section) => {
      const element = document.getElementById(section);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  // Apply clinic theme to CSS variables
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--clinic-primary', clinic.colors.primary);
    root.style.setProperty('--clinic-secondary', clinic.colors.secondary);
    root.style.setProperty('--clinic-accent', clinic.colors.accent);
    root.style.setProperty('--clinic-background', clinic.colors.background);
    root.style.setProperty('--clinic-text', clinic.colors.text);
  }, [clinic]);

  return (
    <main className="relative overflow-x-hidden">
      {/* Custom CSS for smooth scrolling */}
      <style jsx global>{`
        html {
          scroll-behavior: smooth;
        }
        body {
          font-family: 'Inter Variable', -apple-system, BlinkMacSystemFont, sans-serif;
        }
      `}</style>

      {/* Progress indicator */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r z-50"
        style={{
          background: `linear-gradient(90deg, ${clinic.colors.primary}, ${clinic.colors.secondary})`,
          transformOrigin: "left"
        }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 2, ease: "easeOut" }}
      />

      {/* Navigation dots */}
      <div className="fixed right-8 top-1/2 transform -translate-y-1/2 z-40 hidden lg:block">
        <nav className="flex flex-col space-y-3">
          {[
            { id: 'hero', label: 'Start' },
            { id: 'origin', label: 'Story' },
            { id: 'how-it-works', label: 'How' },
            { id: 'differentiators', label: 'Why' },
            { id: 'live-demo', label: 'Demo' },
            { id: 'cta', label: 'Next' }
          ].map((section) => (
            <motion.a
              key={section.id}
              href={`#${section.id}`}
              className={`
                group relative block w-3 h-3 rounded-full border-2 transition-all duration-300
                ${currentSection === section.id 
                  ? 'border-current scale-125' 
                  : 'border-white/40 hover:border-white/70'
                }
              `}
              style={{
                backgroundColor: currentSection === section.id ? clinic.colors.primary : 'transparent'
              }}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
            >
              <span className="absolute right-6 top-1/2 transform -translate-y-1/2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {section.label}
              </span>
            </motion.a>
          ))}
        </nav>
      </div>

      {/* Tour toggle button */}
      <motion.button
        onClick={() => setTourEnabled(!tourEnabled)}
        className={`
          fixed bottom-8 left-8 z-40 px-4 py-2 rounded-full text-sm font-medium
          transition-all duration-300 shadow-lg backdrop-blur-sm
          ${tourEnabled 
            ? 'bg-white/90 text-gray-900' 
            : 'bg-black/80 text-white border border-white/20'
          }
        `}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 3 }}
      >
        {tourEnabled ? '👋 AI Guide: ON' : '🤖 AI Guide: OFF'}
      </motion.button>

      {/* Sections */}
      <HeroSection clinic={clinic} />
      <OriginStorySection clinic={clinic} />
      <HowItWorksSection clinic={clinic} />
      <DifferentiatorsSection clinic={clinic} />
      <LiveDemoSection clinic={clinic} />
      <CallToActionSection clinic={clinic} />

      {/* AI Tour Guide */}
      <AITourGuide 
        clinic={clinic}
        isActive={tourEnabled}
        currentSection={currentSection}
        onSectionChange={(section) => {
          document.getElementById(section)?.scrollIntoView({ behavior: 'smooth' });
        }}
      />
    </main>
  );
}