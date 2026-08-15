import React, { useState, useEffect } from "react";
import { Search, Bell, MapPin, Sparkles } from "lucide-react";
import { startPrefetchTrip } from "../utils/prefetchManager";

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  userLocation: string;
  unreadNotificationsCount: number;
  onOpenNotifications: () => void;
  onOpenCreateTrip: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  userLocation,
  unreadNotificationsCount,
  onOpenNotifications,
  onOpenCreateTrip
}) => {
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSearchChange = (val: string) => {
    onSearchChange(val);
    if (val.trim().length >= 3) {
      startPrefetchTrip({ destination: val });
    }
  };

  return (
    <header className="bg-white border-b border-blue-100 shadow-sm pt-4 pb-6 px-6 rounded-b-3xl relative overflow-hidden">
      {/* Top Utility Nav Bar */}
      <div className="flex items-center justify-between mb-4">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-200 shrink-0">
            <div className="w-4 h-4 border-2 border-white rounded-full flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-white rounded-full" />
            </div>
          </div>
          <div>
            <span className="text-xl font-black tracking-tight text-blue-900 leading-none block">
              GoLumo
            </span>
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">
              India Travel
            </span>
          </div>
        </div>

        {/* Right Nav Utilities */}
        <div className="flex items-center gap-2">
          {/* Location Chip */}
          <div className="flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-200 text-xs font-bold text-blue-900">
            <MapPin className="w-3.5 h-3.5 text-blue-600" />
            <span className="truncate max-w-[110px]">{userLocation || "New Delhi"}</span>
          </div>

          {/* Notifications Bell */}
          <button
            onClick={onOpenNotifications}
            className="relative bg-blue-50 hover:bg-blue-100 p-2 rounded-full border border-blue-200 text-blue-900 transition-all cursor-pointer"
          >
            <Bell className="w-4 h-4 text-blue-700" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                {unreadNotificationsCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Hero Title Greeting */}
      <div className="mb-4">
        <h1 className="text-3xl font-extrabold text-blue-900 tracking-tight leading-tight">
          Where to next?
        </h1>
        <p className="text-xs font-bold uppercase tracking-wider text-blue-600 mt-0.5">
          AI Travel Planner for India
        </p>
      </div>

      {/* Search & AI Button */}
      <div className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-blue-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Leh, Goa, Manali, Jaipur..."
            className="w-full bg-blue-50/80 text-blue-900 placeholder-blue-300 text-sm font-bold pl-10 pr-4 py-3 rounded-2xl border-2 border-blue-100 focus:border-blue-500 focus:bg-white outline-none transition-all shadow-xs"
          />
        </div>

        {/* AI Action Button */}
        <button
          onClick={onOpenCreateTrip}
          className="bg-blue-900 hover:bg-blue-800 text-white font-extrabold px-4 py-3 rounded-2xl shadow-lg shadow-blue-900/10 flex items-center gap-1.5 transition-all text-xs shrink-0 active:scale-95 cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" />
          <span>PLAN WITH AI</span>
        </button>
      </div>
    </header>
  );
};

