"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, BarChart3, Building2, Users, Stethoscope, CreditCard, Heart, Bot, HelpCircle, FileText } from "lucide-react";
import Link from "next/link";

// Tab components (we'll create these)
import OverviewTab from "@/components/clinic-intelligence/OverviewTab";
import ClinicProfileTab from "@/components/clinic-intelligence/ClinicProfileTab";
import ProvidersTab from "@/components/clinic-intelligence/ProvidersTab";
import ServicesTab from "@/components/clinic-intelligence/ServicesTab";
import InsuranceTab from "@/components/clinic-intelligence/InsuranceTab";
import PatientExperienceTab from "@/components/clinic-intelligence/PatientExperienceTab";
import CommonQuestionsTab from "@/components/clinic-intelligence/CommonQuestionsTab";
import AdditionalInfoTab from "@/components/clinic-intelligence/AdditionalInfoTab";
import AIAssistantTab from "@/components/clinic-intelligence/AIAssistantTab";

interface ClinicData {
  id: number;
  practice_name: string;
  doctor_name: string;
  slug: string;
  specialty: string;
  primary_color: string;
}

interface DataGap {
  id: number;
  gap_category: string;
  gap_description: string;
  priority_level: number;
  is_filled: boolean;
}

const tabs = [
  {
    id: 'overview',
    name: 'Overview',
    icon: BarChart3,
    description: 'Data intelligence & gaps'
  },
  {
    id: 'clinic-profile',
    name: 'Clinic Profile',
    icon: Building2,
    description: 'Basic info & branding'
  },
  {
    id: 'providers',
    name: 'Providers',
    icon: Users,
    description: 'Doctor & staff management'
  },
  {
    id: 'services',
    name: 'Services',
    icon: Stethoscope,
    description: 'Medical & optical services'
  },
  {
    id: 'insurance',
    name: 'Insurance',
    icon: CreditCard,
    description: 'Plans & billing policies'
  },
  {
    id: 'patient-experience',
    name: 'Patient Experience',
    icon: Heart,
    description: 'Policies & procedures'
  },
  {
    id: 'common-questions',
    name: 'Common Questions',
    icon: HelpCircle,
    description: 'Patient question suggestions'
  },
  {
    id: 'additional-info',
    name: 'Additional Info',
    icon: FileText,
    description: 'Extra clinic information'
  },
  {
    id: 'ai-assistant',
    name: 'AI Assistant',
    icon: Bot,
    description: 'Configuration & preview'
  }
];

export default function ClinicIntelligencePage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [clinicData, setClinicData] = useState<ClinicData | null>(null);
  const [dataGaps, setDataGaps] = useState<DataGap[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClinicData();
    fetchDataGaps();
  }, []);

  const fetchClinicData = async () => {
    try {
      const response = await fetch('/api/dashboard/data');
      const data = await response.json();
      if (response.ok) {
        setClinicData(data.clinic);
      }
    } catch (error) {
      console.error('Error fetching clinic data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDataGaps = async () => {
    try {
      const response = await fetch('/api/clinic-intelligence/data-gaps');
      const data = await response.json();
      if (response.ok) {
        setDataGaps(data.gaps || []);
      }
    } catch (error) {
      console.error('Error fetching data gaps:', error);
    }
  };

  const handleNavigateToTab = (tabId: string) => {
    setActiveTab(tabId);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab clinicData={clinicData} dataGaps={dataGaps} onNavigateToTab={handleNavigateToTab} />;
      case 'clinic-profile':
        return <ClinicProfileTab clinicData={clinicData} />;
      case 'providers':
        return <ProvidersTab />;
      case 'services':
        return <ServicesTab />;
      case 'insurance':
        return <InsuranceTab />;
      case 'patient-experience':
        return <PatientExperienceTab />;
      case 'common-questions':
        return <CommonQuestionsTab />;
      case 'additional-info':
        return <AdditionalInfoTab />;
      case 'ai-assistant':
        return <AIAssistantTab clinicData={clinicData} />;
      default:
        return <OverviewTab clinicData={clinicData} dataGaps={dataGaps} onNavigateToTab={handleNavigateToTab} />;
    }
  };

  // Removed gap tracking logic as gap banner was removed

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-950 to-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-white/20 rounded w-1/3 mb-8"></div>
            <div className="space-y-4">
              <div className="h-32 bg-white/20 rounded"></div>
              <div className="h-96 bg-white/20 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 to-blue-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center space-x-2 text-blue-200 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </Link>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white">Clinic Intelligence</h1>
              </div>
              <p className="text-blue-100">
                Comprehensive clinic data management and AI assistant configuration
              </p>
            </div>
            
            {/* Practice name only */}
            <div className="mt-4 sm:mt-0 flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-white/10 text-blue-200 px-3 py-2 rounded-lg">
                <Building2 className="w-4 h-4" />
                <span className="text-sm font-medium">{clinicData?.practice_name}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-2">
            <nav className="flex flex-wrap gap-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-4 py-3 rounded-lg transition-all duration-200 min-w-0 flex-1 sm:flex-initial ${
                      activeTab === tab.id
                        ? 'bg-white text-blue-900 shadow-lg font-semibold'
                        : 'text-blue-200 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <div className="text-left min-w-0 hidden sm:block">
                      <div className="font-medium truncate">{tab.name}</div>
                      <div className="text-xs opacity-75 truncate">{tab.description}</div>
                    </div>
                    <div className="sm:hidden">
                      <span className="text-sm font-medium">{tab.name}</span>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="mb-8">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}