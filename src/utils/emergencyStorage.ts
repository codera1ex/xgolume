import {
  EmergencyContact,
  EmergencySettings,
  SOSHistoryEvent,
  SafetyCheckInState,
  EmergencyServicesNumbers
} from "../types";

const CONTACTS_KEY = "golumo_emergency_contacts_v1";
const SETTINGS_KEY = "golumo_emergency_settings_v1";
const SOS_ACTIVE_KEY = "golumo_active_sos_session_v1";
const HISTORY_KEY = "golumo_sos_history_v1";
const CHECKIN_KEY = "golumo_active_checkin_v1";

// Default Initial Contacts for Solo Travel Safety Demo
const DEFAULT_CONTACTS: EmergencyContact[] = [
  {
    id: "ec-1",
    name: "Aarav Sharma",
    phone: "+91 98765 43210",
    relationship: "Parent / Brother",
    email: "aarav.sharma@example.com",
    isPrimary: true
  },
  {
    id: "ec-2",
    name: "Ananya Verma",
    phone: "+91 91234 56789",
    relationship: "Trusted Friend",
    email: "ananya.verma@example.com",
    isPrimary: false
  }
];

const DEFAULT_SETTINGS: EmergencySettings = {
  sosEnabled: true,
  autoShareLocation: true,
  checkInEscalationEnabled: true,
  testModeEnabled: false,
  preferredCountry: "IN"
};

// Emergency Numbers per Country
export const EMERGENCY_NUMBERS_MAP: Record<string, EmergencyServicesNumbers> = {
  IN: {
    country: "India",
    police: "112",
    ambulance: "102",
    fire: "101",
    womenHelpline: "1091",
    touristHelpline: "1363",
    general: "112"
  },
  US: {
    country: "United States",
    police: "911",
    ambulance: "911",
    fire: "911",
    general: "911"
  },
  GB: {
    country: "United Kingdom",
    police: "999",
    ambulance: "999",
    fire: "999",
    general: "112"
  },
  AU: {
    country: "Australia",
    police: "000",
    ambulance: "000",
    fire: "000",
    general: "000"
  },
  OTHER: {
    country: "International Standard",
    police: "112",
    ambulance: "112",
    fire: "112",
    general: "112"
  }
};

export function getEmergencyContacts(): EmergencyContact[] {
  try {
    const raw = localStorage.getItem(CONTACTS_KEY);
    if (!raw) {
      localStorage.setItem(CONTACTS_KEY, JSON.stringify(DEFAULT_CONTACTS));
      return DEFAULT_CONTACTS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return DEFAULT_CONTACTS;
  }
}

export function saveEmergencyContacts(contacts: EmergencyContact[]): void {
  localStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts));
  // Background API sync
  fetch("/api/emergency/contacts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contacts })
  }).catch(() => {});
}

export function getEmergencySettings(): EmergencySettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (e) {
    return DEFAULT_SETTINGS;
  }
}

export function saveEmergencySettings(settings: EmergencySettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function getActiveSOSSession(): SOSHistoryEvent | null {
  try {
    const raw = localStorage.getItem(SOS_ACTIVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

export function setActiveSOSSession(session: SOSHistoryEvent | null): void {
  if (session) {
    localStorage.setItem(SOS_ACTIVE_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(SOS_ACTIVE_KEY);
  }
}

export function getSOSHistory(): SOSHistoryEvent[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

export function addSOSHistoryEvent(event: SOSHistoryEvent): void {
  const history = getSOSHistory();
  const updated = [event, ...history.filter(h => h.id !== event.id)];
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
}

export function getActiveCheckIn(): SafetyCheckInState | null {
  try {
    const raw = localStorage.getItem(CHECKIN_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

export function saveActiveCheckIn(checkIn: SafetyCheckInState | null): void {
  if (checkIn) {
    localStorage.setItem(CHECKIN_KEY, JSON.stringify(checkIn));
  } else {
    localStorage.removeItem(CHECKIN_KEY);
  }
}

// Wipes this device's locally cached emergency contacts/settings/SOS
// history. Must be called on logout so one account's emergency contact
// PII (names, phone numbers, emails) can never leak into the next
// account's session on a shared device/browser.
export function clearEmergencyData(): void {
  localStorage.removeItem(CONTACTS_KEY);
  localStorage.removeItem(SETTINGS_KEY);
  localStorage.removeItem(SOS_ACTIVE_KEY);
  localStorage.removeItem(HISTORY_KEY);
  localStorage.removeItem(CHECKIN_KEY);
}
