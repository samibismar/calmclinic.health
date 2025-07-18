"use client";

import { useState, useEffect } from "react";
import { 
  BarChart3, 
  Users,
  Stethoscope,
  CreditCard,
  Globe,
  ArrowRight
} from "lucide-react";
import SpecificDataGaps from "./SpecificDataGaps";

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

interface OverviewTabProps {
  clinicData: ClinicData | null;
  dataGaps: DataGap[];
  onNavigateToTab: (tabId: string) => void;
}

export default function OverviewTab({ clinicData, dataGaps, onNavigateToTab }: OverviewTabProps) {
  const [completionStats, setCompletionStats] = useState({
    totalDataPoints: 8,
    completedDataPoints: 0,
    highPriorityGaps: 0,
    completionPercentage: 0
  });

  useEffect(() => {
    fetchDataCompleteness();
  }, [clinicData, dataGaps]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchDataCompleteness = async () => {
    try {
      // Calculate actual data completeness based on clinic data presence
      let completedPoints = 0;
      const totalPoints = 8; // Total data categories

      // Check if basic clinic info exists
      if (clinicData?.practice_name) completedPoints++;

      // Check each data category by fetching counts
      const checks = await Promise.all([
        fetch('/api/clinic-intelligence/contact-info').then(r => r.json()),
        fetch('/api/clinic-intelligence/services').then(r => r.json()),
        fetch('/api/clinic-intelligence/insurance').then(r => r.json()),
        fetch('/api/clinic-intelligence/policies').then(r => r.json()),
        fetch('/api/clinic-intelligence/conditions').then(r => r.json()),
        fetch('/api/clinic-intelligence/clinic-hours').then(r => r.json())
      ]);

      // Count completed data categories
      if (checks[0].contacts?.length > 0) completedPoints++; // Contact info
      if (checks[1].services?.length > 0) completedPoints++; // Services
      if (checks[2].plans?.length > 0) completedPoints++; // Insurance
      if (checks[3].policies?.length > 0) completedPoints++; // Policies
      if (checks[4].conditions?.length > 0) completedPoints++; // Conditions
      if (checks[5].hours?.length > 0) completedPoints++; // Hours
      
      // Provider info (assume complete if clinic exists)
      if (clinicData?.doctor_name) completedPoints++;

      const completionPercentage = Math.round((completedPoints / totalPoints) * 100);
      const highPriorityGaps = dataGaps.filter(gap => gap.priority_level === 3 && !gap.is_filled).length;

      setCompletionStats({
        totalDataPoints: totalPoints,
        completedDataPoints: completedPoints,
        highPriorityGaps,
        completionPercentage
      });
    } catch (error) {
      console.error('Error calculating data completeness:', error);
      // Fallback to gap-based calculation
      const totalGaps = dataGaps.length;
      const filledGaps = dataGaps.filter(gap => gap.is_filled).length;
      const highPriorityGaps = dataGaps.filter(gap => gap.priority_level === 3 && !gap.is_filled).length;
      const completionPercentage = totalGaps > 0 ? Math.round((filledGaps / totalGaps) * 100) : 0;

      setCompletionStats({
        totalDataPoints: 8,
        completedDataPoints: Math.round((completionPercentage / 100) * 8),
        highPriorityGaps,
        completionPercentage
      });
    }
  };

  const handleScraperSystemClick = () => {
    window.open('/scraper-system', '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Data Completeness Progress - Keep this */}
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-white">Data Completeness Overview</h3>
        </div>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-blue-100 text-lg">Overall Progress</span>
            <span className="text-white font-bold text-xl">{completionStats.completionPercentage}%</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-3">
            <div 
              className="bg-blue-400 h-3 rounded-full transition-all duration-300"
              style={{ width: `${completionStats.completionPercentage}%` }}
            ></div>
          </div>
          <p className="text-blue-200">
            {completionStats.completedDataPoints} of {completionStats.totalDataPoints} data categories complete
          </p>
          <div className="flex items-center justify-between text-sm">
            <span className="text-blue-300">
              Quality Score: {completionStats.completionPercentage > 75 ? 'Excellent' : 
                            completionStats.completionPercentage > 50 ? 'Good' : 
                            completionStats.completionPercentage > 25 ? 'Fair' : 'Needs Work'}
            </span>
          </div>
        </div>
      </div>

      {/* Website Data Extraction System - Replaces the 3 metric cards */}
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-500/20 border border-blue-400/30 rounded-full flex items-center justify-center">
              <Globe className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">Website Data Extraction</h3>
              <p className="text-blue-200">Automatically extract clinic info from your website</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleScraperSystemClick}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200 hover:scale-105 flex items-center space-x-2"
            >
              <span>Learn More</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
            <span className="text-blue-200">Contact Info</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
            <span className="text-blue-200">Services</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
            <span className="text-blue-200">Insurance</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
            <span className="text-blue-200">Policies</span>
          </div>
        </div>
      </div>

      {/* Specific Data Gaps - Keep this exactly as it was */}
      <SpecificDataGaps 
        onNavigateToTab={onNavigateToTab}
        clinicData={clinicData}
      />

      {/* Quick Actions - Keep this exactly as it was */}
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <button 
            onClick={() => onNavigateToTab('providers')}
            className="flex items-center space-x-3 p-4 bg-white/5 border border-white/20 rounded-lg hover:bg-white/10 transition-colors text-left"
          >
            <Users className="w-5 h-5 text-blue-400" />
            <div>
              <div className="text-sm font-medium text-white">Manage Providers</div>
              <div className="text-xs text-blue-200">Add or edit doctor information</div>
            </div>
          </button>
          
          <button 
            onClick={() => onNavigateToTab('services')}
            className="flex items-center space-x-3 p-4 bg-white/5 border border-white/20 rounded-lg hover:bg-white/10 transition-colors text-left"
          >
            <Stethoscope className="w-5 h-5 text-blue-400" />
            <div>
              <div className="text-sm font-medium text-white">Update Services</div>
              <div className="text-xs text-blue-200">Modify available treatments</div>
            </div>
          </button>
          
          <button 
            onClick={() => onNavigateToTab('insurance')}
            className="flex items-center space-x-3 p-4 bg-white/5 border border-white/20 rounded-lg hover:bg-white/10 transition-colors text-left"
          >
            <CreditCard className="w-5 h-5 text-blue-400" />
            <div>
              <div className="text-sm font-medium text-white">Insurance Plans</div>
              <div className="text-xs text-blue-200">Manage accepted insurance</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}