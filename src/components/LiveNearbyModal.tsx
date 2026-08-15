import React, { useState, useEffect } from "react";
import { Compass, Utensils, Navigation, Star, MapPin, X, Loader2, Sparkles } from "lucide-react";
import { Language, LiveNearbyItem } from "../types";

interface LiveNearbyModalProps {
  destination: string;
  userLocation: string;
  language?: Language;
  isOpen: boolean;
  onClose: () => void;
}

export const LiveNearbyModal: React.FC<LiveNearbyModalProps> = ({
  destination,
  userLocation,
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<"all" | "activity" | "food">("all");
  const [items, setItems] = useState<LiveNearbyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Don't fetch while the modal is closed — avoids an unnecessary
    // network call every time `destination`/`activeTab` change in the
    // background before the user has even opened this modal.
    if (!isOpen) return;

    async function fetchNearby() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/nearby-live?destination=${encodeURIComponent(destination || "Manali")}&type=${activeTab}`
        );
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        const data = await res.json();
        setItems(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setError("Couldn't load nearby places right now. Please try again.");
        setItems([]);
      } finally {
        setLoading(false);
      }
    }
    fetchNearby();
  }, [isOpen, destination, activeTab]);

  // All hooks are declared above this point — safe to bail out now
  // (Rules of Hooks: hooks must run in the same order on every render).
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-md h-[82vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-400 via-blue-600 to-sky-600 p-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Navigation className="w-5 h-5 text-amber-300 animate-pulse" />
            <div>
              <h3 className="font-extrabold text-sm">
                Live Nearby Recommendations
              </h3>
              <p className="text-[10px] text-sky-100 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-sky-200" />
                <span>{userLocation || destination || "Manali, India"}</span>
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-1 rounded-full bg-white/20 hover:bg-white/30 text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Filters */}
        <div className="flex border-b border-slate-200 bg-slate-50 p-1.5 shrink-0">
          <button
            onClick={() => setActiveTab("all")}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === "all" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-200/60"
            }`}
          >
            All Spots
          </button>
          <button
            onClick={() => setActiveTab("activity")}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === "activity" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-200/60"
            }`}
          >
            Activities
          </button>
          <button
            onClick={() => setActiveTab("food")}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === "food" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-200/60"
            }`}
          >
            Food & Cafes
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50">
          {loading ? (
            <div className="py-12 text-center text-slate-500 font-medium flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span>Scanning live nearby spots...</span>
            </div>
          ) : error ? (
            <div className="py-12 text-center text-rose-600 font-medium px-4">
              {error}
            </div>
          ) : items.length === 0 ? (
            <div className="py-12 text-center text-slate-500 font-medium">
              No spots found nearby.
            </div>
          ) : (
            items.map((spot) => (
              <div
                key={spot.id}
                className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-xs flex gap-3 hover:shadow-md transition-all"
              >
                <img
                  src={spot.image}
                  alt={spot.name}
                  className="w-20 h-20 rounded-xl object-cover shrink-0"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <h4 className="font-extrabold text-xs text-slate-900 truncate">{spot.name}</h4>
                    <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md shrink-0">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      {spot.rating}
                    </span>
                  </div>

                  <p className="text-[11px] text-blue-600 font-semibold mt-0.5">{spot.subCategory}</p>
                  <p className="text-[10px] text-slate-500 line-clamp-2 mt-1">{spot.description}</p>

                  <div className="flex items-center justify-between mt-2 text-[10px] font-bold text-slate-700">
                    <span className="flex items-center gap-1 text-slate-500">
                      <Navigation className="w-3 h-3 text-blue-600" />
                      {spot.distanceKm} km away
                    </span>

                    <span className="text-emerald-700">
                      {spot.priceEstimate > 0 ? `Est. ₹${spot.priceEstimate}` : "Free"}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

