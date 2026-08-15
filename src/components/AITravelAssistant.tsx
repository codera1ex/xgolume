import React, { useState } from "react";
import {
  Bot,
  Send,
  Sparkles,
  User,
  X,
  MessageSquare,
  HelpCircle,
  Loader2
} from "lucide-react";
import { ChatMessage, Language, Trip } from "../types";

interface AITravelAssistantProps {
  trip?: Trip;
  language?: Language;
  userLocation?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const AITravelAssistant: React.FC<AITravelAssistantProps> = ({
  trip,
  userLocation,
  isOpen,
  onClose
}) => {
  const initialGreeting: ChatMessage = {
    id: "msg-init",
    sender: "assistant",
    text: `Hello! I am your GoLumo AI Travel Companion. ${
      trip
        ? `I'm connected to your "${trip.title}" trip.`
        : "Ask me anything about planning your travel in India!"
    }`,
    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  };

  const [messages, setMessages] = useState<ChatMessage[]>([initialGreeting]);
  const [inputPrompt, setInputPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const suggestions = [
    "What am I doing tomorrow?",
    "Where should I eat tonight?",
    "It's raining today. Change my plan.",
    "How much of my budget is left?"
  ];

  const handleSend = async (questionText: string) => {
    if (!questionText.trim()) return;

    const userMsg: ChatMessage = {
      id: "msg-" + Date.now(),
      sender: "user",
      text: questionText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: questionText,
          currentTrip: trip,
          userLocation,
          language: "en"
        })
      });

      const data = await response.json();

      const aiReply: ChatMessage = {
        id: "msg-" + (Date.now() + 1),
        sender: "assistant",
        text: data.reply || "I am right here with you! Let me check that travel detail.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };

      setMessages((prev) => [...prev, aiReply]);
    } catch (err) {
      console.error(err);
      const errReply: ChatMessage = {
        id: "msg-err-" + Date.now(),
        sender: "assistant",
        text: "Apologies, I encountered a brief connectivity glitch. Please ask again!",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      setMessages((prev) => [...prev, errReply]);
    } finally {
      setIsLoading(false);
    }
  };

  // All hooks are declared above this point — safe to bail out now
  // (Rules of Hooks: hooks must run in the same order on every render).
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-md h-[88vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-100">
        {/* Chat Header */}
        <div className="bg-gradient-to-r from-sky-500 via-blue-600 to-sky-600 p-4 text-white flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
              <Bot className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm tracking-tight flex items-center gap-1.5">
                <span>GoLumo AI Travel Assistant</span>
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
              </h3>
              <p className="text-[11px] text-sky-100 truncate max-w-[200px]">
                {trip ? trip.destination : "Context-Aware Travel Helper"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 bg-white/20 hover:bg-white/30 rounded-full text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Log */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/60">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-2 text-xs ${
                m.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {m.sender === "assistant" && (
                <div className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4 text-amber-300" />
                </div>
              )}

              <div
                className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 shadow-xs leading-relaxed ${
                  m.sender === "user"
                    ? "bg-blue-600 text-white font-medium rounded-tr-none"
                    : "bg-white text-slate-800 border border-slate-200/80 rounded-tl-none"
                }`}
              >
                <p className="whitespace-pre-line">{m.text}</p>
                <span
                  className={`block text-[9px] mt-1 text-right ${
                    m.sender === "user" ? "text-blue-100" : "text-slate-400"
                  }`}
                >
                  {m.timestamp}
                </span>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-slate-500 italic bg-white px-3 py-2 rounded-2xl w-max border border-slate-200">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
              <span>GoLumo AI is thinking...</span>
            </div>
          )}
        </div>

        {/* Suggestions Bar */}
        <div className="p-2 bg-white border-t border-slate-100 overflow-x-auto no-scrollbar flex items-center gap-1.5 shrink-0">
          <HelpCircle className="w-3.5 h-3.5 text-blue-600 shrink-0 ml-1" />
          {suggestions.map((sug, idx) => (
            <button
              key={idx}
              disabled={isLoading}
              onClick={() => handleSend(sug)}
              className="text-[10px] bg-sky-50 hover:bg-sky-100 text-sky-800 px-2.5 py-1.5 rounded-full font-semibold border border-sky-200 shrink-0 transition-all active:scale-95 cursor-pointer"
            >
              {sug}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-slate-200 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(inputPrompt);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputPrompt}
              disabled={isLoading}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder="Ask about your itinerary, budget, or food..."
              className="flex-1 text-xs font-medium bg-slate-100 text-slate-800 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <button
              type="submit"
              disabled={isLoading || !inputPrompt.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white p-2.5 rounded-xl transition-all shadow-md shrink-0 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

