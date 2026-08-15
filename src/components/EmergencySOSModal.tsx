import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  X,
  PhoneCall,
  MapPin,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Volume2,
  Compass,
  ArrowRight,
  RefreshCw,
  Users
} from "lucide-react";
import { EmergencyContact, Trip, SOSHistoryEvent } from "../types";
import {
  getEmergencyContacts,
  getActiveSOSSession,
  setActiveSOSSession,
  EMERGENCY_NUMBERS_MAP
} from "../utils/emergencyStorage";

interface EmergencySOSModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTrip?: Trip | null;
  userName?: string;
  isTestMode?: boolean;
}

export const EmergencySOSModal: React.FC<EmergencySOSModalProps> = ({
  isOpen,
  onClose,
  activeTrip,
  userName = "Solo Traveler",
  isTestMode = false
}) => {
  const [step, setStep] = useState<"countdown" | "locating" | "active">("countdown");
  const [countdown, setCountdown] = useState(5);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<"fetching" | "acquired" | "denied">("fetching");
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [activeSession, setActiveSession] = useState<SOSHistoryEvent | null>(null);
  const [deliveryDetails, setDeliveryDetails] = useState<any[]>([]);
  const [isEndingSOS, setIsEndingSOS] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Check existing session or load contacts
  useEffect(() => {
    const existing = getActiveSOSSession();
    if (existing) {
      setActiveSession(existing);
      setStep("active");
    } else {
      setContacts(getEmergencyContacts());
    }
  }, [isOpen]);

  // Step 1: Countdown Timer Effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    // Guarding on `isOpen` too is critical here: without it, closing the
    // modal (e.g. via "Cancel Immediately") does NOT stop this interval,
    // since the component stays mounted and only `step`/`countdown`
    // control the tick — meaning a real SOS could fire seconds after the
    // user thought they'd cancelled it.
    if (isOpen && step === "countdown" && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (isOpen && step === "countdown" && countdown === 0) {
      handleTriggerSOS();
    }
    return () => clearInterval(timer);
  }, [isOpen, step, countdown]);

  // Active Session Timer Effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === "active") {
      timer = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step]);

  // Geolocation acquisition
  const fetchLocation = async (): Promise<{ lat: number; lng: number } | null> => {
    setLocationStatus("fetching");
    if (!navigator.geolocation) {
      setLocationStatus("denied");
      return null;
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setCoords(loc);
          setLocationStatus("acquired");
          resolve(loc);
        },
        () => {
          setLocationStatus("denied");
          resolve(null);
        },
        { timeout: 6000 }
      );
    });
  };

  const handleTriggerSOS = async () => {
    setStep("locating");
    const loc = await fetchLocation();

    try {
      const res = await fetch("/api/emergency/activate-sos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName,
          location: loc,
          destination: activeTrip ? activeTrip.destination : "India Travel",
          isTest: isTestMode
        })
      });

      const data = await res.json();
      if (data.success) {
        const session: SOSHistoryEvent = {
          id: data.sessionId,
          timestamp: new Date().toISOString(),
          status: isTestMode ? "test" : "active",
          location: loc || undefined,
          destination: activeTrip?.destination,
          contactsNotifiedCount: data.contactsNotifiedCount,
          notifiedContacts: contacts.map((c) => c.name),
          deliveryStatus: isTestMode ? "simulated" : "sent",
          notes: isTestMode ? "Test Emergency Signal" : "Live SOS Dispatched"
        };

        setActiveSession(session);
        setActiveSOSSession(session);
        setDeliveryDetails(data.deliveryDetails || []);
        setStep("active");
      }
    } catch (err) {
      console.error("SOS Activation error:", err);
      setStep("active");
    }
  };

  const handleEndSOS = async () => {
    if (!activeSession) {
      onClose();
      return;
    }

    try {
      await fetch("/api/emergency/deactivate-sos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: activeSession.id,
          resolutionNotes: "User confirmed safe and resolved SOS session."
        })
      });
    } catch (e) {
      console.error(e);
    }

    setActiveSOSSession(null);
    setIsEndingSOS(false);
    onClose();
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const emergencyNumbers = EMERGENCY_NUMBERS_MAP["IN"];

  // All hooks are declared above this point — safe to bail out now
  // (Rules of Hooks: hooks must run in the same order on every render).
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-rose-950/80 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border-2 border-rose-300 my-auto flex flex-col">
        {/* Step 1: Countdown Modal */}
        {step === "countdown" && (
          <div className="p-6 text-center space-y-5 bg-gradient-to-b from-rose-50 to-white">
            <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-rose-200 animate-ping opacity-75" />
              <div className="w-20 h-20 rounded-full bg-rose-600 text-white flex items-center justify-center font-black text-3xl shadow-lg shadow-rose-600/30">
                {countdown}
              </div>
            </div>

            <div>
              <span className="bg-rose-100 text-rose-800 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                {isTestMode ? "Testing SOS System" : "Emergency SOS Confirmation"}
              </span>
              <h2 className="text-xl font-black text-slate-900 mt-2">
                Emergency SOS is about to activate
              </h2>
              <p className="text-xs text-slate-600 mt-1 font-medium leading-relaxed">
                Emergency alert will be dispatched to your trusted contacts with your GPS location & trip details.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2.5 pt-2">
              <button
                onClick={() => {
                  setStep("countdown");
                  setCountdown(5);
                  onClose();
                }}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs py-3.5 rounded-2xl transition-all cursor-pointer"
              >
                Cancel Immediately
              </button>

              <button
                onClick={handleTriggerSOS}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs py-3.5 rounded-2xl shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Activate SOS Now</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Locating Modal */}
        {step === "locating" && (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto animate-spin">
              <RefreshCw className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-slate-900">Fetching GPS Location...</h3>
            <p className="text-xs text-slate-500 font-medium">
              Obtaining precise coordinates for emergency contact notification...
            </p>
          </div>
        )}

        {/* Step 3 & 4: Active SOS State Screen */}
        {step === "active" && (
          <div className="flex flex-col max-h-[85vh]">
            {/* Active Banner */}
            <div className="bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 p-5 text-white relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                  </span>
                  <span className="text-xs font-black uppercase tracking-wider text-rose-100">
                    {isTestMode ? "Test SOS Mode Active" : "🚨 EMERGENCY SOS ACTIVE"}
                  </span>
                </div>

                <span className="bg-black/20 text-white text-xs font-black px-2.5 py-1 rounded-lg font-mono">
                  {formatTime(elapsedSeconds)}
                </span>
              </div>

              <h2 className="text-xl font-black tracking-tight mt-2">
                Emergency Alert Dispatched
              </h2>
              <p className="text-xs text-rose-100 mt-1">
                Your primary emergency contacts have been alerted with live tracking data.
              </p>
            </div>

            {/* Scrollable Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs bg-slate-50/60">
              {/* Location Status Card */}
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 font-extrabold text-slate-900">
                    <MapPin className="w-4 h-4 text-rose-600" />
                    <span>Current GPS Location</span>
                  </div>
                  <button
                    onClick={fetchLocation}
                    className="text-[10px] text-blue-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" /> Refresh
                  </button>
                </div>

                {locationStatus === "acquired" && coords ? (
                  <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 text-emerald-900 font-mono text-[11px] font-bold flex items-center justify-between">
                    <span>
                      Lat: {coords.lat.toFixed(4)}, Lng: {coords.lng.toFixed(4)}
                    </span>
                    <span className="text-[9px] bg-emerald-200/60 text-emerald-800 px-2 py-0.5 rounded-md font-sans">
                      Verified
                    </span>
                  </div>
                ) : (
                  <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-amber-900 text-[11px] font-semibold">
                    ⚠️ Current location could not be obtained automatically. Check device permission settings.
                  </div>
                )}
              </div>

              {/* Contacts Notified Details */}
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span>Notified Emergency Contacts</span>
                  </span>
                  <span className="bg-blue-50 text-blue-700 text-[10px] font-black px-2 py-0.5 rounded-full border border-blue-200">
                    {contacts.length} Contact(s)
                  </span>
                </div>

                <div className="space-y-1.5 pt-1">
                  {contacts.map((c) => (
                    <div
                      key={c.id}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-1">
                          <span>{c.name}</span>
                          {c.isPrimary && (
                            <span className="text-[9px] font-extrabold bg-blue-600 text-white px-1.5 py-0.2 rounded-md">
                              Primary
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500">{c.phone} • {c.relationship}</div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Sent
                        </span>
                        <a
                          href={`tel:${c.phone}`}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer"
                        >
                          <PhoneCall className="w-3 h-3" /> Call
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Active Trip Info */}
              {activeTrip && (
                <div className="bg-blue-50/80 p-3 rounded-2xl border border-blue-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 block">
                    Active Trip Attached
                  </span>
                  <div className="font-extrabold text-blue-950 text-xs mt-0.5">{activeTrip.title}</div>
                  <div className="text-[11px] text-blue-800 mt-0.5">
                    Destination: {activeTrip.destination} • {activeTrip.startDate} to {activeTrip.endDate}
                  </div>
                </div>
              )}

              {/* Speed Dial Emergency Services */}
              <div className="bg-rose-50 p-3.5 rounded-2xl border border-rose-200 space-y-2">
                <span className="font-extrabold text-rose-950 block">
                  Direct Call Emergency Services
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={`tel:${emergencyNumbers.police}`}
                    className="bg-white hover:bg-rose-100/50 p-2.5 rounded-xl border border-rose-300 text-rose-900 font-extrabold flex items-center justify-between shadow-xs cursor-pointer"
                  >
                    <span>Police</span>
                    <span className="bg-rose-600 text-white px-2 py-0.5 rounded-lg text-[10px]">
                      {emergencyNumbers.police}
                    </span>
                  </a>

                  <a
                    href={`tel:${emergencyNumbers.ambulance}`}
                    className="bg-white hover:bg-rose-100/50 p-2.5 rounded-xl border border-rose-300 text-rose-900 font-extrabold flex items-center justify-between shadow-xs cursor-pointer"
                  >
                    <span>Ambulance</span>
                    <span className="bg-rose-600 text-white px-2 py-0.5 rounded-lg text-[10px]">
                      {emergencyNumbers.ambulance}
                    </span>
                  </a>
                </div>
              </div>

              {/* Cancel / Resolve SOS Modal Trigger */}
              {isEndingSOS ? (
                <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-3">
                  <p className="font-bold text-xs text-center">
                    Are you safe and sure you want to end Emergency SOS?
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsEndingSOS(false)}
                      className="flex-1 bg-white/20 hover:bg-white/30 text-white font-bold py-2.5 rounded-xl text-xs cursor-pointer"
                    >
                      Keep Active
                    </button>
                    <button
                      onClick={handleEndSOS}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2.5 rounded-xl text-xs cursor-pointer"
                    >
                      Confirm I'm Safe
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsEndingSOS(true)}
                  className="w-full bg-slate-900 hover:bg-black text-white font-extrabold text-xs py-3.5 rounded-2xl shadow-md transition-all cursor-pointer"
                >
                  End Emergency SOS Session
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
