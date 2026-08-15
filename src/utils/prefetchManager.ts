import { Trip } from "../types";

interface PrefetchParams {
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

const prefetchCache = new Map<string, Promise<Trip | null>>();
const tripResultsCache = new Map<string, Trip>();

export function getPrefetchKey(destination: string, specificPlace?: string): string {
  const normDest = destination.trim().toLowerCase();
  const normPlace = (specificPlace || "").trim().toLowerCase();
  return `${normDest}__${normPlace}`;
}

export function startPrefetchTrip(params: PrefetchParams): Promise<Trip | null> | null {
  if (!params.destination || params.destination.trim().length < 3) {
    return null;
  }

  const key = getPrefetchKey(params.destination, params.specificPlace);

  if (prefetchCache.has(key)) {
    return prefetchCache.get(key)!;
  }

  console.log(`[PrefetchManager] Starting background pre-fetch for destination: "${params.destination}"`);

  const prefetchPromise = (async () => {
    try {
      const response = await fetch("/api/generate-trip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination: params.destination,
          specificPlace: params.specificPlace || undefined,
          startDate: params.startDate || "2026-09-10",
          endDate: params.endDate || "2026-09-13",
          travelersCount: params.travelersCount || 2,
          travelerType: params.travelerType || "couple",
          totalBudget: params.totalBudget || 25000,
          interests: params.interests || ["Hiking", "Local Food", "Sightseeing"],
          travelStyle: params.travelStyle || "comfort",
          preferences: params.preferences || "",
          language: "en"
        })
      });

      const data = await response.json();
      if (data.success && data.trip) {
        tripResultsCache.set(key, data.trip);
        console.log(`[PrefetchManager] Background pre-fetch completed for: "${params.destination}"`);
        return data.trip as Trip;
      }
      return null;
    } catch (err) {
      console.warn("[PrefetchManager] Background pre-fetch failed:", err);
      return null;
    }
  })();

  prefetchCache.set(key, prefetchPromise);
  return prefetchPromise;
}

export async function getOrFetchTrip(params: PrefetchParams): Promise<Trip | null> {
  const key = getPrefetchKey(params.destination, params.specificPlace);

  if (tripResultsCache.has(key)) {
    console.log(`[PrefetchManager] Serving instant prefetched trip for: "${params.destination}"`);
    return tripResultsCache.get(key)!;
  }

  if (prefetchCache.has(key)) {
    console.log(`[PrefetchManager] Awaiting in-flight background pre-fetch for: "${params.destination}"`);
    const result = await prefetchCache.get(key)!;
    if (result) return result;
  }

  const fresh = startPrefetchTrip(params);
  if (fresh) {
    return await fresh;
  }
  return null;
}
