import React, { useState } from "react";
import { Luggage, Calendar, Users, IndianRupee, MapPin, Sparkles, ChevronRight, Copy, Trash2, Plus } from "lucide-react";
import { Language, Trip } from "../types";

interface SavedTripsDashboardProps {
  trips: Trip[];
  language?: Language;
  onOpenTrip: (trip: Trip) => void;
  onDeleteTrip: (id: string) => void;
  onDuplicateTrip: (id: string) => void;
  onOpenCreateTrip: () => void;
}

export const SavedTripsDashboard: React.FC<SavedTripsDashboardProps> = ({
  trips,
  onOpenTrip,
  onDeleteTrip,
  onDuplicateTrip,
  onOpenCreateTrip
}) => {
  const [filterStatus, setFilterStatus] = useState<"all" | "upcoming" | "active" | "completed">("all");

  const filteredTrips = filterStatus === "all" ? trips : trips.filter((t) => t.status === filterStatus);

  return (
    <div className="max-w-md mx-auto p-4 pb-28 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Luggage className="w-6 h-6 text-blue-600" />
            <span>My Saved Trips</span>
          </h2>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            Manage and continue your AI planned itineraries
          </p>
        </div>

        <button
          onClick={onOpenCreateTrip}
          className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-2xl shadow-md flex items-center gap-1 text-xs font-bold transition-all active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Trip</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex bg-white rounded-2xl p-1.5 shadow-xl shadow-blue-900/5 border-2 border-blue-100">
        {(["all", "upcoming", "active", "completed"] as const).map((st) => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            className={`flex-1 py-2 text-[11px] font-extrabold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
              filterStatus === st ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "text-slate-400 hover:text-blue-900 hover:bg-blue-50"
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Trips List */}
      {filteredTrips.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-3xl border-2 border-blue-100 shadow-xl shadow-blue-900/5 space-y-3">
          <p className="text-xs text-slate-500 font-bold">
            No trips found in this view.
          </p>
          <button
            onClick={onOpenCreateTrip}
            className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs py-2.5 px-4 rounded-xl shadow-md shadow-blue-200 inline-flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
            <span>Plan an AI Trip Now</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTrips.map((trip) => (
            <div
              key={trip.id}
              className="bg-white rounded-3xl overflow-hidden border-2 border-blue-100 shadow-xl shadow-blue-900/5 hover:border-blue-300 transition-all group"
            >
              {/* Cover Banner */}
              <div className="relative h-36 w-full bg-blue-950 cursor-pointer" onClick={() => onOpenTrip(trip)}>
                <img
                  src={trip.coverImage || "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800&q=80"}
                  alt={trip.destination}
                  className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-blue-950/90 via-blue-950/20 to-transparent" />

                <div className="absolute top-3 right-3 flex items-center gap-1 z-10">
                  <span className="bg-blue-600 text-white text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full shadow-md">
                    {trip.status}
                  </span>
                </div>

                <div className="absolute bottom-3 left-4 right-4 text-white">
                  <span className="text-xs font-bold text-sky-300 block flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-sky-300" />
                    {trip.destination}
                  </span>
                  <h3 className="font-extrabold text-base tracking-tight truncate text-white">{trip.title}</h3>
                </div>
              </div>

              {/* Trip Info Footer */}
              <div className="p-4 space-y-3 text-xs text-blue-900">
                <div className="flex items-center justify-between font-extrabold">
                  <span className="flex items-center gap-1 text-slate-500">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    {trip.startDate} - {trip.endDate}
                  </span>

                  <span className="flex items-center gap-1 font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                    <IndianRupee className="w-3.5 h-3.5" />
                    ₹{trip.estimatedCost.toLocaleString("en-IN")}
                  </span>
                </div>

                {/* Actions Bar */}
                <div className="flex items-center justify-between pt-2.5 border-t border-blue-50">
                  <div className="flex items-center gap-1 text-slate-400">
                    <button
                      onClick={() => onDuplicateTrip(trip.id)}
                      className="p-2 hover:bg-blue-50 rounded-xl text-blue-700 transition-all cursor-pointer"
                      title="Duplicate"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteTrip(trip.id)}
                      className="p-2 hover:bg-rose-50 rounded-xl text-rose-500 transition-all cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    onClick={() => onOpenTrip(trip)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl flex items-center gap-1 transition-all shadow-md shadow-blue-200 cursor-pointer"
                  >
                    <span>Open Trip</span>
                    <ChevronRight className="w-3.5 h-3.5" />
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

