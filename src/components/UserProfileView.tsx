import React, { useState } from "react";
import {
  User,
  Heart,
  Sliders,
  Globe,
  Bell,
  Check,
  Save,
  ShieldCheck,
  ShieldAlert,
  Luggage,
  Lock,
  Settings as SettingsIcon,
  ChevronRight,
  LogOut,
  AlertTriangle
} from "lucide-react";
import { Language, UserProfile, TravelStyle, Trip } from "../types";
import { EmergencySafetySection } from "./EmergencySafetySection";

type ProfileTab =
  | "personal"
  | "preferences"
  | "trips"
  | "notifications"
  | "emergency"
  | "privacy"
  | "settings";

interface UserProfileViewProps {
  profile: UserProfile;
  activeTrip?: Trip | null;
  language?: Language;
  onLanguageChange?: (lang: Language) => void;
  onSaveProfile: (updated: UserProfile) => void;
  onOpenSOSModal: (isTest: boolean) => void;
  onNavigateToTrips?: () => void;
  onLogout?: () => void;
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({
  profile,
  activeTrip,
  onSaveProfile,
  onOpenSOSModal,
  onNavigateToTrips,
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState<ProfileTab>("emergency");
  const [formData, setFormData] = useState<UserProfile>(profile);
  const [isSaved, setIsSaved] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleConfirmLogout = () => {
    setShowLogoutConfirm(false);
    if (onLogout) {
      onLogout();
    }
  };

  const navItems: { id: ProfileTab; label: string; icon: any; badge?: string }[] = [
    { id: "personal", label: "Personal Information", icon: User },
    { id: "preferences", label: "Travel Preferences", icon: Sliders },
    { id: "emergency", label: "Emergency & Safety", icon: ShieldAlert, badge: "SOS Ready" },
    { id: "trips", label: "Saved Trips", icon: Luggage },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "privacy", label: "Privacy & Security", icon: Lock },
    { id: "settings", label: "Settings", icon: SettingsIcon }
  ];

  return (
    <div className="max-w-md mx-auto p-4 pb-28 space-y-4">
      {/* Profile Header */}
      <div className="bg-blue-900 rounded-3xl p-5 text-white shadow-xl shadow-blue-900/10 flex items-center justify-between gap-4 relative overflow-hidden">
        <div className="flex items-center gap-4">
          <img
            src={formData.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80"}
            alt={formData.name}
            className="w-14 h-14 rounded-2xl border-2 border-blue-400 object-cover shadow-md"
          />

          <div>
            <h2 className="text-lg font-black">{formData.name}</h2>
            <p className="text-xs text-blue-200 font-medium">{formData.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="bg-white/10 text-sky-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-white/20">
                📍 {formData.homeCity || "New Delhi, India"}
              </span>
              <span className="bg-rose-500/20 text-rose-200 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-rose-400/30 flex items-center gap-1">
                <ShieldAlert className="w-3 h-3 text-rose-400" /> SOS Enabled
              </span>
            </div>
          </div>
        </div>

        {/* Header Sign Out Button */}
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="bg-white/10 hover:bg-rose-600/80 text-white p-2.5 rounded-2xl border border-white/20 transition-all cursor-pointer flex items-center justify-center shrink-0"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* Section Sub-Navigation Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === "trips" && onNavigateToTrips) {
                  onNavigateToTrips();
                } else {
                  setActiveTab(item.id);
                }
              }}
              className={`whitespace-nowrap px-3.5 py-2 rounded-2xl text-xs font-extrabold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                isActive
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "bg-white text-slate-600 hover:bg-blue-50 border border-slate-200"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : item.id === "emergency" ? "text-rose-600" : "text-slate-500"}`} />
              <span>{item.label}</span>
              {item.badge && (
                <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-md ${isActive ? "bg-white text-blue-600" : "bg-rose-100 text-rose-800"}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab 1: 🛡️ Emergency & Safety Section */}
      {activeTab === "emergency" && (
        <EmergencySafetySection
          activeTrip={activeTrip}
          onOpenSOSModal={onOpenSOSModal}
        />
      )}

      {/* Tab 2: Personal Information */}
      {activeTab === "personal" && (
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 shadow-xl shadow-blue-900/5 border-2 border-blue-100 space-y-4 text-xs animate-fade-in">
          {isSaved && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-2xl font-extrabold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Personal details updated!</span>
            </div>
          )}

          <div>
            <label className="font-extrabold text-blue-900 block mb-1">Full Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border-2 border-blue-100 bg-blue-50/30 rounded-2xl p-3 font-bold text-blue-900 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="font-extrabold text-blue-900 block mb-1">Home City / Location</label>
            <input
              type="text"
              value={formData.homeCity || "New Delhi, India"}
              onChange={(e) => setFormData({ ...formData, homeCity: e.target.value })}
              className="w-full border-2 border-blue-100 bg-blue-50/30 rounded-2xl p-3 font-bold text-blue-900 focus:outline-none focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3 rounded-2xl shadow-lg flex items-center justify-center gap-2 text-xs cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Personal Details</span>
          </button>
        </form>
      )}

      {/* Tab 3: Travel Preferences */}
      {activeTab === "preferences" && (
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 shadow-xl shadow-blue-900/5 border-2 border-blue-100 space-y-4 text-xs animate-fade-in">
          {isSaved && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-2xl font-extrabold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Travel preferences updated!</span>
            </div>
          )}

          <div>
            <label className="font-extrabold text-blue-900 block mb-1.5">Preferred Travel Style</label>
            <select
              value={formData.travelStyle}
              onChange={(e) => setFormData({ ...formData, travelStyle: e.target.value as TravelStyle })}
              className="w-full border-2 border-blue-100 bg-blue-50/30 rounded-2xl p-3 font-bold text-blue-900 focus:outline-none"
            >
              <option value="budget">Budget</option>
              <option value="comfort">Comfort</option>
              <option value="luxury">Luxury</option>
              <option value="adventure">Adventure</option>
            </select>
          </div>

          <div>
            <label className="font-extrabold text-blue-900 block mb-1.5">Food Preference</label>
            <select
              value={formData.foodPreference}
              onChange={(e) => setFormData({ ...formData, foodPreference: e.target.value as any })}
              className="w-full border-2 border-blue-100 bg-blue-50/30 rounded-2xl p-3 font-bold text-blue-900 focus:outline-none"
            >
              <option value="veg">Pure Vegetarian</option>
              <option value="non-veg">Non-Vegetarian</option>
              <option value="jain">Jain Food</option>
              <option value="vegan">Vegan</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3 rounded-2xl shadow-lg flex items-center justify-center gap-2 text-xs cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Preferences</span>
          </button>
        </form>
      )}

