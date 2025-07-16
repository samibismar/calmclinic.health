"use client";

import { useState, useEffect } from "react";
import { 
  BarChart3, 
  AlertCircle, 
  CheckCircle, 
  TrendingUp,
  Users,
  Stethoscope,
  CreditCard
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

// Removed unused constants

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

  // Removed unused functions and variables

  return (
    <div className="space-y-6">
      {/* Data Intelligence Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white">Data Completeness</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-blue-100">Overall Progress</span>
              <span className="text-white font-bold">{completionStats.completionPercentage}%</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div 
                className="bg-blue-400 h-2 rounded-full transition-all duration-300"
                style={{ width: `${completionStats.completionPercentage}%` }}
              ></div>
            </div>
            <p className="text-sm text-blue-200">
              {completionStats.completedDataPoints} of {completionStats.totalDataPoints} data categories complete
            </p>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white">Data Categories</h3>
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold text-white">{completionStats.completedDataPoints}</div>
            <p className="text-sm text-blue-200">Categories with data</p>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white">High Priority</h3>
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold text-white">{completionStats.highPriorityGaps}</div>
            <p className="text-sm text-blue-200">Critical gaps to fill</p>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white">Improvement</h3>
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold text-white">
              {completionStats.completionPercentage > 75 ? 'Excellent' : 
               completionStats.completionPercentage > 50 ? 'Good' : 
               completionStats.completionPercentage > 25 ? 'Fair' : 'Needs Work'}
            </div>
            <p className="text-sm text-blue-200">Data quality score</p>
          </div>
        </div>
      </div>

      {/* Specific Data Gaps */}
      <SpecificDataGaps 
        onNavigateToTab={onNavigateToTab}
        clinicData={clinicData}
      />

      {/* Quick Actions */}
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <button className="flex items-center space-x-3 p-4 bg-white/5 border border-white/20 rounded-lg hover:bg-white/10 transition-colors text-left">
            <Users className="w-5 h-5 text-blue-400" />
            <div>
              <div className="text-sm font-medium text-white">Manage Providers</div>
              <div className="text-xs text-blue-200">Add or edit doctor information</div>
            </div>
          </button>
          
          <button className="flex items-center space-x-3 p-4 bg-white/5 border border-white/20 rounded-lg hover:bg-white/10 transition-colors text-left">
            <Stethoscope className="w-5 h-5 text-blue-400" />
            <div>
              <div className="text-sm font-medium text-white">Update Services</div>
              <div className="text-xs text-blue-200">Modify available treatments</div>
            </div>
          </button>
          
          <button className="flex items-center space-x-3 p-4 bg-white/5 border border-white/20 rounded-lg hover:bg-white/10 transition-colors text-left">
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