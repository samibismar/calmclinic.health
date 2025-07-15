"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { ClinicConfig } from "../config/ClinicConfigs";
import SectionContainer from "../shared/SectionContainer";
import AnimatedText from "../shared/AnimatedText";

interface CallToActionSectionProps {
  clinic: ClinicConfig;
}

export default function CallToActionSection({ clinic }: CallToActionSectionProps) {
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate form submission
    setSubmitted(true);
    
    // Reset form after 3 seconds
    setTimeout(() => {
      setSubmitted(false);
      setContactForm({ name: '', email: '', message: '' });
    }, 3000);
  };

  return (
    <SectionContainer id="cta" clinic={clinic} backgroundType="gradient">
      <div className="max-w-4xl mx-auto text-center">
        
        {/* Opening */}
        <motion.div
          className="mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <div className="text-sm font-medium tracking-wider uppercase mb-4" style={{ color: clinic.colors.secondary }}>
            Ready to transform patient care?
          </div>
          <AnimatedText
            text="Ready to try CalmClinic?"
            variant="heading"
            className="mb-8"
          />
          <p className="text-xl leading-relaxed max-w-3xl mx-auto" style={{ color: clinic.colors.text }}>
            {clinic.cta_message}
          </p>
        </motion.div>

        {/* What's included */}
        <motion.div
          className="grid md:grid-cols-3 gap-8 mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          viewport={{ once: true }}
        >
          {[
            {
              icon: "🚀",
              title: "Quick Setup",
              description: "Live in your practice within 24 hours"
            },
            {
              icon: "🎨",
              title: "Full Customization",
              description: "Branded exactly for your practice"
            },
            {
              icon: "📈",
              title: "Continuous Updates",
              description: "Regular feature releases and performance optimization"
            }
          ].map((item, index) => (
            <motion.div
              key={index}
              className="p-6 rounded-xl backdrop-blur-sm"
              style={{ backgroundColor: `${clinic.colors.primary}15` }}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 + (index * 0.1) }}
              viewport={{ once: true }}
            >
              <div className="text-3xl mb-4">{item.icon}</div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: clinic.colors.primary }}>
                {item.title}
              </h3>
              <p className="text-sm" style={{ color: clinic.colors.text }}>
                {item.description}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Contact form or direct contact */}
        <motion.div
          className="max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          viewport={{ once: true }}
        >
          {clinic.contact_preference === 'form' ? (
            <div 
              className="p-8 rounded-2xl backdrop-blur-sm shadow-xl"
              style={{ backgroundColor: `${clinic.colors.background}40` }}
            >
              <h3 className="text-xl font-semibold mb-6" style={{ color: clinic.colors.primary }}>
                Let&apos;s start the conversation
              </h3>
              
              {!submitted ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Your name"
                      value={contactForm.name}
                      onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-opacity-50 text-gray-900"
                      style={{ '--tw-ring-color': clinic.colors.primary } as React.CSSProperties}
                      required
                    />
                    <input
                      type="email"
                      placeholder="Email address"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-opacity-50 text-gray-900"
                      style={{ '--tw-ring-color': clinic.colors.primary } as React.CSSProperties}
                      required
                    />
                  </div>
                  <textarea
                    placeholder="Tell us about your practice and what interests you most about CalmClinic..."
                    value={contactForm.message}
                    onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-opacity-50 text-gray-900"
                    style={{ '--tw-ring-color': clinic.colors.primary } as React.CSSProperties}
                    required
                  />
                  <motion.button
                    type="submit"
                    className="w-full py-4 rounded-xl font-semibold text-lg text-white transition-all duration-300 shadow-lg"
                    style={{ backgroundColor: clinic.colors.primary }}
                    whileHover={{ 
                      scale: 1.02,
                      boxShadow: `0 20px 40px ${clinic.colors.primary}40`
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Let&apos;s talk &rarr;
                  </motion.button>
                </form>
              ) : (
                <motion.div
                  className="text-center py-8"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="text-4xl mb-4">🎉</div>
                  <h3 className="text-xl font-semibold mb-2" style={{ color: clinic.colors.secondary }}>
                    Message received!
                  </h3>
                  <p style={{ color: clinic.colors.text }}>
                    I&apos;ll be in touch within 24 hours to set up a time to chat about your practice.
                  </p>
                </motion.div>
              )}
            </div>
          ) : (
            // Direct contact information
            <div 
              className="p-8 rounded-2xl backdrop-blur-sm text-center"
              style={{ backgroundColor: `${clinic.colors.background}40` }}
            >
              <h3 className="text-xl font-semibold mb-6" style={{ color: clinic.colors.primary }}>
                Ready to get started?
              </h3>
              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-lg font-medium" style={{ color: clinic.colors.text }}>Call us directly:</p>
                  <a 
                    href={`tel:${clinic.contact_phone}`}
                    className="text-2xl font-semibold hover:underline"
                    style={{ color: clinic.colors.secondary }}
                  >
                    {clinic.contact_phone}
                  </a>
                </div>
                <div>
                  <p className="text-lg font-medium" style={{ color: clinic.colors.text }}>Or email:</p>
                  <a 
                    href={`mailto:${clinic.contact_email}`}
                    className="text-lg hover:underline"
                    style={{ color: clinic.colors.secondary }}
                  >
                    {clinic.contact_email}
                  </a>
                </div>
              </div>
              <p className="text-sm" style={{ color: clinic.colors.text }}>
                We typically respond within 2 hours during business hours.
              </p>
            </div>
          )}
        </motion.div>

        {/* Final testimonial or validation */}
        {clinic.testimonial_quote && (
          <motion.div
            className="mt-16 p-8 rounded-2xl border-l-4"
            style={{ 
              backgroundColor: `${clinic.colors.secondary}10`,
              borderColor: clinic.colors.secondary
            }}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            viewport={{ once: true }}
          >
            <p className="text-lg italic mb-4" style={{ color: clinic.colors.text }}>
              &ldquo;{clinic.testimonial_quote}&rdquo;
            </p>
            <div className="text-sm" style={{ color: clinic.colors.accent }}>
              — Early partner feedback
            </div>
          </motion.div>
        )}

        {/* Social proof */}
        <motion.div
          className="mt-12 pt-8 border-t border-gray-600"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1 }}
          viewport={{ once: true }}
        >
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 text-sm" style={{ color: clinic.colors.text }}>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: clinic.colors.secondary }}></div>
              <span>HIPAA-conscious design</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: clinic.colors.secondary }}></div>
              <span>No patient data stored</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: clinic.colors.secondary }}></div>
              <span>Cancel anytime</span>
            </div>
          </div>
        </motion.div>
      </div>
    </SectionContainer>
  );
}