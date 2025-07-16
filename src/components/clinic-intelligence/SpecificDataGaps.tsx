"use client";

import { useState, useEffect } from "react";
import { 
  AlertCircle, 
  Phone, 
  Globe, 
  Clock, 
  CreditCard, 
  Heart, 
  Stethoscope,
  ArrowRight,
  ExternalLink
} from "lucide-react";

interface SpecificGap {
  id: string;
  category: string;
  title: string;
  description: string;
  actionText: string;
  targetTab: string;
  priority: 'high' | 'medium' | 'low';
  icon: React.ComponentType<{ className?: string }>;
}

interface SpecificDataGapsProps {
  onNavigateToTab: (tabId: string) => void;
  clinicData: {
    id: number;
    practice_name: string;
    doctor_name: string;
    slug: string;
    specialty: string;
    primary_color: string;
  } | null;
}

export default function SpecificDataGaps({ onNavigateToTab, clinicData }: SpecificDataGapsProps) {
  const [dataGaps, setDataGaps] = useState<SpecificGap[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyzeDataGaps();
  }, [clinicData]);

  const analyzeDataGaps = async () => {
    try {
      const gaps: SpecificGap[] = [];

      // Check each data category for missing information
      const checks = await Promise.all([
        fetch('/api/clinic-intelligence/contact-info').then(r => r.json()),
        fetch('/api/clinic-intelligence/services').then(r => r.json()),
        fetch('/api/clinic-intelligence/insurance').then(r => r.json()),
        fetch('/api/clinic-intelligence/policies').then(r => r.json()),
        fetch('/api/clinic-intelligence/conditions').then(r => r.json()),
        fetch('/api/clinic-intelligence/clinic-hours').then(r => r.json())
      ]);

      const [contactInfo, services, insurance, policies, conditions, hours] = checks;

      // Check specific missing fields
      const phoneExists = contactInfo.contacts?.some((c: { contact_type: string }) => c.contact_type === 'phone');
      const emailExists = contactInfo.contacts?.some((c: { contact_type: string }) => c.contact_type === 'email');
      const websiteExists = contactInfo.contacts?.some((c: { contact_type: string }) => c.contact_type === 'website');
      const hoursExist = hours.hours?.length > 0;

      // Add specific gaps
      if (!phoneExists) {
        gaps.push({
          id: 'phone',
          category: 'Contact',
          title: 'Phone Number Missing',
          description: 'Main phone number is not specified for patient contact',
          actionText: 'Add Phone Number',
          targetTab: 'clinic-profile',
          priority: 'high',
          icon: Phone
        });
      }

      if (!emailExists) {
        gaps.push({
          id: 'email',
          category: 'Contact',
          title: 'Email Address Missing',
          description: 'Email address is not specified for patient inquiries',
          actionText: 'Add Email',
          targetTab: 'clinic-profile',
          priority: 'medium',
          icon: Globe
        });
      }

      if (!websiteExists) {
        gaps.push({
          id: 'website',
          category: 'Contact',
          title: 'Website URL Missing',
          description: 'Website URL is not specified for online presence',
          actionText: 'Add Website',
          targetTab: 'clinic-profile',
          priority: 'medium',
          icon: Globe
        });
      }

      if (!hoursExist) {
        gaps.push({
          id: 'hours',
          category: 'Operations',
          title: 'Operating Hours Missing',
          description: 'Operating hours are not specified for any day of the week',
          actionText: 'Set Hours',
          targetTab: 'clinic-profile',
          priority: 'high',
          icon: Clock
        });
      }

      if (!services.services?.length) {
        gaps.push({
          id: 'services',
          category: 'Services',
          title: 'No Services Listed',
          description: 'No medical services are currently listed for patients',
          actionText: 'Add Services',
          targetTab: 'services',
          priority: 'high',
          icon: Stethoscope
        });
      }

      if (!insurance.plans?.length) {
        gaps.push({
          id: 'insurance',
          category: 'Insurance',
          title: 'No Insurance Plans',
          description: 'No insurance plans are listed for patient reference',
          actionText: 'Add Insurance',
          targetTab: 'insurance',
          priority: 'high',
          icon: CreditCard
        });
      }

      if (!policies.policies?.length) {
        gaps.push({
          id: 'policies',
          category: 'Policies',
          title: 'No Patient Policies',
          description: 'No patient policies are listed (cancellation, payment, etc.)',
          actionText: 'Add Policies',
          targetTab: 'patient-experience',
          priority: 'medium',
          icon: Heart
        });
      }

      if (!conditions.conditions?.length) {
        gaps.push({
          id: 'conditions',
          category: 'Medical',
          title: 'No Conditions Listed',
          description: 'No medical conditions treated are listed for patient reference',
          actionText: 'Add Conditions',
          targetTab: 'services',
          priority: 'medium',
          icon: Stethoscope
        });
      }

      setDataGaps(gaps);
      setLoading(false);
    } catch (error) {
      console.error('Error analyzing data gaps:', error);
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-900/50 text-red-200 border-red-500/50';
      case 'medium': return 'bg-yellow-900/50 text-yellow-200 border-yellow-500/50';
      case 'low': return 'bg-green-900/50 text-green-200 border-green-500/50';
      default: return 'bg-gray-900/50 text-gray-200 border-gray-500/50';
    }
  };

  const handleFillGap = (gap: SpecificGap) => {
    onNavigateToTab(gap.targetTab);
  };

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-white/20 rounded w-1/3"></div>
          <div className="h-20 bg-white/20 rounded"></div>
          <div className="h-20 bg-white/20 rounded"></div>
        </div>
      </div>
    );
  }

  if (dataGaps.length === 0) {
    return (
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">All Data Complete!</h3>
          <p className="text-blue-200">Your clinic information is comprehensive and ready for patients.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
          <AlertCircle className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Missing Information</h3>
          <p className="text-sm text-blue-200">Complete these fields to improve your clinic profile</p>
        </div>
      </div>

      <div className="space-y-4">
        {dataGaps.map((gap) => {
          const IconComponent = gap.icon;
          return (
            <div key={gap.id} className="bg-white/5 border border-white/20 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mt-1">
                    <IconComponent className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="text-sm font-medium text-white">{gap.title}</h4>
                      <span className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(gap.priority)}`}>
                        {gap.priority}
                      </span>
                    </div>
                    <p className="text-sm text-blue-200 mb-2">{gap.description}</p>
                    <span className="text-xs text-blue-300">{gap.category}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleFillGap(gap)}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  <span>{gap.actionText}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-blue-900/30 border border-blue-500/50 rounded-lg">
        <div className="flex items-center space-x-2 mb-2">
          <ExternalLink className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium text-blue-200">Quick Tip</span>
        </div>
        <p className="text-sm text-blue-300">
          Click &quot;Fill This In&quot; buttons to navigate directly to the section where you can add the missing information. 
          Completing high-priority items first will have the biggest impact on your clinic profile.
        </p>
      </div>
    </div>
  );
}