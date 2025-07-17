"use client";

import { useState, useEffect } from "react";
import { HelpCircle, Plus, Edit, Trash2, Save, X } from "lucide-react";

interface CommonQuestion {
  id: number;
  question_text: string;
  category: string;
  usage_count: number;
  is_active: boolean;
}

const questionCategories = [
  { id: 'appointment', name: 'Appointments', count: 0 },
  { id: 'insurance', name: 'Insurance', count: 0 },
  { id: 'services', name: 'Services', count: 0 },
  { id: 'billing', name: 'Billing', count: 0 },
  { id: 'general', name: 'General', count: 0 }
];

export default function CommonQuestionsTab() {
  const [commonQuestions, setCommonQuestions] = useState<CommonQuestion[]>([]);
  const [, setLoading] = useState(true);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<CommonQuestion | null>(null);

  // Form state
  const [questionFormData, setQuestionFormData] = useState({
    question_text: '',
    category: 'general'
  });

  useEffect(() => {
    fetchCommonQuestions();
  }, []);

  const fetchCommonQuestions = async () => {
    try {
      const response = await fetch('/api/clinic-intelligence/common-questions');
      const data = await response.json();
      if (response.ok) {
        setCommonQuestions(data.questions || []);
      }
    } catch (error) {
      console.error('Error fetching common questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveQuestion = async () => {
    try {
      const url = editingQuestion 
        ? `/api/clinic-intelligence/common-questions/${editingQuestion.id}`
        : '/api/clinic-intelligence/common-questions';
      
      const method = editingQuestion ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(questionFormData)
      });

      if (response.ok) {
        await fetchCommonQuestions();
        setShowQuestionForm(false);
        setEditingQuestion(null);
        resetQuestionForm();
      }
    } catch (error) {
      console.error('Error saving question:', error);
    }
  };

  const handleDeleteQuestion = async (id: number) => {
    if (!confirm('Are you sure you want to delete this question?')) return;

    try {
      const response = await fetch(`/api/clinic-intelligence/common-questions/${id}`, {
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

  const getTopQuestions = () => {
    return commonQuestions
      .sort((a, b) => b.usage_count - a.usage_count)
      .slice(0, 10);
  };

  // Update category counts
  const updatedCategories = questionCategories.map(category => ({
    ...category,
    count: commonQuestions.filter(q => q.category === category.id).length
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-white" />
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
          {updatedCategories.map((category) => (
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
                  <p className="text-sm font-medium text-white truncate">&quot;{question.question_text}&quot;</p>
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

        {/* Usage Tips */}
        <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-200 mb-2">💡 How Common Questions Work</h4>
          <ul className="text-xs text-blue-300 space-y-1">
            <li>• Questions appear as clickable suggestions in your chat interface</li>
            <li>• Popular questions are shown first to help patients get started</li>
            <li>• Usage statistics help you understand what patients ask most</li>
            <li>• Categories help organize questions by topic</li>
          </ul>
        </div>
      </div>

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
                  Question Text
                </label>
                <input
                  type="text"
                  value={questionFormData.question_text}
                  onChange={(e) => setQuestionFormData(prev => ({ ...prev, question_text: e.target.value }))}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  placeholder="e.g., What should I bring to my appointment?"
                />
              </div>

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

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowQuestionForm(false);
                    setEditingQuestion(null);
                    resetQuestionForm();
                  }}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveQuestion}
                  disabled={!questionFormData.question_text.trim()}
                  className="flex-1 bg-white text-blue-900 font-semibold px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4 inline mr-2" />
                  {editingQuestion ? 'Update' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}