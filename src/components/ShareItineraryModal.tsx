import React, { useState } from "react";
import { Share2, Copy, Check, X, FileText, Send, Calendar, MapPin, IndianRupee } from "lucide-react";
import { Language, Trip } from "../types";

interface ShareItineraryModalProps {
  trip: Trip;
  language: Language;
  isOpen: boolean;
  onClose: () => void;
}

export const ShareItineraryModal: React.FC<ShareItineraryModalProps> = ({
  trip,
  language,
  isOpen,
  onClose
}) => {
  const [copied, setCopied] = useState(false);

  // Only the `useState` above is a hook — safe to bail out now (Rules of
  // Hooks: hooks must run in the same order on every render; everything
  // below this line is plain computation/functions, not hooks).
  if (!isOpen) return null;

  const formattedSummary = `
🌟 GoLumo Travel Plan: ${trip.title}
📍 Destination: ${trip.destination}
📅 Dates: ${trip.startDate} to ${trip.endDate} (${trip.durationDays} Days)
👥 Travelers: ${trip.travelersCount} (${trip.travelerType})
💰 Est. Budget: ₹${trip.estimatedCost.toLocaleString("en-IN")} INR

--- DAY-BY-DAY ITINERARY ---
${trip.itinerary
  .map(
    (day) => `
🗓️ Day ${day.dayNumber}: ${day.theme}
• Morning: ${day.morning.map((m) => m.title).join(", ")}
• Afternoon: ${day.afternoon.map((a) => a.title).join(", ")}
• Evening: ${day.evening.map((e) => e.title).join(", ")}
`
  )
  .join("\n")}

🚗 Transport Tip: ${trip.transportAdvice}
🏨 Recommended Stay: ${trip.recommendedStays[0]?.name || "Local Boutique Hotel"}

Planned using GoLumo AI Travel Planner! 🚀
  `.trim();

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedSummary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsAppShare = () => {
    const encoded = encodeURIComponent(formattedSummary);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-500 to-blue-600 p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-amber-300" />
            <h3 className="font-extrabold text-base">
              {language === "en" ? "Share Travel Itinerary" : "यात्रा विवरण साझा करें"}
            </h3>
          </div>

          <button onClick={onClose} className="p-1 rounded-full bg-white/20 hover:bg-white/30 text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto text-xs">
          <p className="text-slate-600 font-medium">
            {language === "en"
              ? "Clean, shareable trip plan excluding personal private account info."
              : "साझा करने योग्य योजना (व्यक्तिगत जानकारी सुरक्षित)।"}
          </p>

          {/* Preview Card */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 font-mono text-[11px] text-slate-800 whitespace-pre-line leading-relaxed max-h-56 overflow-y-auto">
            {formattedSummary}
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              onClick={handleCopy}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? (language === "en" ? "Copied!" : "कॉपी हो गया!") : (language === "en" ? "Copy Summary" : "कॉपी करें")}</span>
            </button>

            <button
              onClick={handleWhatsAppShare}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md shadow-emerald-600/20"
            >
              <Send className="w-4 h-4" />
              <span>{language === "en" ? "WhatsApp Share" : "व्हाट्सएप शेयर"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
