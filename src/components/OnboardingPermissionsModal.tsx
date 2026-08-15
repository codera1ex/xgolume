import React, { useState } from "react";
import {
  MapPin,
  Bell,
  ShieldCheck,
  Sparkles,
  Check,
  Compass,
  ArrowRight,
  ShieldAlert
} from "lucide-react";

interface OnboardingPermissionsModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

export const OnboardingPermissionsModal: React.FC<OnboardingPermissionsModalProps> = ({
  isOpen,
  onComplete
}) => {
  const [locationGranted, setLocationGranted] = useState<boolean | null>(null);
  const [notificationsGranted, setNotificationsGranted] = useState<boolean | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);

  const handleGrantAll = async () => {
    setIsRequesting(true);

    // 1. Request Geolocation
    if (navigator.geolocation) {
      await new Promise<void>((resolve) => {
        navigator.geolocation.getCurrentPosition(
          () => {
            setLocationGranted(true);
            resolve();
          },
          () => {
            setLocationGranted(false);
            resolve();
          },
          { timeout: 5000 }
        );
      });
    } else {
      setLocationGranted(false);
    }

    // 2. Request Notifications
    if ("Notification" in window) {
      try {
        const perm = await Notification.requestPermission();
        setNotificationsGranted(perm === "granted");
      } catch (e) {
        setNotificationsGranted(false);
      }
    } else {
      setNotificationsGranted(false);
    }

    setIsRequesting(false);
    localStorage.setItem("golumo_permissions_setup_completed", "true");
    setTimeout(() => {
      onComplete();
    }, 600);
  };

  const handleSkip = () => {
    localStorage.setItem("golumo_permissions_setup_completed", "true");
    onComplete();
  };

  // No hooks after this point — safe to bail out now (Rules of Hooks).
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-sky-900 p-6 text-white text-center relative">
          <div className="w-14 h-14 bg-white/10 rounded-2xl border border-white/20 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Sparkles className="w-7 h-7 text-amber-300 fill-amber-300 animate-pulse" />
          </div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-sky-200 bg-white/10 px-3 py-1 rounded-full border border-white/15">
            Welcome to GoLumo AI
          </span>
          <h2 className="text-2xl font-black tracking-tight mt-2">
            Smart India Travel & Solo Safety
          </h2>
          <p className="text-xs text-sky-200 mt-1.5 leading-relaxed">
            To provide live weather alerts, nearby spots discovery, and 24/7 Emergency SOS, GoLumo works best with device permissions.
          </p>
        </div>

        {/* Permissions Cards */}
        <div className="p-6 space-y-4">
          {/* Permission 1: Geolocation */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-start gap-3.5">
            <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl shrink-0 mt-0.5">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="flex-1 text-xs">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-slate-900">Location Access</h4>
                {locationGranted === true && (
                  <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200">
                    <Check className="w-3 h-3" /> Granted
                  </span>
                )}
                {locationGranted === false && (
                  <span className="text-[10px] font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    Denied
                  </span>
                )}
              </div>
              <p className="text-slate-500 text-[11px] mt-1 leading-normal">
                Powers real-time local weather alerts, nearby attractions discovery, and precise GPS tracking during Emergency SOS.
              </p>
            </div>
          </div>

          {/* Permission 2: Notifications */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-start gap-3.5">
            <div className="p-2.5 bg-sky-100 text-sky-700 rounded-xl shrink-0 mt-0.5">
              <Bell className="w-5 h-5" />
            </div>
            <div className="flex-1 text-xs">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-slate-900">Trip & Safety Notifications</h4>
                {notificationsGranted === true && (
                  <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200">
                    <Check className="w-3 h-3" /> Granted
                  </span>
                )}
                {notificationsGranted === false && (
                  <span className="text-[10px] font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    Denied
                  </span>
                )}
              </div>
              <p className="text-slate-500 text-[11px] mt-1 leading-normal">
                Receive 6-hourly weather warnings, trip departure reminders, and safety check-in prompts.
              </p>
            </div>
          </div>

          {/* Safety Privacy Guarantee */}
          <div className="bg-emerald-50/80 p-3 rounded-xl border border-emerald-200 text-[11px] text-emerald-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Your location & emergency contacts are encrypted and never publicly exposed.
            </span>
          </div>

          {/* Primary Action Buttons */}
          <div className="space-y-2 pt-2">
            <button
              onClick={handleGrantAll}
              disabled={isRequesting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs py-3.5 rounded-2xl shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {isRequesting ? (
                <span>Requesting Permissions...</span>
              ) : (
                <>
                  <span>Enable Permissions & Start Exploring</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <button
              onClick={handleSkip}
              className="w-full text-slate-400 hover:text-slate-600 font-bold text-xs py-2 text-center transition-colors cursor-pointer"
            >
              Continue with Limited Access
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