      {/* Tab 4: Notifications */}
      {activeTab === "notifications" && (
        <div className="bg-white rounded-3xl p-6 shadow-xl border-2 border-blue-100 space-y-4 text-xs animate-fade-in">
          <div className="bg-blue-50/60 p-4 rounded-2xl border-2 border-blue-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-blue-900">Weather & Departure Alerts</span>
              <input
                type="checkbox"
                checked={formData.weatherAlertsEnabled}
                onChange={(e) => setFormData({ ...formData, weatherAlertsEnabled: e.target.checked })}
                className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
              />
            </div>
            <p className="text-[11px] text-slate-500">6-hourly live weather updates & trip departure alerts.</p>
          </div>
        </div>
      )}

      {/* Tab 5: Privacy & Security */}
      {activeTab === "privacy" && (
        <div className="bg-white rounded-3xl p-6 shadow-xl border-2 border-blue-100 space-y-3 text-xs animate-fade-in">
          <h4 className="font-extrabold text-sm text-slate-900">Privacy & Data Security</h4>
          <p className="text-slate-600 leading-relaxed">
            GoLumo stores your emergency contacts and location history encrypted in secure local storage. Coordinates are never made public.
          </p>
          <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-200 text-emerald-900 font-bold flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>End-to-End Local Encryption Active</span>
          </div>
        </div>
      )}

      {/* Tab 6: Settings */}
      {activeTab === "settings" && (
        <div className="bg-white rounded-3xl p-6 shadow-xl border-2 border-blue-100 space-y-4 text-xs animate-fade-in">
          <h4 className="font-extrabold text-sm text-slate-900">App Settings</h4>
          <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between">
            <span className="font-bold text-slate-800">App Version</span>
            <span className="font-mono text-slate-500">v2.4.0 (Emergency Ready)</span>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <h5 className="font-extrabold text-slate-900 mb-2">Account Actions</h5>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold py-3 px-4 rounded-2xl border border-rose-200 flex items-center justify-between transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <LogOut className="w-4 h-4 text-rose-600" />
                <span>Sign Out / Log Out</span>
              </div>
              <ChevronRight className="w-4 h-4 text-rose-400" />
            </button>
          </div>
        </div>
      )}

      {/* Global Sign Out Button at bottom of Profile */}
      <div className="pt-2">
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 font-extrabold py-3.5 px-4 rounded-2xl border border-slate-200 hover:border-rose-200 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out of Account</span>
        </button>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border-2 border-slate-200 text-slate-900 space-y-4 text-center animate-scale-up">
            <div className="w-14 h-14 bg-rose-100 rounded-full flex items-center justify-center mx-auto text-rose-600">
              <LogOut className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900">Sign Out</h3>
              <p className="text-xs text-slate-600 mt-1 font-medium">
                Are you sure you want to log out of your GoLumo account?
              </p>
            </div>

            <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200 text-left text-[11px] text-amber-900 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                Your emergency contacts and saved trips remain stored on your device for fast access.
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-2xl transition-all cursor-pointer text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmLogout}
                className="py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-2xl shadow-lg shadow-rose-600/30 transition-all cursor-pointer text-xs flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Yes, Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
