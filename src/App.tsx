import React, { useEffect, useState } from "react";
import OnboardingGate from "./components/OnboardingGate";
import AuthScreen from "./components/auth/AuthScreen";
import HomeApp from "./HomeApp";
import { UserProfile as AuthUserProfile } from "./types/auth-types";
import { saveUserProfile, getUserProfile, setSyncUserId, hydrateFromSupabase, clearLocalUserData } from "./utils/storage";
import { clearEmergencyData } from "./utils/emergencyStorage";
import { supabase, isSupabaseConfigured } from "./lib/supabase";

type AppStage = "onboarding" | "auth" | "home";

const ONBOARDING_KEY = "golumo_onboarding_completed";
// Demo-mode-only session flag, used when Supabase isn't configured yet.
const DEMO_SESSION_KEY = "golumo_demo_auth_session";

export default function App() {
  const [stage, setStage] = useState<AppStage>("onboarding");
  const [ready, setReady] = useState(false);

  // On first load, figure out which screen to show:
  // no onboarding yet -> onboarding slides
  // onboarding done but not signed in -> login / sign up
  // both done -> straight into the app
  useEffect(() => {
    (async () => {
      const onboardingDone = localStorage.getItem(ONBOARDING_KEY) === "true";

      if (isSupabaseConfigured) {
        // Real mode: check for a live Supabase session. This also picks up
        // a session created moments ago by a Google OAuth redirect, since
        // supabase-js persists it to localStorage automatically on return.
        const { data } = await supabase!.auth.getSession();
        const session = data.session;

        if (session?.user) {
          clearLocalUserData();
          clearEmergencyData();
          setSyncUserId(session.user.id);
          await hydrateFromSupabase(session.user.id);
          localStorage.setItem(ONBOARDING_KEY, "true");
          setStage("home");
        } else if (!onboardingDone) {
          setStage("onboarding");
        } else {
          setStage("auth");
        }
      } else {
        // Demo mode fallback (no Supabase keys set yet)
        const demoSession = localStorage.getItem(DEMO_SESSION_KEY);
        if (!onboardingDone) {
          setStage("onboarding");
        } else if (!demoSession) {
          setStage("auth");
        } else {
          setStage("home");
        }
      }

      setReady(true);
    })();
  }, []);

  const handleOnboardingComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    setStage("auth");
  };

  const handleAuthenticated = async (profile: AuthUserProfile) => {
    // Defense-in-depth: wipe any leftover local cache from a previous
    // account on this device BEFORE loading this user's data. Without
    // this, a brand-new user (with nothing in Supabase yet) would
    // otherwise see whatever the last logged-out user left behind in
    // localStorage, since hydrateFromSupabase only overwrites the cache
    // when it finds real data to replace it with.
    clearLocalUserData();
    clearEmergencyData();

    if (isSupabaseConfigured) {
      setSyncUserId(profile.id);
      await hydrateFromSupabase(profile.id);
    } else {
      localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(profile));
    }

    // Carry the name/email into GoLumo's own profile store so Home,
    // Header, and the Profile tab show the right person right away.
    const existing = getUserProfile();
    saveUserProfile({
      ...existing,
      name: profile.displayName,
      email: profile.email || existing.email
    });

    setStage("home");
  };

  const handleLogout = async () => {
    if (isSupabaseConfigured) {
      await supabase!.auth.signOut();
      setSyncUserId(null);
    } else {
      localStorage.removeItem(DEMO_SESSION_KEY);
    }

    // Wipe this device's cached trips/profile/emergency data so it can
    // never leak into the next person's session on a shared device.
    clearLocalUserData();
    clearEmergencyData();

    // Clear the onboarding flag too so logging out sends the user all the
    // way back to the "Get Started" onboarding slides, as requested.
    localStorage.removeItem(ONBOARDING_KEY);
    setStage("onboarding");
  };

  if (!ready) return null;

  if (stage === "onboarding") {
    return <OnboardingGate onComplete={handleOnboardingComplete} />;
  }

  if (stage === "auth") {
    return <AuthScreen onAuthenticated={handleAuthenticated} />;
  }

  return <HomeApp onLogout={handleLogout} />;
}
