"use client";

import { useState, useEffect } from "react";
import { 
  Shield, 
  CreditCard,
  Plus,
  Edit,
  Trash2,
  Save,
  X
} from "lucide-react";

interface InsurancePlan {
  id: number;
  plan_name: string;
  plan_type: string;
  coverage_notes: string;
  is_active: boolean;
}

const planTypes = [
  { id: 'major', name: 'Major Medical', color: 'bg-blue-500' },
  { id: 'medicare', name: 'Medicare', color: 'bg-green-500' },
  { id: 'medicaid', name: 'Medicaid', color: 'bg-purple-500' },
  { id: 'commercial', name: 'Commercial', color: 'bg-orange-500' },
  { id: 'government', name: 'Government', color: 'bg-red-500' }
];

export default function InsuranceTab() {
  const [plans, setPlans] = useState<InsurancePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<InsurancePlan | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    plan_name: '',
    plan_type: 'major',
    coverage_notes: ''
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/clinic-intelligence/insurance');
      const data = await response.json();
      if (response.ok) {
        setPlans(data.plans || []);
      }
    } catch (error) {
      console.error('Error fetching insurance plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePlan = async () => {
    try {
      const url = '/api/clinic-intelligence/insurance';
      const method = editingPlan ? 'PUT' : 'POST';
      const payload = editingPlan 
        ? { id: editingPlan.id, ...formData }
        : formData;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        await fetchPlans();
        setEditingPlan(null);
        setShowAddForm(false);
        resetForm();
      }
    } catch (error) {
      console.error('Error saving insurance plan:', error);
    }
  };

  const handleDeletePlan = async (id: number) => {
    if (!confirm('Are you sure you want to delete this insurance plan?')) return;

    try {
      const response = await fetch(`/api/clinic-intelligence/insurance?id=${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchPlans();
      }
    } catch (error) {
      console.error('Error deleting insurance plan:', error);
    }
  };

  const startEdit = (plan: InsurancePlan) => {
    setEditingPlan(plan);
    setFormData({
      plan_name: plan.plan_name,
      plan_type: plan.plan_type,
      coverage_notes: plan.coverage_notes || ''
    });
    setShowAddForm(true);
  };

  const resetForm = () => {
    setFormData({
      plan_name: '',
      plan_type: 'major',
      coverage_notes: ''
    });
  };

  const getPlansByType = (type: string) => {
    return plans.filter(plan => plan.plan_type === type && plan.is_active);
  };


  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-white/20 rounded w-1/4"></div>
          <div className="h-32 bg-white/20 rounded"></div>
          <div className="h-32 bg-white/20 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-white">Insurance Plans Accepted</h2>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center space-x-2 bg-white text-blue-900 font-semibold px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Insurance Plan</span>
          </button>
        </div>

        {/* Insurance Plans by Type */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {planTypes.map((planType) => {
            const typePlans = getPlansByType(planType.id);
            
            return (
              <div key={planType.id} className="bg-white/5 border border-white/20 rounded-lg p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className={`w-8 h-8 ${planType.color} rounded-full flex items-center justify-center`}>
                    <CreditCard className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">{planType.name}</h3>
                  <span className="text-sm text-blue-200">({typePlans.length})</span>
                </div>
                
                <div className="space-y-2">
                  {typePlans.length === 0 ? (
                    <p className="text-sm text-blue-300 italic">No plans in this category</p>
                  ) : (
                    typePlans.map((plan) => (
                      <div key={plan.id} className="flex items-center justify-between p-3 bg-white/5 border border-white/20 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-white truncate">{plan.plan_name}</h4>
                          {plan.coverage_notes && (
                            <p className="text-xs text-blue-200 truncate">{plan.coverage_notes}</p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => startEdit(plan)}
                            className="text-blue-300 hover:text-white p-1"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeletePlan(plan.id)}
                            className="text-red-400 hover:text-red-300 p-1"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add/Edit Insurance Plan Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-blue-950 to-blue-900 rounded-xl p-6 w-full max-w-md border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">
                {editingPlan ? 'Edit Insurance Plan' : 'Add New Insurance Plan'}
              </h3>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingPlan(null);
                  resetForm();
                }}
                className="text-blue-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-blue-100 mb-2">
                  Plan Type
                </label>
                <select
                  value={formData.plan_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, plan_type: e.target.value }))}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                >
                  {planTypes.map((planType) => (
                    <option key={planType.id} value={planType.id} className="bg-blue-900 text-white">
                      {planType.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-100 mb-2">
                  Plan Name
                </label>
                <input
                  type="text"
                  value={formData.plan_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, plan_name: e.target.value }))}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  placeholder="e.g., Blue Cross Blue Shield PPO"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-100 mb-2">
                  Coverage Notes
                </label>
                <textarea
                  value={formData.coverage_notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, coverage_notes: e.target.value }))}
                  rows={3}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  placeholder="Any special coverage notes or limitations..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingPlan(null);
                  resetForm();
                }}
                className="px-4 py-2 text-blue-200 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePlan}
                className="flex items-center space-x-2 bg-white text-blue-900 font-semibold px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>{editingPlan ? 'Update' : 'Add'} Plan</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}