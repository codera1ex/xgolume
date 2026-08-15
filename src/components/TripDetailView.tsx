import React, { useState } from "react";
import {
  ArrowLeft,
  Calendar,
  Users,
  IndianRupee,
  MapPin,
  Sparkles,
  Share2,
  Trash2,
  Copy,
  Clock,
  Compass,
  Utensils,
  Hotel,
  Bot,
  CloudSun,
  Navigation,
  Check,
  Edit2
} from "lucide-react";
import { Language, Trip, ItineraryActivity } from "../types";
import { MapView } from "./MapView";
import { ModifyItineraryBar } from "./ModifyItineraryBar";
import { ShareItineraryModal } from "./ShareItineraryModal";
import { AITravelAssistant } from "./AITravelAssistant";
import { BudgetDonutChart } from "./BudgetDonutChart";

interface TripDetailViewProps {
  trip: Trip;
  language?: Language;
  onBack: () => void;
  onUpdateTrip: (updated: Trip) => void;
  onDeleteTrip: (id: string) => void;
  onDuplicateTrip: (id: string) => void;
  userLocation: string;
}

export const TripDetailView: React.FC<TripDetailViewProps> = ({
  trip,
  onBack,
  onUpdateTrip,
  onDeleteTrip,
  onDuplicateTrip,
  userLocation
}) => {
  const [activeTab, setActiveTab] = useState<"itinerary" | "map" | "stays_food">("itinerary");
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  // Extract all markers for the map
  const mapMarkers = trip.itinerary.flatMap((day) =>
    [...day.morning, ...day.afternoon, ...day.evening].map((act) => ({
      id: act.id,
      title: act.title,
      category: act.category,
      coordinates: act.coordinates || { lat: 32.2432, lng: 77.1892 },
      description: act.description,
      priceEstimate: act.costEstimate,
      timeSlot: act.time
    }))
  );

  return (
    <div className="min-h-screen bg-slate-100 pb-28">
      {/* Top Banner & Hero Image */}
      <div className="relative h-64 w-full bg-slate-900 overflow-hidden">
        <img
          src={trip.coverImage || "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800&q=80"}
          alt={trip.destination}
          className="w-full h-full object-cover opacity-75"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

        {/* Top Controls */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-white z-20">
          <button
            onClick={onBack}
            className="p-2 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md transition-all cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsShareOpen(true)}
              className="p-2 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md transition-all text-white cursor-pointer"
              title="Share Itinerary"
            >
              <Share2 className="w-5 h-5" />
            </button>

            <button
              onClick={() => onDuplicateTrip(trip.id)}
              className="p-2 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md transition-all text-sky-300 cursor-pointer"
              title="Duplicate Trip"
            >
              <Copy className="w-5 h-5" />
            </button>

            <button
              onClick={() => {
                if (confirm("Delete this trip?")) {
                  onDeleteTrip(trip.id);
                  onBack();
                }
              }}
              className="p-2 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md transition-all text-rose-400 cursor-pointer"
              title="Delete Trip"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Hero Overlay Info */}
        <div className="absolute bottom-4 left-4 right-4 text-white z-20">
          <div className="flex items-center gap-2 text-xs font-semibold text-sky-300 mb-1">
            <MapPin className="w-3.5 h-3.5" />
            <span>{trip.destination}</span>
            {trip.specificPlace && (
              <span className="bg-sky-500/30 backdrop-blur-xs text-sky-200 px-2 py-0.5 rounded-full text-[10px]">
                🎯 {trip.specificPlace}
              </span>
            )}
          </div>

          <h1 className="text-xl font-black tracking-tight leading-snug">{trip.title}</h1>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 font-medium mt-2">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-sky-400" />
              {trip.startDate} to {trip.endDate} ({trip.durationDays} Days)
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-sky-400" />
              {trip.travelersCount} ({trip.travelerType})
            </span>
            <span className="flex items-center gap-1 font-bold text-emerald-400">
              <IndianRupee className="w-3.5 h-3.5" />
              Est. ₹{trip.estimatedCost.toLocaleString("en-IN")} / ₹{trip.totalBudget.toLocaleString("en-IN")}
            </span>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-md mx-auto px-4 pt-4">
        {/* Navigation Tabs */}
        <div className="flex bg-white rounded-2xl p-1 shadow-xs border border-slate-200 mb-4">
          <button
            onClick={() => setActiveTab("itinerary")}
            className={`flex-1 py-2.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
              activeTab === "itinerary" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Itinerary
          </button>
          <button
            onClick={() => setActiveTab("map")}
            className={`flex-1 py-2.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
              activeTab === "map" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Interactive Map
          </button>
          <button
            onClick={() => setActiveTab("stays_food")}
            className={`flex-1 py-2.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
              activeTab === "stays_food" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Stays & Food
          </button>
        </div>

        {/* Natural Language AI Modifier Bar */}
        <ModifyItineraryBar
          trip={trip}
          onTripUpdated={onUpdateTrip}
        />

        {/* Tab 1: Day-by-Day Itinerary */}
        {activeTab === "itinerary" && (
          <div className="space-y-4">
            {/* Recharts Budget Breakdown Donut Chart */}
            <BudgetDonutChart trip={trip} />

            {trip.itinerary.map((day) => (
              <div key={day.dayNumber} className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80">
                {/* Day Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
                  <div>
                    <span className="text-xs font-black text-blue-600 uppercase tracking-wider block">
                      Day {day.dayNumber} • {day.date}
                    </span>
                    <h3 className="font-bold text-sm text-slate-900 mt-0.5">{day.theme}</h3>
                  </div>

                  <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                    ₹{day.dayTotalCost}
                  </span>
                </div>

                {day.travelAdvice && (
                  <p className="text-[11px] text-slate-600 bg-sky-50 p-2.5 rounded-xl border border-sky-100 mb-3 font-medium">
                    💡 {day.travelAdvice}
                  </p>
                )}

                {/* Slots: Morning, Afternoon, Evening */}
                <div className="space-y-3">
                  {/* Morning */}
                  {day.morning.length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 block mb-1.5">
                        🌅 Morning
                      </span>
                      {day.morning.map((act) => (
                        <ActivityCard key={act.id} activity={act} />
                      ))}
                    </div>
                  )}

                  {/* Afternoon */}
                  {day.afternoon.length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 block mb-1.5">
                        ☀️ Afternoon
                      </span>
                      {day.afternoon.map((act) => (
                        <ActivityCard key={act.id} activity={act} />
                      ))}
                    </div>
                  )}

                  {/* Evening */}
                  {day.evening.length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 block mb-1.5">
                        🌆 Evening
                      </span>
                      {day.evening.map((act) => (
                        <ActivityCard key={act.id} activity={act} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 2: Map View */}
        {activeTab === "map" && (
          <div className="space-y-3">
            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="font-extrabold text-xs text-slate-900 mb-1">
                Trip Routes & Locations
              </h3>
              <p className="text-[11px] text-slate-500 mb-3">
                Interactive map showing attractions, food spots, and stays.
              </p>
              <MapView markers={mapMarkers} height="h-96" />
            </div>
          </div>
        )}

        {/* Tab 3: Recommended Stays & Food */}
        {activeTab === "stays_food" && (
          <div className="space-y-4">
            {/* Stays */}
            <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5 mb-3">
                <Hotel className="w-4 h-4 text-emerald-600" />
                <span>Recommended Accommodations</span>
              </h3>

              <div className="space-y-2.5">
                {trip.recommendedStays.map((stay, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between"
                  >
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">{stay.name}</h4>
                      <p className="text-[11px] text-slate-500">{stay.type} • {stay.location}</p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-black text-emerald-700 block">₹{stay.pricePerNight}/night</span>
                      <span className="text-[10px] font-bold text-amber-600">★ {stay.rating}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Food */}
            <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5 mb-3">
                <Utensils className="w-4 h-4 text-amber-600" />
                <span>Must-Try Local Food & Cafes</span>
              </h3>

              <div className="space-y-2.5">
                {trip.recommendedFood.map((food, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between"
                  >
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">{food.name}</h4>
                      <p className="text-[11px] text-blue-600 font-semibold">{food.cuisine}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Must try: {food.mustTry}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[11px] font-bold text-slate-700 block">{food.priceRange}</span>
                      {food.isVeg && (
                        <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-md">
                          100% Veg
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating AI Travel Assistant Trigger Button */}
      <button
        onClick={() => setIsAssistantOpen(true)}
        className="fixed bottom-20 right-5 z-40 bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-700 hover:to-sky-600 text-white font-bold p-3.5 rounded-full shadow-xl shadow-blue-500/30 flex items-center gap-2 transition-all active:scale-95 border-2 border-white cursor-pointer"
      >
        <Bot className="w-5 h-5 text-amber-300 animate-bounce" />
        <span className="text-xs">AI Assistant</span>
      </button>

      {/* Modals */}
      <ShareItineraryModal
        trip={trip}
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
      />

      <AITravelAssistant
        trip={trip}
        userLocation={userLocation}
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
      />
    </div>
  );
};

// Sub-component for individual Activity Card
interface ActivityCardProps {
  activity: ItineraryActivity;
  language?: Language;
}

const ActivityCard: React.FC<ActivityCardProps> = ({
  activity
}) => {
  return (
    <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/60 mb-2 hover:bg-slate-50 transition-all">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="text-[11px] font-bold text-slate-500">{activity.time}</span>
            {activity.isHighlight && (
              <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.2 rounded-md">
                ★ Highlight
              </span>
            )}
          </div>

          <h4 className="font-extrabold text-xs text-slate-900 mt-1">{activity.title}</h4>
          <p className="text-[11px] text-slate-600 mt-0.5 leading-normal">{activity.description}</p>
        </div>

        <span className="text-xs font-bold text-emerald-700 shrink-0">
          {activity.costEstimate > 0 ? `₹${activity.costEstimate}` : "Free"}
        </span>
      </div>

      {activity.tips && (
        <div className="mt-1.5 text-[10px] text-slate-500 italic bg-white p-1.5 rounded-lg border border-slate-100">
          💡 {activity.tips}
        </div>
      )}
    </div>
  );
};

