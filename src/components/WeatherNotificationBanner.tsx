import React, { useState, useEffect } from "react";
import { CloudSun, Bell, X, ShieldCheck, Clock, Settings, Sparkles } from "lucide-react";
import { Language, WeatherInfo, Trip } from "../types";

interface WeatherNotificationBannerProps {
  destination: string;
  language?: Language;
  upcomingTrip?: Trip;
  isOpen: boolean;
  onClose: () => void;
}

export const WeatherNotificationBanner: React.FC<WeatherNotificationBannerProps> = ({
  destination,
  upcomingTrip,
  isOpen,
  onClose
}) => {
  const [weatherData, setWeatherData] = useState<WeatherInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [intervalHours, setIntervalHours] = useState(6);
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState<"weather" | "settings">("weather");

  useEffect(() => {
    // Don't fetch while the banner is closed.
    if (!isOpen) return;

    async function fetchWeather() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/weather?destination=${encodeURIComponent(destination || "Manali")}`);
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        const data = await res.json();
        setWeatherData(data);
      } catch (err) {
        console.error(err);
        setError("Couldn't load weather right now. Please try again.");
        setWeatherData(null);
      } finally {
        setLoading(false);
      }
    }
    fetchWeather();
  }, [isOpen, destination]);

  // Check if trip is within 24 hours
  const isTrip24HoursAway = upcomingTrip ? (() => {
    const tripStart = new Date(upcomingTrip.startDate).getTime();
    const now = new Date().getTime();
    const diffHours = (tripStart - now) / (1000 * 3600);
    return diffHours >= 0 && diffHours <= 24;
  })() : false;

  // All hooks are declared above this point — safe to bail out now
  // (Rules of Hooks: hooks must run in the same order on every render).
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
        {/* Banner Header */}
        <div className="bg-gradient-to-r from-sky-400 via-blue-500 to-sky-600 p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CloudSun className="w-5 h-5 text-amber-300" />
            <div>
              <h3 className="font-extrabold text-sm">
                Destination Weather & Alerts
              </h3>
              <p className="text-[11px] text-sky-100">{destination || "India"}</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab(activeTab === "weather" ? "settings" : "weather")}
              className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white cursor-pointer"
              title="Notification Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            <button onClick={onClose} className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {activeTab === "settings" ? (
          /* Notification Controls / Settings */
          <div className="p-5 space-y-4 text-xs">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-blue-600" />
              <span>Weather Notification Controls</span>
            </h4>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 block">
                    Weather Updates
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Non-spammy weather alerts
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={isNotificationsEnabled}
                  onChange={(e) => setIsNotificationsEnabled(e.target.checked)}
                  className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                />
              </div>

              <div className="border-t border-slate-200 pt-2">
                <label className="font-bold text-slate-800 block mb-1">
                  Recurring Update Interval
                </label>
                <select
                  value={intervalHours}
                  onChange={(e) => setIntervalHours(parseInt(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2 font-semibold text-slate-700"
                >
                  <option value={6}>Every 6 Hours (Recommended)</option>
                  <option value={12}>Every 12 Hours</option>
                  <option value={24}>Once Daily</option>
                </select>
              </div>

              <div className="bg-sky-50 text-sky-800 p-2.5 rounded-xl text-[11px] font-medium flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                <span>
                  Trip weather notifications start 24 hours prior to your travel start date.
                </span>
              </div>
            </div>

            <button
              onClick={() => setActiveTab("weather")}
              className="w-full bg-blue-600 text-white font-bold py-2.5 rounded-xl text-xs cursor-pointer"
            >
              Save Preferences
            </button>
          </div>
        ) : (
          /* Weather View */
          <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
            {isTrip24HoursAway && (
              <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-2xl flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <span className="font-extrabold block text-xs">
                    Trip Starts in 24 Hours!
                  </span>
                  <span className="text-[11px] text-amber-800">
                    Trip Weather forecast active for {destination}
                  </span>
                </div>
              </div>
            )}

            {loading ? (
              <div className="p-8 text-center text-slate-500 font-medium animate-pulse">
                Fetching live weather data...
              </div>
            ) : weatherData ? (
              <>
                {/* Current Weather Card */}
                <div className="bg-gradient-to-br from-sky-50 to-blue-50 p-4 rounded-2xl border border-sky-100 flex items-center justify-between">
                  <div>
                    <span className="text-3xl font-black text-slate-900">{weatherData.temp}°C</span>
                    <span className="block font-bold text-slate-700 text-xs mt-0.5">{weatherData.condition}</span>
                    <span className="text-[10px] text-slate-500 block mt-1">
                      Humidity: {weatherData.humidity}% | Wind: {weatherData.windSpeed} km/h
                    </span>
                  </div>

                  <div className="text-right">
                    <CloudSun className="w-12 h-12 text-amber-500 ml-auto" />
                  </div>
                </div>

                {weatherData.alertMessage && (
                  <div className="bg-blue-50 border border-blue-200 text-blue-900 p-3 rounded-xl font-medium">
                    💡 {weatherData.alertMessage}
                  </div>
                )}

                {/* 5-Day Forecast */}
                <div>
                  <h4 className="font-bold text-slate-900 mb-2">
                    5-Day Weather Forecast
                  </h4>
                  <div className="space-y-1.5">
                    {weatherData.forecast.map((f, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center justify-between font-medium text-slate-700"
                      >
                        <span className="w-20 font-bold text-slate-900">{f.date}</span>
                        <span>{f.condition}</span>
                        <div className="flex items-center gap-2">
                          {f.rainProb > 0 && <span className="text-[10px] text-sky-600 font-bold">🌧 {f.rainProb}%</span>}
                          <span className="font-bold text-slate-900">
                            {f.tempMax}° / {f.tempMin}°
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : error ? (
              <div className="p-8 text-center text-rose-600 font-medium">
                {error}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};

