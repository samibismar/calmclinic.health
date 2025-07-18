"use client";

import { useState } from "react";
import { 
  ChevronDown, 
  ChevronUp,
  HelpCircle, 
  Mail, 
  MessageSquare,
  FileText,
  Lightbulb
} from "lucide-react";

const faqs = [
  {
    id: 1,
    question: "How do I set up my AI assistant?",
    answer: "Go to your Dashboard → AI Configuration. Click 'Generate System Prompt' to create an intelligent prompt based on your clinic data. You can then customize the tone, languages, and personality settings to match your practice."
  },
  {
    id: 2,
    question: "Why isn't my AI assistant using the information I added?",
    answer: "Make sure you've completed your Clinic Intelligence sections (profile, services, hours, etc.) and generated a new system prompt. The AI assistant pulls from this data to provide accurate responses to patients."
  },
  {
    id: 3,
    question: "Can I customize what my AI assistant says?",
    answer: "Yes! In AI Configuration, you can set the tone (professional, friendly, empathetic), add 'Always Include' guidelines, set 'Never Include' restrictions, and configure fallback responses for specific situations."
  },
  {
    id: 4,
    question: "How do I add my clinic's information?",
    answer: "Visit Dashboard → Clinic Intelligence. Fill out all sections: Profile, Contact Info, Hours, Services, Insurance, Common Questions, Policies, and Conditions. This data helps your AI provide accurate, clinic-specific responses."
  },
  {
    id: 5,
    question: "My chat interface isn't working. What should I do?",
    answer: "First, ensure your clinic setup is complete and you have a current system prompt. Try refreshing the page or testing with a different browser. If issues persist, contact our support team."
  },
  {
    id: 6,
    question: "How do I manage multiple providers?",
    answer: "Go to Dashboard → Provider Management. You can add new providers, edit existing ones, and manage their specialties and information. Each provider's data is used to personalize patient interactions."
  },
  {
    id: 7,
    question: "Can I see previous versions of my AI prompts?",
    answer: "Yes! In AI Configuration → Version History, you can view all previous system prompts, see when they were created, and restore any previous version if needed."
  },
  {
    id: 8,
    question: "Is my patient data secure?",
    answer: "Absolutely. We follow HIPAA compliance standards. Patient names and sensitive information are not stored or processed by our AI systems. All data is encrypted and secure."
  },
  {
    id: 9,
    question: "How do I customize the look of my chat interface?",
    answer: "Go to Dashboard → Customize to change colors, styling, and branding of your chat interface. You can match it to your practice's visual identity."
  },
  {
    id: 10,
    question: "What should I do if the AI gives incorrect information?",
    answer: "Update your Clinic Intelligence data and regenerate your system prompt. You can also set specific 'Never Include' restrictions and custom fallback responses for common scenarios."
  }
];

const quickActions = [
  {
    title: "Start Setup",
    description: "Complete your clinic setup in 5 minutes",
    href: "/dashboard/clinic-intelligence",
    icon: Lightbulb
  },
  {
    title: "AI Configuration",
    description: "Configure your AI assistant's personality",
    href: "/dashboard/ai-configuration",
    icon: MessageSquare
  },
  {
    title: "User Guide",
    description: "Step-by-step tutorials and guides",
    href: "#",
    icon: FileText
  }
];

export default function SupportPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (id: number) => {
    setOpenFaq(openFaq === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 to-blue-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center">
              <HelpCircle className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-4">Support Center</h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Get help with your CalmClinic AI assistant and platform features
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <a
                key={index}
                href={action.href}
                className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 hover:bg-white/20 transition-all duration-200 group"
              >
                <Icon className="w-8 h-8 text-blue-400 mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-semibold mb-2">{action.title}</h3>
                <p className="text-blue-200 text-sm">{action.description}</p>
              </a>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-8">
          <h2 className="text-2xl font-bold mb-6 text-center">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div key={faq.id} className="border-b border-white/20 pb-4">
                <button
                  onClick={() => toggleFaq(faq.id)}
                  className="w-full flex items-center justify-between text-left hover:text-blue-300 transition-colors"
                >
                  <h3 className="text-lg font-medium pr-8">{faq.question}</h3>
                  {openFaq === faq.id ? (
                    <ChevronUp className="w-5 h-5 text-blue-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-blue-400 flex-shrink-0" />
                  )}
                </button>
                {openFaq === faq.id && (
                  <div className="mt-4 text-blue-200 leading-relaxed">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contact Support */}
        <div className="mt-12 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-8">
          <h2 className="text-2xl font-bold mb-6 text-center">Need More Help?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="text-center">
              <Mail className="w-12 h-12 text-blue-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Email Support</h3>
              <p className="text-blue-200 mb-4">Get detailed help via email</p>
              <a
                href="mailto:sbismar2025@gmail.com"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
              >
                sbismar2025@gmail.com
              </a>
            </div>
            <div className="text-center">
              <MessageSquare className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Direct Contact</h3>
              <p className="text-blue-200 mb-4">Call Sami Bismar directly</p>
              <a
                href="tel:8172436226"
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
              >
                817-243-6226
              </a>
            </div>
          </div>
          
          {/* Additional Developer Contact Info */}
          <div className="mt-8 p-4 bg-blue-900/30 border border-blue-500/30 rounded-lg text-center">
            <h4 className="text-lg font-semibold text-blue-200 mb-2">Developer Contact</h4>
            <p className="text-blue-300 text-sm mb-3">
              For technical issues or feature requests, contact the developer directly:
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-blue-400" />
                <span className="text-blue-200">sbismar2025@gmail.com</span>
              </div>
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-4 h-4 text-green-400" />
                <span className="text-blue-200">817-243-6226</span>
              </div>
            </div>
          </div>
        </div>

        {/* Back to Dashboard */}
        <div className="mt-12 text-center">
          <a
            href="/dashboard"
            className="inline-flex items-center space-x-2 text-blue-300 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to Dashboard</span>
          </a>
        </div>
      </div>
    </div>
  );
}