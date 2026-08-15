import React, { useState, useEffect } from "react";
import {
  X,
  Sparkles,
  MapPin,
  Calendar,
  Users,
  IndianRupee,
  Heart,
  Building2,
  Zap,
  CheckCircle2,
  ArrowRight,
  Clock,
  Compass,
  Utensils,
  Bed
} from "lucide-react";
import { Language, TravelerType, TravelStyle, Trip } from "../types";
import { startPrefetchTrip } from "../utils/prefetchManager";
import { streamTripItinerary } from "../utils/streamingParser";

interface TripPlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: Language;
  onTripGenerated: (newTrip: Trip) => void;
  initialDestination?: string;
  initialSpecificPlace?: string;
}

export const TripPlannerModal: React.FC<TripPlannerModalProps> = ({
  isOpen,
  onClose,
  onTripGenerated,
  initialDestination = "",
  initialSpecificPlace = ""
}) => {
  const [destination, setDestination] = useState(initialDestination || "Manali, Himachal Pradesh");
  const [specificPlace, setSpecificPlace] = useState(initialSpecificPlace || "");
  const [startDate, setStartDate] = useState("2026-09-10");
  const [endDate, setEndDate] = useState("2026-09-13");
  const [travelersCount, setTravelersCount] = useState(2);
  const [travelerType, setTravelerType] = useState<TravelerType>("couple");
  const [totalBudget, setTotalBudget] = useState(25000);
  const [travelStyle, setTravelStyle] = useState<TravelStyle>("comfort");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    "Hiking",
    "Local Food",
    "Sightseeing"
  ]);
  const [preferences, setPreferences] = useState("");

  const [isGenerating, setIsGenerating] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingTrip, setStreamingTrip] = useState<Partial<Trip> | null>(null);
  const [completedTrip, setCompletedTrip] = useState<Trip | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isPrefetchedReady, setIsPrefetchedReady] = useState(false);
  const [rawTextLength, setRawTextLength] = useState(0);

  const allInterests = [
    { id: "Hiking", label: "Hiking & Treks" },
    { id: "Heritage", label: "Forts & Heritage" },
    { id: "Food", label: "Local Food & Cafes" },
    { id: "Adventure", label: "Paragliding & Rafting" },
    { id: "Beaches", label: "Beaches & Water" },
    { id: "Wildlife", label: "Jungle Safari" },
    { id: "Spiritual", label: "Temples & Ghats" }
  ];

  // Background pre-fetch triggering
  useEffect(() => {
    // Don't fire background AI pre-fetch calls while the modal is closed
    // (component stays mounted, so this effect would otherwise keep
    // re-running in the background on every destination change even when
    // the user isn't looking at this screen — wasted Gemini API calls).
    if (!isOpen) return;
    if (destination && destination.trim().length >= 3) {
      const prefetchPromise = startPrefetchTrip({
        destination,
        specificPlace,
        startDate,
        endDate,
        travelersCount,
        travelerType,
        totalBudget,
        interests: selectedInterests,
        travelStyle,
        preferences
      });

      if (prefetchPromise) {
        prefetchPromise.then((trip) => {
          if (trip) {
            setIsPrefetchedReady(true);
          }
        });
      }
    }
  }, [isOpen, destination, specificPlace]);

  const handleInterestToggle = (id: string) => {
    if (selectedInterests.includes(id)) {
      setSelectedInterests(selectedInterests.filter(i => i !== id));
    } else {
      setSelectedInterests([...selectedInterests, id]);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (endDate <= startDate) {
      setErrorMessage("End date must be after the start date.");
      return;
    }

    setIsGenerating(true);
    setIsStreaming(true);
    setStreamingTrip(null);
    setCompletedTrip(null);
    setErrorMessage("");
    setRawTextLength(0);

    try {
      const finalTrip = await streamTripItinerary(
        {
          destination,
          specificPlace: specificPlace.trim() || undefined,
          startDate,
          endDate,
          travelersCount,
          travelerType,
          totalBudget,
          interests: selectedInterests,
          travelStyle,
          preferences
        },
        (partialTrip, rawText) => {
          setStreamingTrip(partialTrip);
          setRawTextLength(rawText.length);
        }
      );

      setCompletedTrip(finalTrip);
      setIsStreaming(false);
    } catch (err: any) {
      console.error("[TripPlannerModal] Streaming error:", err);
      setErrorMessage(err.message || "An error occurred while streaming itinerary.");
      setIsGenerating(false);
      setIsStreaming(false);
    }
  };

  const handleOpenTrip = () => {
    if (completedTrip) {
      onTripGenerated(completedTrip);
      onClose();
    }
  };

  // All hooks are declared above this point — safe to bail out now
  // (Rules of Hooks: hooks must run in the same order on every render).
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden border border-slate-100 my-auto flex flex-col max-h-[90vh]">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-sky-900 p-5 text-white relative shrink-0">
          <button
            onClick={onClose}
            disabled={isStreaming}
            className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-all cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-amber-300 fill-amber-300 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-widest text-sky-200">
              GoLumo AI Travel Planner
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">
            {isGenerating ? "Incremental AI Trip Stream" : "Plan Your Trip to India"}
          </h2>
          <p className="text-xs text-sky-200 mt-1">
            {isGenerating
              ? "Watch your customized day-by-day itinerary render in real time"
              : "Personalized day-by-day itineraries with exact budget calculations in ₹"}
          </p>

          {isPrefetchedReady && !isGenerating && (
            <div className="mt-3 inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-3 py-1 rounded-full text-[11px] font-bold">
              <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
              <span>Itinerary summary pre-loaded in background!</span>
            </div>
          )}
        </div>

        {/* Modal Body */}
        {isGenerating ? (
          <div className="p-5 flex-1 overflow-y-auto space-y-4 bg-slate-50/50">
            {/* Stream Status Bar */}
            <div className="bg-white p-4 rounded-2xl border border-sky-100 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${isStreaming ? "bg-amber-500/10 text-amber-600 animate-pulse" : "bg-emerald-500/10 text-emerald-600"}`}>
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900">
                    {isStreaming ? "Streaming AI Content in Real Time..." : "Itinerary Stream Complete!"}
                  </h4>
                  <p className="text-[11px] font-medium text-slate-500">
                    {isStreaming
                      ? `Received ${rawTextLength} characters of structured travel data`
                      : "All days, activities, and budget estimates successfully generated"}
                  </p>
                </div>
              </div>

              {completedTrip && (
                <button
                  onClick={handleOpenTrip}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold px-4 py-2 rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <span>Open Full Trip</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Streaming Preview Object */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              {/* Trip Title & Metadata */}
              <div className="border-b border-slate-100 pb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
                  Destination Highlights
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-1">
                  {streamingTrip?.title || `Exploring ${destination}`}
                </h3>
                <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-600 mt-2">
                  <div className="flex items-center gap-1 text-emerald-700 font-extrabold bg-emerald-50 px-2 py-0.5 rounded-lg">
                    <IndianRupee className="w-3.5 h-3.5" />
                    <span>Est. ₹{(streamingTrip?.estimatedCost || Math.round(totalBudget * 0.85)).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    <span>{startDate} to {endDate}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-blue-600" />
                    <span>{travelersCount} ({travelerType})</span>
                  </div>
                </div>
              </div>

              {/* Streaming Itinerary Days */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-blue-600" />
                  <span>Incremental Day-by-Day Schedule</span>
                </h4>

                {Array.isArray(streamingTrip?.itinerary) && streamingTrip!.itinerary!.length > 0 ? (
                  streamingTrip!.itinerary!.map((day, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2 animate-fade-in"
                    >
                      <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="bg-blue-600 text-white text-[11px] font-black px-2 py-0.5 rounded-md">
                            Day {day.dayNumber || idx + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-800">
                            {day.theme || "Exploring Local Wonders"}
                          </span>
                        </div>
                        {day.dayTotalCost ? (
                          <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-md">
                            ₹{day.dayTotalCost.toLocaleString("en-IN")}
                          </span>
                        ) : null}
                      </div>

                      {/* Activities */}
                      <div className="space-y-1.5 pt-1">
                        {/* Morning */}
                        {Array.isArray(day.morning) && day.morning.map((act, aIdx) => (
                          <div key={aIdx} className="bg-white p-2 rounded-lg border border-slate-100 text-xs flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded">
                                  {act.time || "Morning"}
                                </span>
                                <span className="font-bold text-slate-900">{act.title}</span>
                              </div>
                              <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2">{act.description}</p>
                            </div>
                            {act.costEstimate ? (
                              <span className="text-[10px] font-bold text-slate-500 shrink-0">₹{act.costEstimate}</span>
                            ) : null}
                          </div>
                        ))}

                        {/* Afternoon */}
                        {Array.isArray(day.afternoon) && day.afternoon.map((act, aIdx) => (
                          <div key={aIdx} className="bg-white p-2 rounded-lg border border-slate-100 text-xs flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-1.5 py-0.2 rounded">
                                  {act.time || "Afternoon"}
                                </span>
                                <span className="font-bold text-slate-900">{act.title}</span>
                              </div>
                              <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2">{act.description}</p>
                            </div>
                            {act.costEstimate ? (
                              <span className="text-[10px] font-bold text-slate-500 shrink-0">₹{act.costEstimate}</span>
                            ) : null}
                          </div>
                        ))}

                        {/* Evening */}
                        {Array.isArray(day.evening) && day.evening.map((act, aIdx) => (
                          <div key={aIdx} className="bg-white p-2 rounded-lg border border-slate-100 text-xs flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded">
                                  {act.time || "Evening"}
                                </span>
                                <span className="font-bold text-slate-900">{act.title}</span>
                              </div>
                              <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2">{act.description}</p>
                            </div>
                            {act.costEstimate ? (
                              <span className="text-[10px] font-bold text-slate-500 shrink-0">₹{act.costEstimate}</span>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <Clock className="w-6 h-6 text-blue-500 animate-spin mx-auto mb-2" />
                    <p className="text-xs text-slate-500 font-medium">Parsing itinerary day slots from live AI response...</p>
                  </div>
                )}
              </div>

              {/* Recommended Stays & Food */}
              {Array.isArray(streamingTrip?.recommendedStays) && streamingTrip!.recommendedStays!.length > 0 && (
                <div className="border-t border-slate-100 pt-3">
                  <h5 className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                    <Bed className="w-3.5 h-3.5 text-blue-600" />
                    <span>Recommended Stays</span>
                  </h5>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {streamingTrip!.recommendedStays!.map((stay, idx) => (
                      <div key={idx} className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                        <div className="font-bold text-slate-900 truncate">{stay.name}</div>
                        <div className="text-[10px] text-slate-500">₹{stay.pricePerNight}/night • {stay.location}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {Array.isArray(streamingTrip?.recommendedFood) && streamingTrip!.recommendedFood!.length > 0 && (
                <div className="border-t border-slate-100 pt-3">
                  <h5 className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                    <Utensils className="w-3.5 h-3.5 text-amber-600" />
                    <span>Must-Try Local Delicacies</span>
                  </h5>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {streamingTrip!.recommendedFood!.map((food, idx) => (
                      <div key={idx} className="bg-amber-50/50 p-2 rounded-lg border border-amber-200/60">
                        <div className="font-bold text-amber-950 truncate">{food.name}</div>
                        <div className="text-[10px] text-amber-800">{food.mustTry || food.cuisine}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions when Done */}
            {completedTrip && (
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-900">
                    Your trip has been created and auto-saved!
                  </span>
                </div>
                <button
                  onClick={handleOpenTrip}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Accept & View Trip</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Form Content */
          <form onSubmit={handleGenerate} className="p-5 space-y-4 overflow-y-auto">
            {errorMessage && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl font-medium">
                {errorMessage}
              </div>
            )}

            {/* 1. Destination */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                <span>Destination in India</span>
              </label>
              <input
                type="text"
                required
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="e.g. Manali, Goa, Leh Ladakh, Jaipur, Kerala"
                className="w-full text-sm font-medium border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 2. Specific Place Based Planning */}
            <div className="bg-sky-50/80 p-3 rounded-2xl border border-sky-100">
              <label className="block text-xs font-bold text-sky-900 mb-1 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-sky-600" />
                <span>Specific Place to Visit (Optional Priority)</span>
              </label>
              <input
                type="text"
                value={specificPlace}
                onChange={(e) => setSpecificPlace(e.target.value)}
                placeholder='e.g. "Rohtang Pass", "Taj Mahal", "Fort Aguada"'
                className="w-full text-xs font-medium bg-white border border-sky-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <p className="text-[10px] text-sky-700 mt-1">
                GoLumo will anchor your itinerary around this specific place.
              </p>
            </div>

            {/* 3. Dates & Duration */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  <span>Start Date</span>
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    // If the current end date is now before (or equal to)
                    // the new start date, push it out by a day so the
                    // range stays valid automatically.
                    if (e.target.value && endDate <= e.target.value) {
                      const next = new Date(e.target.value);
                      next.setDate(next.getDate() + 1);
                      setEndDate(next.toISOString().slice(0, 10));
                    }
                  }}
                  className="w-full text-xs font-semibold border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  <span>End Date</span>
                </label>
                <input
                  type="date"
                  required
                  min={startDate}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full text-xs font-semibold border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* 4. Travelers & Type */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-blue-600" />
                  <span>Travelers Count</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={travelersCount}
                  onChange={(e) => setTravelersCount(parseInt(e.target.value) || 1)}
                  className="w-full text-xs font-semibold border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Traveler Group
                </label>
                <select
                  value={travelerType}
                  onChange={(e) => setTravelerType(e.target.value as TravelerType)}
                  className="w-full text-xs font-semibold border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="solo">Solo</option>
                  <option value="couple">Couple</option>
                  <option value="family">Family</option>
                  <option value="friends">Friends</option>
                </select>
              </div>
            </div>

            {/* 5. Budget Slider */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                  <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Total Budget (₹ INR)</span>
                </label>
                <span className="text-sm font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                  ₹{totalBudget.toLocaleString("en-IN")}
                </span>
              </div>
              <input
                type="range"
                min="5000"
                max="200000"
                step="2500"
                value={totalBudget}
                onChange={(e) => setTotalBudget(parseInt(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>

            {/* 6. Travel Style */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Travel Style
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {(["budget", "comfort", "luxury", "adventure"] as TravelStyle[]).map((style) => (
                  <button
                    type="button"
                    key={style}
                    onClick={() => setTravelStyle(style)}
                    className={`py-1.5 px-2 rounded-xl text-xs font-bold uppercase transition-all ${
                      travelStyle === style
                        ? "bg-blue-600 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            {/* 7. Interests Pills */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                <span>Interests & Activities</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {allInterests.map((int) => {
                  const isSel = selectedInterests.includes(int.id);
                  return (
                    <button
                      type="button"
                      key={int.id}
                      onClick={() => handleInterestToggle(int.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                        isSel
                          ? "bg-blue-50 text-blue-700 border-blue-300 font-bold"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {int.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-extrabold text-sm py-3.5 rounded-2xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Zap className="w-5 h-5 text-amber-300 fill-amber-300" />
                <span>Stream & Auto-Save AI Trip</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
