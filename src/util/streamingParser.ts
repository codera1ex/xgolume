import { Trip } from "../types";

/**
 * Robust Partial JSON Repair & Parser for Live AI Streaming
 * Takes an incomplete/fragmented JSON string from Gemini generateContentStream
 * and repairs unclosed strings, objects, and arrays so the UI can incrementally parse
 * partial object structures in real-time.
 */
export function parsePartialJSON<T = any>(jsonString: string): Partial<T> | null {
  if (!jsonString || !jsonString.trim()) return null;
  const str = jsonString.trim();

  // Try parsing complete valid JSON directly first
  try {
    return JSON.parse(str);
  } catch (e) {
    // Continue with repair logic
  }

  let repaired = str;

  // Stack-based bracket/brace balancing
  const stack: string[] = [];
  let inString = false;
  let isEscaped = false;

  for (let i = 0; i < repaired.length; i++) {
    const char = repaired[i];

    if (inString) {
      if (char === "\\" && !isEscaped) {
        isEscaped = true;
      } else {
        if (char === '"' && !isEscaped) {
          inString = false;
        }
        isEscaped = false;
      }
    } else {
      if (char === '"') {
        inString = true;
      } else if (char === "{" || char === "[") {
        stack.push(char);
      } else if (char === "}") {
        if (stack.length > 0 && stack[stack.length - 1] === "{") {
          stack.pop();
        }
      } else if (char === "]") {
        if (stack.length > 0 && stack[stack.length - 1] === "[") {
          stack.pop();
        }
      }
    }
  }

  // If stream cut off in the middle of a string token, close the string
  if (inString) {
    if (repaired.endsWith("\\")) {
      repaired = repaired.slice(0, -1);
    }
    repaired += '"';
  }

  // Strip trailing unclosed colons or commas
  repaired = repaired.replace(/[:,\s]+$/, "");

  // Close unclosed arrays & objects in LIFO order
  for (let i = stack.length - 1; i >= 0; i--) {
    const open = stack[i];
    if (open === "{") {
      repaired += "}";
    } else if (open === "[") {
      repaired += "]";
    }
  }

  try {
    return JSON.parse(repaired);
  } catch (e) {
    // Second-pass repair: attempt stripping last key-value colon fragment
    try {
      const lastColon = repaired.lastIndexOf(":");
      if (lastColon > -1) {
        const truncated = repaired.substring(0, lastColon).replace(/,\s*$/, "");
        const stack2: string[] = [];
        let inStr2 = false;
        let esc2 = false;

        for (let i = 0; i < truncated.length; i++) {
          const c = truncated[i];
          if (inStr2) {
            if (c === "\\" && !esc2) esc2 = true;
            else {
              if (c === '"' && !esc2) inStr2 = false;
              esc2 = false;
            }
          } else {
            if (c === '"') inStr2 = true;
            else if (c === "{" || c === "[") stack2.push(c);
            else if (c === "}") {
              if (stack2.length && stack2[stack2.length - 1] === "{") stack2.pop();
            } else if (c === "]") {
              if (stack2.length && stack2[stack2.length - 1] === "[") stack2.pop();
            }
          }
        }

        let rep2 = truncated;
        if (inStr2) rep2 += '"';
        rep2 = rep2.replace(/[:,\s]+$/, "");
        for (let i = stack2.length - 1; i >= 0; i--) {
          if (stack2[i] === "{") rep2 += "}";
          else if (stack2[i] === "[") rep2 += "]";
        }
        return JSON.parse(rep2);
      }
    } catch (err2) {
      return null;
    }
    return null;
  }
}

export interface StreamTripParams {
  destination: string;
  specificPlace?: string;
  startDate?: string;
  endDate?: string;
  travelersCount?: number;
  travelerType?: string;
  totalBudget?: number;
  interests?: string[];
  travelStyle?: string;
  preferences?: string;
}

/**
 * Initiates SSE stream to /api/generate-trip-stream and invokes onPartialTrip
 * as incremental chunks are parsed.
 */
export async function streamTripItinerary(
  params: StreamTripParams,
  onPartialTrip: (partial: Partial<Trip>, rawText: string) => void
): Promise<Trip> {
  const response = await fetch("/api/generate-trip-stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`Failed to initiate stream: ${response.statusText}`);
  }

  if (!response.body) {
    throw new Error("No readable stream received from server.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let accumulatedRawText = "";
  let buffer = "";
  let lastParsedTrip: Partial<Trip> | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunkStr = decoder.decode(value, { stream: true });
    buffer += chunkStr;

    const lines = buffer.split("\n\n");
    buffer = lines.pop() || ""; // Keep incomplete chunk in buffer

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("data: ")) {
        const dataStr = trimmed.slice(6);
        try {
          const parsedData = JSON.parse(dataStr);
          if (parsedData.chunk) {
            accumulatedRawText += parsedData.chunk;
            const partial = parsePartialJSON<Trip>(accumulatedRawText);
            if (partial) {
              lastParsedTrip = partial;
              onPartialTrip(partial, accumulatedRawText);
            }
          }
        } catch (e) {
          console.warn("[StreamingParser] SSE parse warning:", e);
        }
      }
    }
  }

  // Finalize full trip object with safe defaults
  const destName = params.destination || "India";
  const finalTrip: Trip = {
    id: lastParsedTrip?.id || "trip_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8),
    title: lastParsedTrip?.title || `Trip to ${destName}`,
    destination: lastParsedTrip?.destination || destName,
    specificPlace: lastParsedTrip?.specificPlace || params.specificPlace,
    startDate: params.startDate || "2026-09-10",
    endDate: params.endDate || "2026-09-13",
    durationDays: lastParsedTrip?.durationDays || 3,
    travelersCount: params.travelersCount || 2,
    travelerType: (params.travelerType as any) || "couple",
    totalBudget: params.totalBudget || 25000,
    estimatedCost: lastParsedTrip?.estimatedCost || Math.round((params.totalBudget || 25000) * 0.85),
    interests: params.interests || ["Sightseeing"],
    travelStyle: (params.travelStyle as any) || "comfort",
    preferences: params.preferences || "",
    coverImage:
      lastParsedTrip?.coverImage ||
      "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800&q=80",
    itinerary: Array.isArray(lastParsedTrip?.itinerary) ? (lastParsedTrip!.itinerary as any) : [],
    recommendedStays: Array.isArray(lastParsedTrip?.recommendedStays)
      ? (lastParsedTrip!.recommendedStays as any)
      : [],
    recommendedFood: Array.isArray(lastParsedTrip?.recommendedFood)
      ? (lastParsedTrip!.recommendedFood as any)
      : [],
    transportAdvice: lastParsedTrip?.transportAdvice || "Use registered local taxis or electric autos.",
    bestTimeToVisit: lastParsedTrip?.bestTimeToVisit || "October to June for clear skies.",
    createdAt: new Date().toISOString(),
    status: "upcoming",
    isSaved: true,
  };

  return finalTrip;
}
