import React, { useState } from "react";
import { Sparkles, ArrowRight, Loader2, RefreshCw } from "lucide-react";
import { Language, Trip } from "../types";

interface ModifyItineraryBarProps {
  trip: Trip;
  language: Language;
  onTripUpdated: (updatedTrip: Trip) => void;
}

export const ModifyItineraryBar: React.FC<ModifyItineraryBarProps> = ({
  trip,
  language,
  onTripUpdated
}) => {
  const [command, setCommand] = useState("");
  const [isModifying, setIsModifying] = useState(false);
  const [error, setError] = useState("");

  const presetCommandsEn = [
    "Make this trip cheaper",
    "Remove nightlife activities",
    "Add one more beach or nature spot",
    "Reduce budget to ₹20,000",
    "Make Day 2 less hectic"
  ];

  const presetCommandsHi = [
    "ट्रिप को थोड़ा और किफायती बनाएं",
    "नाइटलाइफ़ गतिविधियां हटा दें",
    "एक और प्रकृति/समुद्र तट जोड़ें",
    "बजट को ₹20,000 तक कम करें",
    "दिन 2 की योजना को हल्का करें"
  ];

  const presets = language === "en" ? presetCommandsEn : presetCommandsHi;

  const handleModify = async (instruction: string) => {
    if (!instruction.trim()) return;
    setIsModifying(true);
    setError("");

    try {
      const response = await fetch("/api/modify-trip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trip,
          command: instruction,
          language
        })
      });

      const data = await response.json();
      if (data.success && data.trip) {
        onTripUpdated(data.trip);
        setCommand("");
      } else {
        throw new Error("Could not update itinerary.");
      }
    } catch (err: any) {
      console.error(err);
      setError("Modification failed. Please try again.");
    } finally {
      setIsModifying(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-sky-950 text-white p-4 rounded-2xl shadow-lg border border-blue-800/60 my-4">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300 animate-spin-slow" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-sky-200">
          {language === "en" ? "AI Itinerary Modifier & Budget Recalculator" : "एआई यात्रा संशोधन एवं बजट पुनर्गणना"}
        </h3>
      </div>

      <p className="text-xs text-slate-300 mb-3">
        {language === "en"
          ? 'Instruct AI to adjust schedule or budget (e.g., "Make it cheaper", "Add a beach", "Reduce budget to ₹20,000")'
          : 'प्राकृतिक भाषा कमांड दें (जैसे "ट्रिप सस्ती करें", "एक और बीच जोड़ें", "बजट ₹20,000 करें")'}
      </p>

      {error && <div className="text-xs text-rose-300 mb-2 font-semibold">{error}</div>}

      {/* Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleModify(command);
        }}
        className="flex items-center gap-2"
      >
        <input
          type="text"
          value={command}
          disabled={isModifying}
          onChange={(e) => setCommand(e.target.value)}
          placeholder={
            language === "en"
              ? "Type command to modify this trip..."
              : "अपनी इच्छानुसार संशोधन कमांड लिखें..."
          }
          className="flex-1 bg-white/10 text-white placeholder-slate-400 text-xs font-medium px-3.5 py-2.5 rounded-xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-sky-400"
        />

        <button
          type="submit"
          disabled={isModifying || !command.trim()}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-all shrink-0"
        >
          {isModifying ? (
            <Loader2 className="w-4 h-4 animate-spin text-white" />
          ) : (
            <>
              <span>{language === "en" ? "Apply" : "लागू करें"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </form>

      {/* Preset Command Quick Chips */}
      <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        <span className="text-[10px] font-bold text-sky-300 shrink-0">
          {language === "en" ? "Quick AI Commands:" : "त्वरित कमांड्स:"}
        </span>
        {presets.map((preset, idx) => (
          <button
            key={idx}
            type="button"
            disabled={isModifying}
            onClick={() => handleModify(preset)}
            className="text-[10px] bg-white/10 hover:bg-white/20 text-sky-100 px-2.5 py-1 rounded-lg shrink-0 border border-white/10 font-medium transition-all"
          >
            + {preset}
          </button>
        ))}
      </div>
    </div>
  );
};
