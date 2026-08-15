import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { Navigation, NavTab } from "./components/Navigation";
import { DestinationSearch } from "./components/DestinationSearch";
import { TripPlannerModal } from "./components/TripPlannerModal";
import { TripDetailView } from "./components/TripDetailView";
import { SavedTripsDashboard } from "./components/SavedTripsDashboard";
import { UserProfileView } from "./components/UserProfileView";
import { WeatherNotificationBanner } from "./components/WeatherNotificationBanner";
import { LiveNearbyModal } from "./components/LiveNearbyModal";
import { EmergencySOSModal } from "./components/EmergencySOSModal";
import { OnboardingPermissionsModal } from "./components/OnboardingPermissionsModal";

import { Trip, UserProfile } from "./types";
import {
  getSavedTrips,
  autoSaveTrip,
  deleteTripById,
  duplicateTripById,
  getUserProfile,
  saveUserProfile
} from "./utils/storage";
import { Compass, Sparkles, Navigation as NavIcon, CloudSun, ShieldAlert } from "lucide-react";

interface AppProps {
  onLogout: () => void;
}

export default function App({ onLogout }: AppProps) {
  const [activeNavTab, setActiveNavTab] = useState<NavTab>("home");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedActivityCategory, setSelectedActivityCategory] = useState("all");

  const [trips, setTrips] = useState<Trip[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>(getUserProfile());
  const [selectedTripDetail, setSelectedTripDetail] = useState<Trip | null>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createInitialDest, setCreateInitialDest] = useState("");
  const [createInitialSpecificPlace, setCreateInitialSpecificPlace] = useState("");

  const [isWeatherModalOpen, setIsWeatherModalOpen] = useState(false);
  const [isNearbyModalOpen, setIsNearbyModalOpen] = useState(false);
  const [userLocation, setUserLocation] = useState("Detecting location...");
  // Emergency SOS & Onboarding states
  const [isSOSModalOpen, setIsSOSModalOpen] = useState(false);
  const [isSOSTestMode, setIsSOSTestMode] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  // Logging out clears the session in the parent app and sends the user
  // back to the onboarding screen (see src/App.tsx).
  const handleLogout = () => {
    onLogout();
  };

  // Load saved trips & check onboarding on mount
  useEffect(() => {
    const saved = getSavedTrips();
    setTrips(saved);

    const onboardingDone = localStorage.getItem("golumo_permissions_setup_completed");
    if (!onboardingDone) {
      setIsOnboardingOpen(true);
    }

    // Geolocation detection if available
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
+         try {
+           const res = await fetch(
+             `/api/reverse-geocode?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}`
+           );
+           const data = await res.json();
+           setUserLocation(data.city || "Your Location");
+         } catch (err) {
+           console.error("Reverse geocoding failed:", err);
+           setUserLocation("Your Location");
+         }
+       },
+       () => {
+         setUserLocation("Your Location");
+       }
      );
    }

  const handleOpenSOS = (isTest: boolean = false) => {
    setIsSOSTestMode(isTest);
    setIsSOSModalOpen(true);
  };


  // Trip Handlers
  const handleTripGenerated = (newTrip: Trip) => {
    const updatedList = autoSaveTrip(newTrip);
    setTrips(updatedList);
    setSelectedTripDetail(newTrip);
  };

  const handleTripUpdated = (updatedTrip: Trip) => {
    const updatedList = autoSaveTrip(updatedTrip);
    setTrips(updatedList);
    setSelectedTripDetail(updatedTrip);
  };

  const handleDeleteTrip = (id: string) => {
    const updatedList = deleteTripById(id);
    setTrips(updatedList);
    if (selectedTripDetail?.id === id) {
      setSelectedTripDetail(null);
    }
  };

  const handleDuplicateTrip = (id: string) => {
    const updatedList = duplicateTripById(id);
    setTrips(updatedList);
  };

  const handleOpenPlanForDestination = (destName: string) => {
    setCreateInitialDest(destName);
    setCreateInitialSpecificPlace("");
    setIsCreateModalOpen(true);
  };

  // If a trip detail view is active, render the full detailed trip page
  if (selectedTripDetail) {
    return (
      <TripDetailView
        trip={selectedTripDetail}
        onBack={() => setSelectedTripDetail(null)}
        onUpdateTrip={handleTripUpdated}
        onDeleteTrip={handleDeleteTrip}
        onDuplicateTrip={handleDuplicateTrip}
        userLocation={userLocation}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F7FF] font-sans antialiased text-blue-900 pb-28 selection:bg-blue-200">
      <div className="max-w-md mx-auto min-h-screen bg-[#F0F7FF] relative overflow-x-hidden">
        {/* Header */}
        <Header
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          userLocation={userLocation}
          unreadNotificationsCount={trips.length > 0 ? 1 : 0}
          onOpenNotifications={() => setIsWeatherModalOpen(true)}
          onOpenCreateTrip={() => {
            setCreateInitialDest("Manali, Himachal Pradesh");
            setCreateInitialSpecificPlace("");
            setIsCreateModalOpen(true);
          }}
        />

        {/* Main Body Content based on Tab */}
        <main className="px-4 py-3 space-y-3">
          {/* Quick AI Callout Banner in Sleek Dark Blue */}
          <div className="bg-blue-900 text-white rounded-3xl p-5 shadow-xl shadow-blue-900/10 flex items-center justify-between my-2">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-200 uppercase tracking-wider mb-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Instant AI Itinerary</span>
              </div>
              <h3 className="text-lg font-extrabold tracking-tight leading-snug">
                Custom Trips in 5 Seconds
              </h3>
            </div>
            <button
              onClick={() => {
                setCreateInitialDest("Jaipur, Rajasthan");
                setCreateInitialSpecificPlace("");
                setIsCreateModalOpen(true);
              }}
              className="bg-white/20 hover:bg-white/30 text-white font-extrabold text-xs px-3.5 py-2.5 rounded-xl backdrop-blur-md transition-all shrink-0 cursor-pointer"
            >
              Try Now
            </button>
          </div>

          {/* Quick Actions Bar (Live Weather, Nearby Spots & Emergency SOS) */}
          <div className="grid grid-cols-3 gap-2 my-1">
            <button
              onClick={() => setIsWeatherModalOpen(true)}
              className="bg-white hover:bg-blue-50 text-blue-900 p-2.5 rounded-2xl border-2 border-blue-100 shadow-xl shadow-blue-900/5 flex flex-col sm:flex-row items-center justify-center gap-1.5 text-xs font-extrabold transition-all active:scale-98 cursor-pointer"
            >
              <CloudSun className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Live Weather</span>
            </button>

            <button
              onClick={() => setIsNearbyModalOpen(true)}
              className="bg-white hover:bg-blue-50 text-blue-900 p-2.5 rounded-2xl border-2 border-blue-100 shadow-xl shadow-blue-900/5 flex flex-col sm:flex-row items-center justify-center gap-1.5 text-xs font-extrabold transition-all active:scale-98 cursor-pointer"
            >
              <NavIcon className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Live Nearby</span>
            </button>

            <button
              onClick={() => handleOpenSOS(false)}
              className="bg-rose-600 hover:bg-rose-700 text-white p-2.5 rounded-2xl border-2 border-rose-500 shadow-xl shadow-rose-600/20 flex flex-col sm:flex-row items-center justify-center gap-1.5 text-xs font-extrabold transition-all active:scale-98 cursor-pointer"
            >
              <ShieldAlert className="w-4 h-4 text-amber-300 fill-amber-300 shrink-0" />
              <span>🚨 SOS Safety</span>
            </button>
          </div>

          {activeNavTab === "home" && (
            <DestinationSearch
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedCategory={selectedActivityCategory}
              onSelectCategory={setSelectedActivityCategory}
              onStartTripForDestination={handleOpenPlanForDestination}
            />
          )}

          {activeNavTab === "explore" && (
            <DestinationSearch
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedCategory={selectedActivityCategory}
              onSelectCategory={setSelectedActivityCategory}
              onStartTripForDestination={handleOpenPlanForDestination}
            />
          )}

          {activeNavTab === "trips" && (
            <SavedTripsDashboard
              trips={trips}
              onOpenTrip={(t) => setSelectedTripDetail(t)}
              onDeleteTrip={handleDeleteTrip}
              onDuplicateTrip={handleDuplicateTrip}
              onOpenCreateTrip={() => {
                setCreateInitialDest("Goa");
                setCreateInitialSpecificPlace("");
                setIsCreateModalOpen(true);
              }}
            />
          )}

          {activeNavTab === "profile" && (
            <UserProfileView
              profile={userProfile}
              activeTrip={trips[0]}
              onSaveProfile={(updated) => {
                setUserProfile(updated);
                saveUserProfile(updated);
              }}
              onOpenSOSModal={handleOpenSOS}
              onNavigateToTrips={() => setActiveNavTab("trips")}
              onLogout={handleLogout}
            />
          )}
        </main>

        {/* Bottom Navigation */}
        <Navigation
          activeTab={activeNavTab}
          onTabChange={setActiveNavTab}
          savedTripsCount={trips.length}
        />

        {/* Modals */}
        <TripPlannerModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onTripGenerated={handleTripGenerated}
          initialDestination={createInitialDest}
          initialSpecificPlace={createInitialSpecificPlace}
        />

        <WeatherNotificationBanner
          destination={trips[0]?.destination || "Manali, Himachal Pradesh"}
          upcomingTrip={trips[0]}
          isOpen={isWeatherModalOpen}
          onClose={() => setIsWeatherModalOpen(false)}
        />

        <LiveNearbyModal
          destination={trips[0]?.destination || "Manali, Himachal Pradesh"}
          userLocation={userLocation}
          isOpen={isNearbyModalOpen}
          onClose={() => setIsNearbyModalOpen(false)}
        />

        <EmergencySOSModal
          isOpen={isSOSModalOpen}
          onClose={() => setIsSOSModalOpen(false)}
          activeTrip={trips[0]}
          userName={userProfile.name}
          isTestMode={isSOSTestMode}
        />

        <OnboardingPermissionsModal
          isOpen={isOnboardingOpen}
          onComplete={() => setIsOnboardingOpen(false)}
        />
      </div>
    </div>
  );
}

