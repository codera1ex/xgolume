import React, { useState, useEffect } from "react";
import { Search, Sparkles, MapPin, Star, Calendar, IndianRupee, Compass, ChevronRight } from "lucide-react";
import { DestinationCardData, Language } from "../types";
import { ActivityFilter } from "./ActivityFilter";
import { startPrefetchTrip } from "../utils/prefetchManager";

interface DestinationSearchProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  language?: Language;
  onStartTripForDestination: (destName: string) => void;
}

export const DestinationSearch: React.FC<DestinationSearchProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
  onStartTripForDestination
}) => {
  const [destinations, setDestinations] = useState<DestinationCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Debounce: wait for the user to pause typing before hitting the API,
    // instead of firing a request on every single keystroke.
    const debounceTimer = setTimeout(() => {
      async function fetchDestinations() {
        setLoading(true);
        setError(null);
        try {
          const res = await fetch(
            `/api/destinations?q=${encodeURIComponent(searchQuery)}&category=${selectedCategory}`
          );
          if (!res.ok) throw new Error(`Request failed (${res.status})`);
          const data = await res.json();
          setDestinations(Array.isArray(data) ? data : []);
        } catch (err) {
          console.error(err);
          setError("Couldn't load destinations right now. Please try again.");
          setDestinations([]);
        } finally {
          setLoading(false);
        }
      }
      fetchDestinations();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, selectedCategory]);

  const handleDestinationClick = (destName: string) => {
    startPrefetchTrip({ destination: destName });
    onStartTripForDestination(destName);
  };

  const handleDestinationHover = (destName: string) => {
    startPrefetchTrip({ destination: destName });
  };

  return (
    <div className="space-y-4">
      {/* Activity Filter Row */}
      <ActivityFilter
        selectedCategory={selectedCategory}
        onSelectCategory={onSelectCategory}
      />

      {/* Destinations List Header */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-extrabold text-slate-900 tracking-tight">
          Recommended Destinations
        </h2>
        <span className="text-xs text-slate-500 font-semibold">{destinations.length} Places</span>
      </div>

      {/* Cards Grid */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-3xl p-3 shadow-xs border border-slate-200 animate-pulse flex gap-3 h-32" />
          ))}
        </div>
      ) : error ? (
        <div className="p-8 text-center bg-white rounded-3xl border border-rose-200">
          <p className="text-xs text-rose-600 font-medium">{error}</p>
        </div>
      ) : destinations.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-3xl border border-slate-200">
          <p className="text-xs text-slate-500 font-medium">
            No destinations matched your filter. Try searching another Indian spot!
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {destinations.map((dest) => (
            <div
              key={dest.id}
              onMouseEnter={() => handleDestinationHover(dest.name)}
              className="bg-white rounded-3xl p-3.5 border-2 border-blue-100/80 shadow-xl shadow-blue-900/5 hover:border-blue-300 transition-all flex gap-3.5 group"
            >
              {/* Image */}
              <div className="relative w-28 h-32 rounded-2xl overflow-hidden shrink-0">
                <img
                  src={dest.image}
                  alt={dest.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2 left-2 bg-blue-900/80 backdrop-blur-md text-amber-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                  <Star className="w-3 h-3 fill-amber-300 text-amber-300" />
                  {dest.rating}
                </div>
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                <div>
                  <div className="flex items-center gap-1 text-[11px] font-extrabold text-blue-600 uppercase tracking-wide">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{dest.state}</span>
                  </div>

                  <h3 className="font-extrabold text-base text-blue-900 truncate mt-0.5">{dest.name}</h3>
                  <p className="text-xs text-slate-500 font-medium line-clamp-2 mt-0.5 leading-snug">{dest.tagline}</p>
                </div>

                {/* Footer Info & Action */}
                <div className="flex items-center justify-between pt-2 border-t border-blue-50">
                  <div className="text-xs font-extrabold text-blue-900">
                    <span>Est. ₹{dest.avgDailyBudget}/day</span>
                  </div>

                  <button
                    onClick={() => handleDestinationClick(dest.name)}
                    className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-extrabold text-xs px-3.5 py-1.5 rounded-xl flex items-center gap-1 transition-all shadow-md shadow-blue-200 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-amber-300 fill-amber-300" />
                    <span>Plan Trip</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

