import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  Plus,
  Trash2,
  Edit2,
  Check,
  PhoneCall,
  MapPin,
  Clock,
  ShieldCheck,
  AlertCircle,
  Users,
  Building2,
  Bell,
  RefreshCw,
  Info,
  Calendar,
  Sparkles,
  ChevronRight
} from "lucide-react";
import {
  EmergencyContact,
  EmergencySettings,
  SOSHistoryEvent,
  SafetyCheckInState,
  Trip
} from "../types";
import {
  getEmergencyContacts,
  saveEmergencyContacts,
  getEmergencySettings,
  saveEmergencySettings,
  getSOSHistory,
  getActiveCheckIn,
  saveActiveCheckIn,
  EMERGENCY_NUMBERS_MAP
} from "../utils/emergencyStorage";

interface EmergencySafetySectionProps {
  activeTrip?: Trip | null;
  onOpenSOSModal: (isTest: boolean) => void;
}

export const EmergencySafetySection: React.FC<EmergencySafetySectionProps> = ({
  activeTrip,
  onOpenSOSModal
}) => {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [settings, setSettings] = useState<EmergencySettings>(getEmergencySettings());
  const [history, setHistory] = useState<SOSHistoryEvent[]>([]);
  const [checkIn, setCheckIn] = useState<SafetyCheckInState | null>(getActiveCheckIn());
  const [locationPermission, setLocationPermission] = useState<"granted" | "denied" | "prompt">("prompt");
  const [lastCoords, setLastCoords] = useState<{ lat: number; lng: number; time: string } | null>(null);

  // Contact Form State
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formRel, setFormRel] = useState("Family");
  const [formEmail, setFormEmail] = useState("");
  const [formIsPrimary, setFormIsPrimary] = useState(false);

  // Check-In Duration Selector
  const [selectedCheckInMins, setSelectedCheckInMins] = useState<number>(30);

  // Load Initial Data
  useEffect(() => {
    setContacts(getEmergencyContacts());
    setHistory(getSOSHistory());

    // Check Geolocation status
    if ("permissions" in navigator) {
      navigator.permissions.query({ name: "geolocation" as any }).then((res) => {
        setLocationPermission(res.state as any);
      });
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLastCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            time: new Date().toLocaleTimeString()
          });
          setLocationPermission("granted");
        },
        () => {
          setLocationPermission("denied");
        }
      );
    }
  }, []);

  // Save Settings Toggle
  const handleToggleSOS = () => {
    const updated = { ...settings, sosEnabled: !settings.sosEnabled };
    setSettings(updated);
    saveEmergencySettings(updated);
  };

  // Contact Handlers
  const handleSaveContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formPhone) return;

    let updatedList: EmergencyContact[] = [...contacts];

    if (editingContactId) {
      updatedList = updatedList.map((c) =>
        c.id === editingContactId
          ? {
              ...c,
              name: formName,
              phone: formPhone,
              relationship: formRel,
              email: formEmail,
              isPrimary: formIsPrimary
            }
          : c
      );
    } else {
      const newC: EmergencyContact = {
        id: "ec_" + Date.now(),
        name: formName,
        phone: formPhone,
        relationship: formRel,
        email: formEmail,
        isPrimary: formIsPrimary || contacts.length === 0
      };
      updatedList.push(newC);
    }

    if (formIsPrimary) {
      const primaryId = editingContactId || updatedList[updatedList.length - 1].id;
      updatedList = updatedList.map((c) => ({
        ...c,
        isPrimary: c.id === primaryId
      }));
    }

    setContacts(updatedList);
    saveEmergencyContacts(updatedList);
    resetContactForm();
  };

  const handleEditContact = (c: EmergencyContact) => {
    setEditingContactId(c.id);
    setFormName(c.name);
    setFormPhone(c.phone);
    setFormRel(c.relationship);
    setFormEmail(c.email || "");
    setFormIsPrimary(c.isPrimary);
    setIsAddingContact(true);
  };

  const handleDeleteContact = (id: string) => {
    const updated = contacts.filter((c) => c.id !== id);
    setContacts(updated);
    saveEmergencyContacts(updated);
  };

  const handleSetPrimary = (id: string) => {
    const updated = contacts.map((c) => ({
      ...c,
      isPrimary: c.id === id
    }));
    setContacts(updated);
    saveEmergencyContacts(updated);
  };

  const resetContactForm = () => {
    setIsAddingContact(false);
    setEditingContactId(null);
    setFormName("");
    setFormPhone("");
    setFormRel("Family");
    setFormEmail("");
    setFormIsPrimary(false);
  };

  // Safety Check-In Handlers
  const handleStartCheckIn = () => {
    const scheduled = new Date(Date.now() + selectedCheckInMins * 60000).toISOString();
    const primaryC = contacts.find((c) => c.isPrimary) || contacts[0];

    const newCheckIn: SafetyCheckInState = {
      id: "ci_" + Date.now(),
      scheduledTime: scheduled,
      durationMinutes: selectedCheckInMins,
      status: "pending",
      escalatedContactName: primaryC ? primaryC.name : "Emergency Contact",
      createdAt: new Date().toISOString()
    };

    setCheckIn(newCheckIn);
    saveActiveCheckIn(newCheckIn);
  };

  const handleConfirmSafe = () => {
    if (!checkIn) return;
    const resolved: SafetyCheckInState = {
      ...checkIn,
      status: "confirmed_safe"
    };
    setCheckIn(null);
    saveActiveCheckIn(null);
  };

  const emergencyNumbers = EMERGENCY_NUMBERS_MAP[settings.preferredCountry] || EMERGENCY_NUMBERS_MAP["IN"];

  return (
    <div className="space-y-4 animate-fade-in text-xs">
      {/* 1. Main Emergency SOS Status Header */}
      <div className="bg-gradient-to-r from-rose-900 via-rose-800 to-red-950 p-5 rounded-3xl text-white shadow-xl shadow-rose-950/20 border-2 border-rose-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-white/10 text-rose-300 border border-white/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white">GoLumo Emergency SOS</h3>
              <span className="text-[10px] text-rose-200">24/7 Solo Traveler Protection</span>
            </div>
          </div>

          {/* SOS Toggle Switch */}
          <button
            onClick={handleToggleSOS}
            className={`px-3 py-1.5 rounded-full text-[11px] font-extrabold transition-all border flex items-center gap-1.5 cursor-pointer ${
              settings.sosEnabled
                ? "bg-emerald-500 text-white border-emerald-400"
                : "bg-white/20 text-rose-200 border-white/20"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${settings.sosEnabled ? "bg-white animate-pulse" : "bg-rose-300"}`} />
            <span>{settings.sosEnabled ? "SOS Enabled" : "SOS Disabled"}</span>
          </button>
        </div>

        {/* SOS Trigger Actions */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={() => onOpenSOSModal(false)}
            className="bg-rose-600 hover:bg-rose-700 active:scale-98 text-white font-extrabold py-3 px-3 rounded-2xl shadow-lg shadow-rose-950/40 flex items-center justify-center gap-2 text-xs transition-all cursor-pointer"
          >
            <ShieldAlert className="w-4 h-4 text-amber-300 fill-amber-300" />
            <span>🚨 TRIGGER SOS NOW</span>
          </button>

          <button
            onClick={() => onOpenSOSModal(true)}
            className="bg-white/15 hover:bg-white/25 active:scale-98 text-rose-100 border border-white/20 font-bold py-3 px-3 rounded-2xl flex items-center justify-center gap-1.5 text-xs transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Test SOS Signal</span>
          </button>
        </div>
      </div>

      {/* 2. Active Trip Safety Card */}
      {activeTrip && (
        <div className="bg-white rounded-3xl p-4 shadow-xl shadow-blue-900/5 border-2 border-blue-100 space-y-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-800 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Active Trip Safety Profile</span>
            </span>
            <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-200">
              On-Site Active
            </span>
          </div>

          <div className="font-extrabold text-sm text-slate-900">{activeTrip.title}</div>
          <div className="text-[11px] text-slate-600 font-medium">
            📍 {activeTrip.destination} • {activeTrip.startDate} to {activeTrip.endDate}
          </div>

          {activeTrip.recommendedStays.length > 0 && (
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-[11px]">
              <span className="font-extrabold text-slate-800">Primary Stay: </span>
              <span className="text-slate-600">{activeTrip.recommendedStays[0].name} ({activeTrip.recommendedStays[0].location})</span>
            </div>
          )}
        </div>
      )}

      {/* 3. Safety Check-In Feature */}
      <div className="bg-white rounded-3xl p-5 shadow-xl shadow-blue-900/5 border-2 border-blue-100 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-extrabold text-xs text-slate-900">Safety Check-In Timer</h4>
              <p className="text-[10px] text-slate-500">Auto prompt for solo activities or late walks</p>
            </div>
          </div>
        </div>

        {checkIn ? (
          <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-amber-900 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-600 animate-spin" />
                <span>Check-In Timer Active ({checkIn.durationMinutes}m)</span>
              </span>
              <span className="text-[10px] font-bold text-amber-800">
                Escalates to: {checkIn.escalatedContactName}
              </span>
            </div>

            <button
              onClick={handleConfirmSafe}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Confirm "I am Safe"</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              {[15, 30, 60, 120].map((mins) => (
                <button
                  key={mins}
                  onClick={() => setSelectedCheckInMins(mins)}
                  className={`flex-1 py-2 rounded-xl text-[11px] font-extrabold border transition-all cursor-pointer ${
                    selectedCheckInMins === mins
                      ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {mins >= 60 ? `${mins / 60}h` : `${mins}m`}
                </button>
              ))}
            </div>

            <button
              onClick={handleStartCheckIn}
              className="w-full bg-blue-900 hover:bg-blue-950 text-white font-extrabold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5 text-amber-300" />
              <span>Start Safety Check-In ({selectedCheckInMins} mins)</span>
            </button>
          </div>
        )}
      </div>

      {/* 4. Trusted Emergency Contacts */}
      <div className="bg-white rounded-3xl p-5 shadow-xl shadow-blue-900/5 border-2 border-blue-100 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-extrabold text-xs text-slate-900">Trusted Emergency Contacts</h4>
              <p className="text-[10px] text-slate-500">Notified immediately upon SOS trigger</p>
            </div>
          </div>

          <button
            onClick={() => {
              resetContactForm();
              setIsAddingContact(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-extrabold px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Contact</span>
          </button>
        </div>

        {/* Add/Edit Form */}
        {isAddingContact && (
          <form onSubmit={handleSaveContact} className="bg-blue-50/70 p-3.5 rounded-2xl border border-blue-200 space-y-2.5">
            <h5 className="font-extrabold text-blue-950 text-xs">
              {editingContactId ? "Edit Contact" : "New Emergency Contact"}
            </h5>

            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                required
                placeholder="Full Name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl p-2 font-medium text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <input
                type="tel"
                required
                placeholder="Phone Number (+91...)"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl p-2 font-medium text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <select
                value={formRel}
                onChange={(e) => setFormRel(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl p-2 font-medium text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Parent">Parent</option>
                <option value="Spouse / Partner">Spouse / Partner</option>
                <option value="Sibling">Sibling</option>
                <option value="Trusted Friend">Trusted Friend</option>
                <option value="Colleague">Colleague</option>
              </select>

              <input
                type="email"
                placeholder="Email (Optional)"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl p-2 font-medium text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPrimary"
                checked={formIsPrimary}
                onChange={(e) => setFormIsPrimary(e.target.checked)}
                className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
              />
              <label htmlFor="isPrimary" className="font-bold text-slate-800 text-[11px] cursor-pointer">
                Set as Primary Emergency Contact
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={resetContactForm}
                className="bg-white text-slate-600 font-bold px-3 py-1.5 rounded-xl text-[11px] border border-slate-200 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="bg-blue-600 text-white font-extrabold px-4 py-1.5 rounded-xl text-[11px] shadow-xs cursor-pointer"
              >
                Save Contact
              </button>
            </div>
          </form>
        )}

        {/* Contacts List */}
        <div className="space-y-2">
          {contacts.map((c) => (
            <div
              key={c.id}
              className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between"
            >
              <div>
                <div className="flex items-center gap-1.5 font-extrabold text-slate-900">
                  <span>{c.name}</span>
                  {c.isPrimary && (
                    <span className="text-[9px] font-black bg-blue-600 text-white px-2 py-0.2 rounded-full">
                      Primary
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {c.phone} • {c.relationship} {c.email ? `• ${c.email}` : ""}
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {!c.isPrimary && (
                  <button
                    onClick={() => handleSetPrimary(c.id)}
                    className="text-[10px] font-bold text-blue-600 hover:underline px-1"
                  >
                    Set Primary
                  </button>
                )}

                <button
                  onClick={() => handleEditContact(c)}
                  className="p-1.5 text-slate-500 hover:text-blue-600 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => handleDeleteContact(c.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-slate-100 p-2.5 rounded-xl text-[10px] text-slate-500 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span>These contacts will strictly be used for safety & SOS notifications.</span>
        </div>
      </div>

      {/* 5. Emergency Services Numbers */}
      <div className="bg-white rounded-3xl p-5 shadow-xl shadow-blue-900/5 border-2 border-blue-100 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <span className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
            <PhoneCall className="w-4 h-4 text-rose-600" />
            <span>Emergency Services ({emergencyNumbers.country})</span>
          </span>

          <select
            value={settings.preferredCountry}
            onChange={(e) => {
              const updated = { ...settings, preferredCountry: e.target.value as any };
              setSettings(updated);
              saveEmergencySettings(updated);
            }}
            className="text-[10px] font-extrabold bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 focus:outline-none"
          >
            <option value="IN">India (112)</option>
            <option value="US">United States (911)</option>
            <option value="GB">United Kingdom (999)</option>
            <option value="AU">Australia (000)</option>
            <option value="OTHER">International (112)</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <a
            href={`tel:${emergencyNumbers.police}`}
            className="p-2.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-between text-rose-950 font-extrabold cursor-pointer hover:bg-rose-100/60"
          >
            <span>Police</span>
            <span className="bg-rose-600 text-white px-2 py-0.5 rounded-lg text-[10px]">
              {emergencyNumbers.police}
            </span>
          </a>

          <a
            href={`tel:${emergencyNumbers.ambulance}`}
            className="p-2.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-between text-rose-950 font-extrabold cursor-pointer hover:bg-rose-100/60"
          >
            <span>Ambulance</span>
            <span className="bg-rose-600 text-white px-2 py-0.5 rounded-lg text-[10px]">
              {emergencyNumbers.ambulance}
            </span>
          </a>

          {emergencyNumbers.womenHelpline && (
            <a
              href={`tel:${emergencyNumbers.womenHelpline}`}
              className="p-2.5 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-between text-purple-950 font-extrabold cursor-pointer hover:bg-purple-100/60"
            >
              <span>Women Helpline</span>
              <span className="bg-purple-600 text-white px-2 py-0.5 rounded-lg text-[10px]">
                {emergencyNumbers.womenHelpline}
              </span>
            </a>
          )}

          {emergencyNumbers.touristHelpline && (
            <a
              href={`tel:${emergencyNumbers.touristHelpline}`}
              className="p-2.5 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-between text-sky-950 font-extrabold cursor-pointer hover:bg-sky-100/60"
            >
              <span>Tourist Helpline</span>
              <span className="bg-sky-600 text-white px-2 py-0.5 rounded-lg text-[10px]">
                {emergencyNumbers.touristHelpline}
              </span>
            </a>
          )}
        </div>
      </div>

      {/* 6. Diagnostics & Location Status */}
      <div className="bg-white rounded-3xl p-5 shadow-xl shadow-blue-900/5 border-2 border-blue-100 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-blue-600" />
            <span>Device Geolocation Status</span>
          </span>

          <span
            className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
              locationPermission === "granted"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-amber-50 text-amber-800 border-amber-200"
            }`}
          >
            {locationPermission === "granted" ? "GPS Active" : "Location Denied"}
          </span>
        </div>

        {lastCoords ? (
          <p className="text-[11px] text-slate-500 font-mono">
            Last updated: {lastCoords.time} ({lastCoords.lat.toFixed(4)}, {lastCoords.lng.toFixed(4)})
          </p>
        ) : (
          <p className="text-[11px] text-slate-500">
            Allow location permissions in browser settings for live emergency tracking.
          </p>
        )}
      </div>

      {/* 7. Private SOS History Log */}
      <div className="bg-white rounded-3xl p-5 shadow-xl shadow-blue-900/5 border-2 border-blue-100 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <span className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-slate-600" />
            <span>Private SOS & Safety History</span>
          </span>
          <span className="text-[10px] text-slate-400 font-bold">Only Visible to You</span>
        </div>

        {history.length > 0 ? (
          <div className="space-y-2">
            {history.map((ev) => (
              <div key={ev.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-900">
                    {ev.status === "test" ? "System Test Signal" : "Emergency SOS Signal"}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    {ev.status.toUpperCase()}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  Time: {new Date(ev.timestamp).toLocaleString()} • Duration: {ev.durationMinutes || 1}m
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-slate-400 font-medium text-center py-3">
            No previous emergency SOS triggers recorded.
          </p>
        )}
      </div>
    </div>
  );
};
