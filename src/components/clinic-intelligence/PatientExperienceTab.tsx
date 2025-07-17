"use client";

import { useState, useEffect } from "react";
import { Heart, Clock, Users, Shield, Plus, Edit, Trash2, Save, X, MessageCircle, HelpCircle } from "lucide-react";


interface ClinicPolicy {
  id: number;
  policy_category: string;
  policy_name: string;
  policy_description: string;
  policy_value: string;
  is_active: boolean;
}

interface CommonQuestion {
  id: number;
  question_text: string;
  category: string;
  usage_count: number;
  is_active: boolean;
}


const policyCategories = [
  { id: 'appointment', name: 'Appointment Policies', icon: Clock, color: 'bg-blue-500' },
  { id: 'payment', name: 'Payment Policies', icon: Shield, color: 'bg-green-500' },
  { id: 'facility', name: 'Facility Rules', icon: Users, color: 'bg-purple-500' },
  { id: 'communication', name: 'Communication', icon: Heart, color: 'bg-orange-500' }
];

export default function PatientExperienceTab() {
  const [policies, setPolicies] = useState<ClinicPolicy[]>([]);
  const [commonQuestions, setCommonQuestions] = useState<CommonQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<ClinicPolicy | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<CommonQuestion | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    policy_category: 'appointment',
    policy_name: '',
    policy_description: '',
    policy_value: ''
  });

  const [questionFormData, setQuestionFormData] = useState({
    question_text: '',
    category: 'general'
  });

  useEffect(() => {
    fetchPolicies();
    fetchCommonQuestions();
  }, []);

  const fetchPolicies = async () => {
    try {
      const response = await fetch('/api/clinic-intelligence/policies');
      const data = await response.json();
      if (response.ok) {
        setPolicies(data.policies || []);
      }
    } catch (error) {
      console.error('Error fetching policies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePolicy = async () => {
    try {
      const url = '/api/clinic-intelligence/policies';
      const method = editingPolicy ? 'PUT' : 'POST';
      const payload = editingPolicy 
        ? { id: editingPolicy.id, ...formData }
        : formData;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        await fetchPolicies();
        setEditingPolicy(null);
        setShowAddForm(false);
        resetForm();
      }
    } catch (error) {
      console.error('Error saving policy:', error);
    }
  };

  const handleDeletePolicy = async (id: number) => {
    if (!confirm('Are you sure you want to delete this policy?')) return;

    try {
      const response = await fetch(`/api/clinic-intelligence/policies?id=${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchPolicies();
      }
    } catch (error) {
      console.error('Error deleting policy:', error);
    }
  };

  const startEdit = (policy: ClinicPolicy) => {
    setEditingPolicy(policy);
    setFormData({
      policy_category: policy.policy_category,
      policy_name: policy.policy_name,
      policy_description: policy.policy_description,
      policy_value: policy.policy_value || ''
    });
    setShowAddForm(true);
  };

  const resetForm = () => {
    setFormData({
      policy_category: 'appointment',
      policy_name: '',
      policy_description: '',
      policy_value: ''
    });
  };

  const getPoliciesByCategory = (category: string) => {
    return policies.filter(policy => policy.policy_category === category && policy.is_active);
  };

  const fetchCommonQuestions = async () => {
    setQuestionsLoading(true);
    try {
      const response = await fetch('/api/clinic-intelligence/common-questions');
      const data = await response.json();
      if (response.ok) {
        setCommonQuestions(data.questions || []);
      }
    } catch (error) {
      console.error('Error fetching common questions:', error);
    } finally {
      setQuestionsLoading(false);
    }
  };

  const handleSaveQuestion = async () => {
    try {
      const url = '/api/clinic-intelligence/common-questions';
      const method = editingQuestion ? 'PUT' : 'POST';
      const payload = editingQuestion 
        ? { id: editingQuestion.id, ...questionFormData }
        : questionFormData;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        await fetchCommonQuestions();
        setEditingQuestion(null);
        setShowQuestionForm(false);
        resetQuestionForm();
      }
    } catch (error) {
      console.error('Error saving question:', error);
    }
  };

  const handleDeleteQuestion = async (id: number) => {
    if (!confirm('Are you sure you want to delete this question?')) return;

    try {
      const response = await fetch(`/api/clinic-intelligence/common-questions?id=${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchCommonQuestions();
      }
    } catch (error) {
      console.error('Error deleting question:', error);
    }
  };

  const startEditQuestion = (question: CommonQuestion) => {
    setEditingQuestion(question);
    setQuestionFormData({
      question_text: question.question_text,
      category: question.category
    });
    setShowQuestionForm(true);
  };

  const resetQuestionForm = () => {
    setQuestionFormData({
      question_text: '',
      category: 'general'
    });
  };

  const questionCategories = [
    { id: 'general', name: 'General Information', count: commonQuestions.filter(q => q.category === 'general').length },
    { id: 'appointment', name: 'Appointments', count: commonQuestions.filter(q => q.category === 'appointment').length },
    { id: 'insurance', name: 'Insurance & Billing', count: commonQuestions.filter(q => q.category === 'insurance').length },
    { id: 'services', name: 'Services & Procedures', count: commonQuestions.filter(q => q.category === 'services').length },
    { id: 'preparation', name: 'Visit Preparation', count: commonQuestions.filter(q => q.category === 'preparation').length }
  ];

  const getTopQuestions = () => {
    return commonQuestions
      .filter(q => q.is_active)
      .sort((a, b) => b.usage_count - a.usage_count)
      .slice(0, 8);
  };


  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-white/20 rounded w-1/4"></div>
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
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-white">Patient Experience</h2>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center space-x-2 bg-white text-blue-900 font-semibold px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Policy</span>
          </button>
        </div>

        {/* Policies by Category */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {policyCategories.map((category) => {
            const categoryPolicies = getPoliciesByCategory(category.id);
            const IconComponent = category.icon;
            
            return (
              <div key={category.id} className="bg-white/5 border border-white/20 rounded-lg p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className={`w-8 h-8 ${category.color} rounded-full flex items-center justify-center`}>
                    <IconComponent className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">{category.name}</h3>
                  <span className="text-sm text-blue-200">({categoryPolicies.length})</span>
                </div>
                
                <div className="space-y-2">
                  {categoryPolicies.length === 0 ? (
                    <p className="text-sm text-blue-300 italic">No policies in this category</p>
                  ) : (
                    categoryPolicies.map((policy) => (
                      <div key={policy.id} className="flex items-center justify-between p-3 bg-white/5 border border-white/20 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-white truncate">{policy.policy_name}</h4>
                          <p className="text-xs text-blue-200 truncate">{policy.policy_description}</p>
                          {policy.policy_value && (
                            <p className="text-xs text-blue-300 font-medium">{policy.policy_value}</p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => startEdit(policy)}
                            className="text-blue-300 hover:text-white p-1"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeletePolicy(policy.id)}
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

      {/* Common Patient Questions */}
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Common Patient Questions</h2>
              <p className="text-sm text-blue-200">Questions that appear as suggestions in your chat interface</p>
            </div>
          </div>
          <button
            onClick={() => setShowQuestionForm(true)}
            className="flex items-center space-x-2 bg-white text-blue-900 font-semibold px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Question</span>
          </button>
        </div>

        {/* Question Categories Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {questionCategories.map((category) => (
            <div key={category.id} className="bg-white/5 border border-white/20 rounded-lg p-4 text-center">
              <div className="text-lg font-semibold text-white">{category.count}</div>
              <div className="text-sm text-blue-200">{category.name}</div>
            </div>
          ))}
        </div>

        {/* Top Questions */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
            <HelpCircle className="w-5 h-5" />
            <span>Most Popular Questions</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {getTopQuestions().map((question) => (
              <div key={question.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/20 rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">"{question.question_text}"</p>
                  <div className="flex items-center space-x-4 mt-1">
                    <span className="text-xs text-blue-300 capitalize">{question.category}</span>
                    <span className="text-xs text-green-400">Used {question.usage_count} times</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => startEditQuestion(question)}
                    className="text-blue-300 hover:text-white p-1"
                  >
                    <Edit className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleDeleteQuestion(question.id)}
                    className="text-red-400 hover:text-red-300 p-1"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {commonQuestions.length === 0 && (
            <div className="text-center py-8">
              <HelpCircle className="w-12 h-12 text-blue-400 mx-auto mb-4" />
              <p className="text-blue-200 mb-2">No common questions configured yet</p>
              <p className="text-sm text-blue-300">Add questions that patients frequently ask to help them get started</p>
            </div>
          )}
        </div>
      </div>

      {/* What to Bring */}
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <Users className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-white">What Patients Should Bring</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/5 border border-white/20 rounded-lg p-4">
            <h4 className="text-sm font-medium text-white mb-2">Required Items</h4>
            <ul className="text-sm text-blue-200 space-y-1">
              <li>• Valid photo identification</li>
              <li>• Medical insurance card</li>
              <li>• Current eye medications</li>
            </ul>
          </div>

          <div className="bg-white/5 border border-white/20 rounded-lg p-4">
            <h4 className="text-sm font-medium text-white mb-2">Helpful Items</h4>
            <ul className="text-sm text-blue-200 space-y-1">
              <li>• Previous prescription glasses</li>
              <li>• List of current medications</li>
              <li>• Medical history records</li>
            </ul>
          </div>

          <div className="bg-white/5 border border-white/20 rounded-lg p-4">
            <h4 className="text-sm font-medium text-white mb-2">Important Notes</h4>
            <ul className="text-sm text-blue-200 space-y-1">
              <li>• Arrive 15 minutes early</li>
              <li>• Patient Portal registration required</li>
              <li>• Use Google Chrome for portal access</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Add/Edit Policy Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-blue-950 to-blue-900 rounded-xl p-6 w-full max-w-md border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">
                {editingPolicy ? 'Edit Policy' : 'Add New Policy'}
              </h3>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingPolicy(null);
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
                  Category
                </label>
                <select
                  value={formData.policy_category}
                  onChange={(e) => setFormData(prev => ({ ...prev, policy_category: e.target.value }))}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                >
                  {policyCategories.map((category) => (
                    <option key={category.id} value={category.id} className="bg-blue-900 text-white">
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-100 mb-2">
                  Policy Name
                </label>
                <input
                  type="text"
                  value={formData.policy_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, policy_name: e.target.value }))}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  placeholder="e.g., Cancellation Policy"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-100 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.policy_description}
                  onChange={(e) => setFormData(prev => ({ ...prev, policy_description: e.target.value }))}
                  rows={3}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  placeholder="Describe the policy..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-100 mb-2">
                  Value (Optional)
                </label>
                <input
                  type="text"
                  value={formData.policy_value}
                  onChange={(e) => setFormData(prev => ({ ...prev, policy_value: e.target.value }))}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  placeholder="e.g., $25, 24 hours"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingPolicy(null);
                  resetForm();
                }}
                className="px-4 py-2 text-blue-200 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePolicy}
                className="flex items-center space-x-2 bg-white text-blue-900 font-semibold px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>{editingPolicy ? 'Update' : 'Add'} Policy</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Question Modal */}
      {showQuestionForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-blue-950 to-blue-900 rounded-xl p-6 w-full max-w-md border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">
                {editingQuestion ? 'Edit Question' : 'Add New Question'}
              </h3>
              <button
                onClick={() => {
                  setShowQuestionForm(false);
                  setEditingQuestion(null);
                  resetQuestionForm();
                }}
                className="text-blue-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-blue-100 mb-2">
                  Category
                </label>
                <select
                  value={questionFormData.category}
                  onChange={(e) => setQuestionFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                >
                  {questionCategories.map((category) => (
                    <option key={category.id} value={category.id} className="bg-blue-900 text-white">
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-100 mb-2">
                  Question Text
                </label>
                <textarea
                  value={questionFormData.question_text}
                  onChange={(e) => setQuestionFormData(prev => ({ ...prev, question_text: e.target.value }))}
                  rows={3}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  placeholder="e.g., What should I bring to my appointment?"
                />
                <p className="text-xs text-blue-300 mt-1">
                  This question will appear as a clickable suggestion in the chat interface
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowQuestionForm(false);
                  setEditingQuestion(null);
                  resetQuestionForm();
                }}
                className="px-4 py-2 text-blue-200 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveQuestion}
                disabled={!questionFormData.question_text.trim()}
                className="flex items-center space-x-2 bg-white text-blue-900 font-semibold px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                <span>{editingQuestion ? 'Update' : 'Add'} Question</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}