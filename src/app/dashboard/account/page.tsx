"use client";

import { useState, useEffect } from "react";
import { UserCircle, Mail, Lock, Save, Eye, EyeOff } from "lucide-react";
import { toast } from "react-hot-toast";
import DashboardHeader from "@/components/dashboard/DashboardHeader";

interface ClinicData {
  id: number;
  practice_name: string;
  doctor_name: string;
  email: string;
  specialty: string;
}

export default function AccountPage() {
  const [clinic, setClinic] = useState<ClinicData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Email change state
  const [newEmail, setNewEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  
  // Password change state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    fetchAccountData();
  }, []);

  const fetchAccountData = async () => {
    try {
      const response = await fetch("/api/dashboard/data");
      if (!response.ok) throw new Error("Failed to fetch account data");
      const data = await response.json();
      setClinic(data.clinic);
    } catch (error) {
      console.error("Error fetching account data:", error);
      toast.error("Failed to load account data");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newEmail.trim()) {
      toast.error("Please enter a new email address");
      return;
    }

    if (newEmail === clinic?.email) {
      toast.error("New email must be different from current email");
      return;
    }

    setEmailLoading(true);
    try {
      const response = await fetch("/api/account/change-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newEmail })
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success(data.message || "Email updated successfully!");
        setNewEmail("");
        // Update local clinic data
        if (clinic) {
          setClinic({ ...clinic, email: newEmail });
        }
      } else {
        toast.error(data.error || "Failed to update email");
      }
    } catch (error) {
      console.error("Email change error:", error);
      toast.error("Failed to update email");
    } finally {
      setEmailLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPassword || !confirmPassword) {
      toast.error("Please fill in both password fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    setPasswordLoading(true);
    try {
      const response = await fetch("/api/account/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword, confirmPassword })
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success("Password updated successfully!");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(data.error || "Failed to update password");
      }
    } catch (error) {
      console.error("Password change error:", error);
      toast.error("Failed to update password");
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-950 to-blue-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-xl animate-pulse"></div>
          <div className="h-8 bg-white/20 rounded w-48 mx-auto mb-2 animate-pulse"></div>
          <div className="h-4 bg-white/20 rounded w-64 mx-auto animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (!clinic) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-950 to-blue-900 flex items-center justify-center">
        <div className="text-center bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-blue-100 mb-6">Unable to load account information</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 to-blue-900 text-white">
      <DashboardHeader practiceName={clinic.practice_name} />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <UserCircle className="w-8 h-8 text-blue-300" />
            <h1 className="text-3xl font-bold text-white">Account Settings</h1>
          </div>
          <p className="text-blue-200">Manage your account information and security settings</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Current Account Info */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Current Information</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-blue-200">Practice Name</label>
                <p className="text-white mt-1">{clinic.practice_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-blue-200">Doctor Name</label>
                <p className="text-white mt-1">{clinic.doctor_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-blue-200">Specialty</label>
                <p className="text-white mt-1">{clinic.specialty}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-blue-200">Current Email</label>
                <p className="text-white mt-1">{clinic.email}</p>
              </div>
            </div>
          </div>

          {/* Change Email */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
            <div className="flex items-center space-x-2 mb-6">
              <Mail className="w-5 h-5 text-blue-300" />
              <h2 className="text-xl font-semibold text-white">Change Email</h2>
            </div>
            <form onSubmit={handleEmailChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-blue-200 mb-2">
                  New Email Address
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter new email address"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={emailLoading}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                <span>{emailLoading ? "Updating..." : "Update Email"}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Change Password */}
        <div className="mt-8">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
            <div className="flex items-center space-x-2 mb-6">
              <Lock className="w-5 h-5 text-blue-300" />
              <h2 className="text-xl font-semibold text-white">Change Password</h2>
            </div>
            <form onSubmit={handlePasswordChange} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-blue-200 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 pr-10 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter new password"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-blue-300 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-blue-200 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 pr-10 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Confirm new password"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-2.5 text-blue-300 hover:text-white"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              
              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Lock className="w-4 h-4" />
                  <span>{passwordLoading ? "Updating..." : "Update Password"}</span>
                </button>
                <p className="text-sm text-blue-300 mt-2">
                  Password must be at least 8 characters long
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}