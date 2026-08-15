import React from "react";
import { Home, Compass, User, Luggage } from "lucide-react";
import { Language } from "../types";

export type NavTab = "home" | "explore" | "trips" | "profile";

interface NavigationProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  language?: Language;
  savedTripsCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  savedTripsCount
}) => {
  const tabs = [
    {
      id: "home" as NavTab,
      label: "Home",
      icon: Home
    },
    {
      id: "explore" as NavTab,
      label: "Explore",
      icon: Compass
    },
    {
      id: "trips" as NavTab,
      label: "Saved Trips",
      icon: Luggage,
      badge: savedTripsCount
    },
    {
      id: "profile" as NavTab,
      label: "Profile",
      icon: User
    }
  ];

  return (
    <div className="fixed bottom-4 left-0 right-0 z-40 max-w-md mx-auto px-4 pointer-events-none">
      <nav className="bg-white border border-blue-100 rounded-2xl p-1.5 shadow-xl shadow-blue-900/10 flex items-center justify-around pointer-events-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex flex-col sm:flex-row items-center justify-center gap-1 px-3.5 py-2 rounded-xl transition-all duration-200 cursor-pointer ${
                isActive
                  ? "bg-blue-600 text-white shadow-md shadow-blue-200 font-extrabold"
                  : "text-slate-400 hover:text-blue-900 font-bold hover:bg-blue-50"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
              
              <span className="text-[11px] uppercase tracking-wider font-extrabold">
                {tab.label}
              </span>

              {tab.badge !== undefined && tab.badge > 0 && (
                <span
                  className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-full ${
                    isActive
                      ? "bg-white text-blue-600"
                      : "bg-blue-600 text-white"
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

