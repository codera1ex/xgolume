import { Trip, UserProfile } from "../types";
import { INITIAL_TRIPS, INITIAL_USER_PROFILE } from "../data/mockData";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

const TRIPS_KEY = "golumo_saved_trips_v1";
const PROFILE_KEY = "golumo_user_profile_v1";

// The currently signed-in Supabase user id, set by src/App.tsx right after
// login. All reads/writes below stay synchronous against localStorage (so
// existing components don't need to change), and mirror to Supabase in the
// background whenever a user id is known — giving real cross-device
// persistence without a full async rewrite of the UI layer.
let currentUserId: string | null = null;

export function setSyncUserId(userId: string | null): void {
  currentUserId = userId;
}

// Wipes this device's locally cached trips/profile. Must be called on
// logout (and defensively before hydrating a newly-logged-in user) so one
// account's data can never bleed into another account's session on a
// shared device/browser.
export function clearLocalUserData(): void {
  localStorage.removeItem(TRIPS_KEY);
  localStorage.removeItem(PROFILE_KEY);
}

// Called once right after login: pulls this user's saved data down from
// Supabase (if any) and overwrites the local cache with it, so a returning
// user sees their real trips/profile instead of another device's leftovers.
export async function hydrateFromSupabase(userId: string): Promise<void> {
  if (!supabase) return;

  try {
    const [{ data: profileRow }, { data: tripRows }] = await Promise.all([
      supabase.from("profiles").select("data").eq("id", userId).maybeSingle(),
      supabase.from("trips").select("data").eq("user_id", userId)
    ]);

    if (profileRow?.data) {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profileRow.data));
    }
    if (tripRows && tripRows.length > 0) {
      const trips = tripRows.map((r: { data: Trip }) => r.data);
      localStorage.setItem(TRIPS_KEY, JSON.stringify(trips));
    }
  } catch (e) {
    console.error("Failed to hydrate from Supabase, using local cache instead", e);
  }
}

export function getSavedTrips(): Trip[] {
  try {
    const raw = localStorage.getItem(TRIPS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error("Failed to parse trips from storage", e);
  }
  // Initialize with initial trips if empty
  saveAllTrips(INITIAL_TRIPS);
  return INITIAL_TRIPS;
}

export function saveAllTrips(trips: Trip[]): void {
  try {
    localStorage.setItem(TRIPS_KEY, JSON.stringify(trips));
  } catch (e) {
    console.error("Failed to save trips", e);
  }

  // Background sync to Supabase (best-effort, not awaited by callers)
  if (isSupabaseConfigured && currentUserId) {
    const userId = currentUserId;
    supabase!
      .from("trips")
      .upsert(
        trips.map(t => ({ id: t.id, user_id: userId, data: t, updated_at: new Date().toISOString() })),
        { onConflict: "id" }
      )
      .then(({ error }: { error: unknown }) => {
        if (error) console.error("Supabase trips sync failed", error);
      });
  }
}

export function autoSaveTrip(newTrip: Trip): Trip[] {
  const current = getSavedTrips();
  const existingIdx = current.findIndex(t => t.id === newTrip.id);

  let updated: Trip[];
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = { ...newTrip, isSaved: true };
  } else {
    updated = [{ ...newTrip, isSaved: true }, ...current];
  }

  saveAllTrips(updated);
  return updated;
}

export function deleteTripById(id: string): Trip[] {
  const current = getSavedTrips();
  const filtered = current.filter(t => t.id !== id);
  saveAllTrips(filtered);

  if (isSupabaseConfigured && currentUserId) {
    supabase!
      .from("trips")
      .delete()
      .eq("id", id)
      .eq("user_id", currentUserId)
      .then(({ error }: { error: unknown }) => {
        if (error) console.error("Supabase trip delete failed", error);
      });
  }

  return filtered;
}

export function duplicateTripById(id: string): Trip[] {
  const current = getSavedTrips();
  const target = current.find(t => t.id === id);
  if (!target) return current;

  const copy: Trip = {
    ...JSON.parse(JSON.stringify(target)),
    id: "trip_copy_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8),
    title: `${target.title} (Copy)`,
    createdAt: new Date().toISOString()
  };

  const updated = [copy, ...current];
  saveAllTrips(updated);
  return updated;
}

export function getUserProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error("Failed to parse user profile", e);
  }
  saveUserProfile(INITIAL_USER_PROFILE);
  return INITIAL_USER_PROFILE;
}

export function saveUserProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.error("Failed to save profile", e);
  }

  if (isSupabaseConfigured && currentUserId) {
    supabase!
      .from("profiles")
      .upsert({ id: currentUserId, data: profile, updated_at: new Date().toISOString() })
      .then(({ error }: { error: unknown }) => {
        if (error) console.error("Supabase profile sync failed", error);
      });
  }
}
