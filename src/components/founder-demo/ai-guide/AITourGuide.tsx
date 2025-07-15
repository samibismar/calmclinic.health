"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { ClinicConfig } from "../config/ClinicConfigs";
import { getTourScript } from "./TourScript";

interface AITourGuideProps {
  clinic: ClinicConfig;
  isActive: boolean;
  currentSection: string;
  onSectionChange: (section: string) => void;
}

export default function AITourGuide({ 
  clinic, 
  isActive, 
  currentSection, 
  onSectionChange 
}: AITourGuideProps) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  
  const tourScript = getTourScript(clinic);
  const currentMessages = tourScript[currentSection] || [];
  const currentMessage = currentMessages[currentMessageIndex];

  // Reset message index when section changes
  useEffect(() => {
    if (isActive) {
      setCurrentMessageIndex(0);
      setIsExpanded(true);
    }
  }, [currentSection, isActive]);

  // Auto-advance messages
  useEffect(() => {
    if (!isActive || !currentMessage) return;

    const timer = setTimeout(() => {
      if (currentMessageIndex < currentMessages.length - 1) {
        setCurrentMessageIndex(prev => prev + 1);
      }
    }, currentMessage.duration || 4000);

    return () => clearTimeout(timer);
  }, [currentMessage, currentMessageIndex, currentMessages.length, isActive]);

  // Start tour
  const startTour = () => {
    setHasStarted(true);
    setIsExpanded(true);
    onSectionChange('hero');
  };

  // Navigate to next section
  const nextSection = () => {
    const sections = ['hero', 'origin', 'how-it-works', 'differentiators', 'live-demo', 'cta'];
    const currentIndex = sections.indexOf(currentSection);
    if (currentIndex < sections.length - 1) {
      onSectionChange(sections[currentIndex + 1]);
    }
  };

  if (!isActive) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* AI Guide Avatar */}
      <motion.div
        className="relative"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        {/* Chat bubble */}
        <AnimatePresence>
          {isExpanded && currentMessage && (
            <motion.div
              className="absolute bottom-16 right-0 w-80 p-4 rounded-2xl shadow-2xl backdrop-blur-sm border"
              style={{ 
                backgroundColor: 'white',
                borderColor: clinic.colors.primary
              }}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                    style={{ backgroundColor: clinic.colors.primary }}
                  >
                    🤖
                  </div>
                  <span className="font-semibold text-gray-800">CalmClinic Guide</span>
                </div>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="text-gray-400 hover:text-gray-600 text-lg"
                >
                  ×
                </button>
              </div>

              {/* Message */}
              <motion.p
                className="text-gray-700 text-sm leading-relaxed mb-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {currentMessage.content}
              </motion.p>

              {/* Progress indicator */}
              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  {currentMessages.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === currentMessageIndex ? 'opacity-100' : 'opacity-30'
                      }`}
                      style={{ backgroundColor: clinic.colors.primary }}
                    />
                  ))}
                </div>

                {/* Action buttons */}
                <div className="flex gap-2">
                  {currentMessageIndex === currentMessages.length - 1 && (
                    <motion.button
                      onClick={nextSection}
                      className="px-3 py-1 rounded-full text-xs font-medium text-white transition-all hover:scale-105"
                      style={{ backgroundColor: clinic.colors.secondary }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Next &rarr;
                    </motion.button>
                  )}
                </div>
              </div>

              {/* Tail */}
              <div 
                className="absolute bottom-0 right-6 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent"
                style={{ borderTopColor: 'white' }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Avatar button */}
        <motion.button
          onClick={() => {
            if (!hasStarted) {
              startTour();
            } else {
              setIsExpanded(!isExpanded);
            }
          }}
          className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white text-xl font-bold transition-all duration-300 hover:shadow-xl"
          style={{ backgroundColor: clinic.colors.primary }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          animate={currentMessage ? { 
            boxShadow: `0 0 20px ${clinic.colors.primary}40` 
          } : {}}
        >
          {!hasStarted ? '▶️' : (isExpanded ? '💬' : '🤖')}
        </motion.button>

        {/* Pulse animation when speaking */}
        {currentMessage && isExpanded && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 opacity-60"
            style={{ borderColor: clinic.colors.primary }}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}

        {/* Tour controls */}
        {hasStarted && (
          <motion.div
            className="absolute bottom-0 right-16 flex gap-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1 }}
          >
            <button
              onClick={() => setCurrentMessageIndex(Math.max(0, currentMessageIndex - 1))}
              disabled={currentMessageIndex === 0}
              className="w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center text-gray-600 disabled:opacity-50"
            >
              ←
            </button>
            <button
              onClick={() => setCurrentMessageIndex(Math.min(currentMessages.length - 1, currentMessageIndex + 1))}
              disabled={currentMessageIndex === currentMessages.length - 1}
              className="w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center text-gray-600 disabled:opacity-50"
            >
              &rarr;
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}