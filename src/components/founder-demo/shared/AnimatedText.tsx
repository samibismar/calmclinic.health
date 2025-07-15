"use client";

import { motion } from "framer-motion";

interface AnimatedTextProps {
  text: string;
  className?: string;
  variant?: 'hero' | 'heading' | 'subheading' | 'body';
  delay?: number;
  stagger?: boolean;
}

export default function AnimatedText({ 
  text, 
  className = "", 
  variant = 'body',
  delay = 0,
  stagger = false
}: AnimatedTextProps) {
  
  const getVariantStyles = () => {
    switch (variant) {
      case 'hero':
        return "text-4xl md:text-6xl lg:text-7xl font-bold leading-tight";
      case 'heading':
        return "text-2xl md:text-3xl lg:text-4xl font-semibold leading-tight";
      case 'subheading':
        return "text-lg md:text-xl lg:text-2xl font-medium leading-relaxed";
      case 'body':
        return "text-base md:text-lg leading-relaxed";
      default:
        return "";
    }
  };

  if (stagger) {
    const words = text.split(' ');
    
    return (
      <div className={`${getVariantStyles()} ${className}`} style={{ textWrap: 'balance' }}>
        {words.map((word, index) => (
          <motion.span
            key={index}
            className="inline-block mr-2"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.6, 
              delay: delay + (index * 0.1),
              ease: "easeOut"
            }}
            viewport={{ once: true }}
          >
            {word}
          </motion.span>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      className={`${getVariantStyles()} ${className}`}
      style={{ textWrap: 'balance' }}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.8, 
        delay,
        ease: "easeOut"
      }}
      viewport={{ once: true }}
    >
      {text}
    </motion.div>
  );
}