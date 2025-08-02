"use client";

import { useState, useEffect } from "react";
import { 
  Stethoscope, 
  Scissors, 
  Search, 
  Eye, 
  Heart, 
  Plus,
  Edit,
  Trash2,
  Save,
  X
} from "lucide-react";


interface ClinicService {
  id: number;
  service_category: string;
  service_name: string;
  description: string;
  is_active: boolean;
  display_order: number;
}

interface Condition {
  id: number;
  condition_name: string;
  condition_description: string;
  is_specialty: boolean;
  is_active: boolean;
}


// Available service categories - will be filtered based on actual clinic data
const allServiceCategories = [
  { id: 'medical', name: 'Medical Services', icon: Stethoscope, color: 'bg-blue-500' },
  { id: 'surgical', name: 'Surgical Services', icon: Scissors, color: 'bg-red-500' },
  { id: 'diagnostic', name: 'Diagnostic Services', icon: Search, color: 'bg-green-500' },
  { id: 'optical', name: 'Optical Services', icon: Eye, color: 'bg-purple-500' },
  { id: 'specialty', name: 'Specialty Programs', icon: Heart, color: 'bg-orange-500' }
];

export default function ServicesTab() {
  const [services, setServices] = useState<ClinicService[]>([]);
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingService, setEditingService] = useState<ClinicService | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [availableCategories, setAvailableCategories] = useState<typeof allServiceCategories>([]);

  // Form state
  const [formData, setFormData] = useState({
    service_category: 'medical',
    service_name: '',
    description: '',
    display_order: 0
  });

  useEffect(() => {
    fetchServices();
    fetchConditions();
  }, []);

  // Update available categories based on services that exist
  const updateAvailableCategories = (servicesList: ClinicService[]) => {
    const usedCategories = new Set(servicesList.map(service => service.service_category));
    const categories = allServiceCategories.filter(category => usedCategories.has(category.id));
    setAvailableCategories(categories);
  };

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/clinic-intelligence/services');
      const data = await response.json();
      if (response.ok) {
        const servicesList = data.services || [];
        setServices(servicesList);
        updateAvailableCategories(servicesList);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchConditions = async () => {
    try {
      const response = await fetch('/api/clinic-intelligence/conditions');
      const data = await response.json();
      if (response.ok) {
        setConditions(data.conditions || []);
      }
    } catch (error) {
      console.error('Error fetching conditions:', error);
    }
  };

  const handleSaveService = async () => {
    try {
      const url = editingService ? '/api/clinic-intelligence/services' : '/api/clinic-intelligence/services';
      const method = editingService ? 'PUT' : 'POST';
      const payload = editingService 
        ? { id: editingService.id, ...formData }
        : formData;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        await fetchServices(); // This will also update available categories
        setEditingService(null);
        setShowAddForm(false);
        resetForm();
      }
    } catch (error) {
      console.error('Error saving service:', error);
    }
  };

  const handleDeleteService = async (id: number) => {
    if (!confirm('Are you sure you want to delete this service?')) return;

    try {
      const response = await fetch(`/api/clinic-intelligence/services?id=${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchServices();
      }
    } catch (error) {
      console.error('Error deleting service:', error);
    }
  };

  const startEdit = (service: ClinicService) => {
    setEditingService(service);
    setFormData({
      service_category: service.service_category,
      service_name: service.service_name,
      description: service.description,
      display_order: service.display_order
    });
    setShowAddForm(true);
  };

  const resetForm = () => {
    setFormData({
      service_category: 'medical',
      service_name: '',
      description: '',
      display_order: 0
    });
  };

  const getServicesByCategory = (category: string) => {
    return services.filter(service => service.service_category === category && service.is_active);
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
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-white">Services & Specialties</h2>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center space-x-2 bg-white text-blue-900 font-semibold px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Service</span>
          </button>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedCategory === 'all' 
                ? 'bg-white text-blue-900' 
                : 'bg-white/10 text-blue-200 hover:bg-white/20'
            }`}
          >
            All Services
          </button>
          {availableCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedCategory === category.id 
                  ? 'bg-white text-blue-900' 
                  : 'bg-white/10 text-blue-200 hover:bg-white/20'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Services by Category */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {availableCategories.map((category) => {
            const categoryServices = getServicesByCategory(category.id);
            const IconComponent = category.icon;
            
            return (
              <div key={category.id} className="bg-white/5 border border-white/20 rounded-lg p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className={`w-8 h-8 ${category.color} rounded-full flex items-center justify-center`}>
                    <IconComponent className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">{category.name}</h3>
                  <span className="text-sm text-blue-200">({categoryServices.length})</span>
                </div>
                
                <div className="space-y-2">
                  {categoryServices.length === 0 ? (
                    <p className="text-sm text-blue-300 italic">No services in this category</p>
                  ) : (
                    categoryServices.map((service) => (
                      <div key={service.id} className="flex items-center justify-between p-3 bg-white/5 border border-white/20 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-white truncate">{service.service_name}</h4>
                          {service.description && (
                            <p className="text-xs text-blue-200 truncate">{service.description}</p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => startEdit(service)}
                            className="text-blue-300 hover:text-white p-1"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteService(service.id)}
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

      {/* Conditions Treated */}
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
            <Heart className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-white">Conditions Treated</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {conditions.map((condition) => (
            <div key={condition.id} className="bg-white/5 border border-white/20 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-white">{condition.condition_name}</h4>
                {condition.is_specialty && (
                  <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                    Specialty
                  </span>
                )}
              </div>
              {condition.condition_description && (
                <p className="text-xs text-blue-200">{condition.condition_description}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Add/Edit Service Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-blue-950 to-blue-900 rounded-xl p-6 w-full max-w-md border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">
                {editingService ? 'Edit Service' : 'Add New Service'}
              </h3>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingService(null);
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
                  value={formData.service_category}
                  onChange={(e) => setFormData(prev => ({ ...prev, service_category: e.target.value }))}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                >
                  {allServiceCategories.map((category) => (
                    <option key={category.id} value={category.id} className="bg-blue-900 text-white">
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-100 mb-2">
                  Service Name
                </label>
                <input
                  type="text"
                  value={formData.service_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, service_name: e.target.value }))}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  placeholder="e.g., Comprehensive Eye Exam"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-100 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  placeholder="Brief description of the service..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingService(null);
                  resetForm();
                }}
                className="px-4 py-2 text-blue-200 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveService}
                className="flex items-center space-x-2 bg-white text-blue-900 font-semibold px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>{editingService ? 'Update' : 'Add'} Service</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}