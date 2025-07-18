"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BarChart3, ArrowRight, Database, Settings, Brain, AlertCircle, CheckCircle } from "lucide-react";

interface DataGap {
  category: string;
  priority: string;
  description: string;
}

export default function ClinicIntelligenceCard() {
  const [dataGaps, setDataGaps] = useState<DataGap[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDataGaps();
  }, []);

  const fetchDataGaps = async () => {
    try {
      const response = await fetch('/api/clinic-intelligence/data-gaps');
      const data = await response.json();
      
      if (response.ok) {
        setDataGaps(data.gaps || []);
      }
    } catch (error) {
      console.error('Error fetching data gaps:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalGaps = dataGaps.length;
  const highPriorityGaps = dataGaps.filter(gap => gap.priority === 'high').length;
  const mediumPriorityGaps = dataGaps.filter(gap => gap.priority === 'medium').length;
  
  // Determine status and color
  const getStatusInfo = () => {
    if (totalGaps === 0) {
      return {
        status: 'Complete',
        color: 'text-green-400',
        icon: CheckCircle,
        iconColor: 'text-green-400'
      };
    } else if (highPriorityGaps > 2) {
      return {
        status: `${totalGaps} gaps found`,
        color: 'text-red-400',
        icon: AlertCircle,
        iconColor: 'text-red-400'
      };
    } else if (highPriorityGaps > 0) {
      return {
        status: `${totalGaps} gaps found`,
        color: 'text-orange-400',
        icon: AlertCircle,
        iconColor: 'text-orange-400'
      };
    } else if (mediumPriorityGaps > 0) {
      return {
        status: 'Mostly Complete',
        color: 'text-yellow-400',
        icon: AlertCircle,
        iconColor: 'text-yellow-400'
      };
    } else {
      return {
        status: 'Nearly Complete',
        color: 'text-blue-400',
        icon: AlertCircle,
        iconColor: 'text-blue-400'
      };
    }
  };
  
  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;
  
  return (
    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Clinic Intelligence</h2>
            <p className="text-blue-100 text-sm">Comprehensive clinic data management</p>
          </div>
        </div>
        
        {!loading && (
          <div className="flex items-center space-x-2">
            <StatusIcon className={`w-5 h-5 ${statusInfo.iconColor}`} />
            <span className={`text-sm font-medium ${statusInfo.color}`}>
              {statusInfo.status}
            </span>
          </div>
        )}
      </div>
      
      <div className="space-y-4">
        <p className="text-blue-200 text-sm">
          Manage your clinic&apos;s comprehensive information, services, insurance plans, and AI assistant configuration in one powerful dashboard.
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white/5 border border-white/20 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Database className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-white">Rich Data</span>
            </div>
            <p className="text-xs text-blue-200 mt-1">Services, insurance, policies</p>
          </div>
          
          <div className="bg-white/5 border border-white/20 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Settings className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-white">Management</span>
            </div>
            <p className="text-xs text-blue-200 mt-1">Complete clinic oversight</p>
          </div>
          
          <div className="bg-white/5 border border-white/20 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Brain className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-white">AI Integration</span>
            </div>
            <p className="text-xs text-blue-200 mt-1">Smart assistant configuration</p>
          </div>
        </div>
        
        <Link
          href="/dashboard/clinic-intelligence"
          className="flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-500 to-blue-600 text-white font-semibold px-4 py-3 rounded-lg hover:from-purple-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105"
        >
          <span>{totalGaps > 0 ? `Fill ${totalGaps} Data Gaps` : 'Open Clinic Intelligence'}</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
        
        {totalGaps > 0 && (
          <div className={`mt-4 rounded-lg p-4 ${
            highPriorityGaps > 2 
              ? 'bg-red-900/30 border border-red-500/30' 
              : highPriorityGaps > 0 
                ? 'bg-orange-900/30 border border-orange-500/30'
                : 'bg-yellow-900/30 border border-yellow-500/30'
          }`}>
            <p className={`text-sm ${
              highPriorityGaps > 2 
                ? 'text-red-200' 
                : highPriorityGaps > 0 
                  ? 'text-orange-200'
                  : 'text-yellow-200'
            }`}>
              <strong>Missing information:</strong> {' '}
              {highPriorityGaps > 0 && (
                <span>{highPriorityGaps} high priority gap{highPriorityGaps > 1 ? 's' : ''}</span>
              )}
              {highPriorityGaps > 0 && mediumPriorityGaps > 0 && ', '}
              {mediumPriorityGaps > 0 && (
                <span>{mediumPriorityGaps} medium priority gap{mediumPriorityGaps > 1 ? 's' : ''}</span>
              )}
              {' '}found. Complete your clinic profile for better AI assistant performance.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}