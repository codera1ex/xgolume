import React from "react";
import {
  Footprints,
  Mountain,
  Sun,
  Sparkles,
  Waves,
  Trees,
  Castle,
  Tent,
  Compass,
  Bike
} from "lucide-react";
import { CATEGORY_FILTERS } from "../data/mockData";

interface ActivityFilterProps {
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
}

const ICON_MAP: Record<string, React.ElementType> = {
  Compass,
  Footprints,
  Mountain,
  Sun,
  Sparkles,
  Waves,
  Trees,
  Castle,
  Tent,
  Bike
};

export const ActivityFilter: React.FC<ActivityFilterProps> = ({
  selectedCategory,
  onSelectCategory
}) => {
  return (
    <section className="my-4">
      <div className="flex items-center justify-between px-1 mb-2.5">
        <h2 className="text-sm font-bold text-slate-900 tracking-tight">
          Browse by activity
        </h2>
        {selectedCategory !== "all" && (
          <button
            onClick={() => onSelectCategory("all")}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
          >
            Clear Filter
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 pt-1 px-1">
        {CATEGORY_FILTERS.map((cat) => {
          const Icon = ICON_MAP[cat.icon] || Compass;
          const isSelected = selectedCategory === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl shrink-0 transition-all cursor-pointer text-xs font-bold ${
                isSelected
                  ? "bg-blue-600 text-white shadow-md shadow-blue-200 scale-102"
                  : "bg-white text-blue-900 border-2 border-blue-100 hover:bg-blue-50 shadow-xs"
              }`}
            >
              <Icon className={`w-4 h-4 ${isSelected ? "text-white" : "text-blue-600"}`} />
              <span>{cat.labelEn}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
};

