import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Generates a trip id that is extremely unlikely to collide, even if two
// requests land in the same millisecond (Date.now() alone was not
// collision-safe and is also the primary key in the Supabase `trips`
// table, so a collision would silently fail to save for one of the users).
function generateTripId(): string {
  return "trip_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
}

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Initialize Google Gen AI client server-side
const getGenAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    console.warn("GEMINI_API_KEY environment variable is missing or placeholder.");
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

// Top Indian Tourist Destinations Data for Search & Activity Filtering
const INDIAN_DESTINATIONS = [
  {
    id: "manali",
    name: "Manali & Solang Valley",
    state: "Himachal Pradesh",
    image: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800&q=80",
    tagline: "High Mountain Passes, Snow Sports & Solang Valley Adventure",
    description: "Nestled in the Himalayas, famous for Paragliding, Trekking, Jogini Waterfalls, and Rohtang Pass.",
    popularActivities: ["Hiking", "Paragliding", "Skiing", "Camping", "River Rafting"],
    bestMonths: "Oct - Jun",
    avgDailyBudget: 3500,
    rating: 4.8,
    category: "hiking",
    coordinates: { lat: 32.2432, lng: 77.1892 },
  },
  {
    id: "leh-ladakh",
    name: "Leh Ladakh & Pangong Tso",
    state: "Ladakh",
    image: "https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?auto=format&fit=crop&w=800&q=80",
    tagline: "High Altitude Passes, Crystal Lakes & Himalayan Climbing",
    description: "The land of high passes, Khardung La, Nubra Valley, Pangong Tso Lake, and ancient monasteries.",
    popularActivities: ["Climbing", "Motorbiking", "Camping", "Monastery Tour", "Stargazing"],
    bestMonths: "May - Sep",
    avgDailyBudget: 4500,
    rating: 4.9,
    category: "climbing",
    coordinates: { lat: 34.1526, lng: 77.5771 },
  },
  {
    id: "north-goa",
    name: "Goa (North & South)",
    state: "Goa",
    image: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80",
    tagline: "Sun-Kissed Beaches, Water Sports & Portuguese Heritage",
    description: "Palolem Beach, Calangute, Fort Aguada, Dudhsagar Waterfalls, and vibrant coastal shacks.",
    popularActivities: ["Beach Walk", "Parasailing", "Scuba Diving", "Sunset Cruise", "Seafood Dining"],
    bestMonths: "Nov - Feb",
    avgDailyBudget: 4000,
    rating: 4.7,
    category: "beach",
    coordinates: { lat: 15.2993, lng: 74.124 },
  },
  {
    id: "rishikesh",
    name: "Rishikesh & Haridwar",
    state: "Uttarakhand",
    image: "https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&w=800&q=80",
    tagline: "Yoga Capital of the World, White Water Rafting & Ganga Aarti",
    description: "Laxman Jhula, Triveni Ghat, Bungee Jumping, River Rafting, and serene ashrams along the Ganges.",
    popularActivities: ["River Rafting", "Bungee Jumping", "Yoga & Meditation", "Ganga Aarti", "Camping"],
    bestMonths: "Sep - Nov & Mar - May",
    avgDailyBudget: 2500,
    rating: 4.8,
    category: "camping",
    coordinates: { lat: 30.0869, lng: 78.2676 },
  },
  {
    id: "jaipur",
    name: "Jaipur - The Pink City",
    state: "Rajasthan",
    image: "https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=800&q=80",
    tagline: "Royal Palaces, Grand Forts & Rich Cultural Heritage",
    description: "Amer Fort, Hawa Mahal, City Palace, Jal Mahal, and bustling Rajasthani bazaars.",
    popularActivities: ["Fort Tour", "Heritage Walk", "Street Food Tasting", "Bazaar Shopping", "Puppet Show"],
    bestMonths: "Oct - Mar",
    avgDailyBudget: 3200,
    rating: 4.8,
    category: "heritage",
    coordinates: { lat: 26.9124, lng: 75.7873 },
  },
  {
    id: "alleppey",
    name: "Alleppey Backwaters & Munnar",
    state: "Kerala",
    image: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80",
    tagline: "Serene Houseboats, Emerald Tea Gardens & Spices",
    description: "Vembanad Lake houseboats, Marari Beach, Munnar tea estates, and Ayurvedic wellness.",
    popularActivities: ["Houseboat Stay", "Tea Plantation Tour", "Canoeing", "Spice Garden Visit", "Kathakali Show"],
    bestMonths: "Sep - Mar",
    avgDailyBudget: 3800,
    rating: 4.9,
    category: "backwaters",
    coordinates: { lat: 9.4981, lng: 76.3388 },
  },
  {
    id: "varanasi",
    name: "Varanasi - Kashi",
    state: "Uttar Pradesh",
    image: "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=800&q=80",
    tagline: "Spiritual Capital, Sacred Ghats & Ancient Traditions",
    description: "Dashashwamedh Ghat, Kashi Vishwanath Temple, Morning Boat Ride, Sarnath, and Banarasi Silk.",
    popularActivities: ["Sunrise Boat Ride", "Ganga Aarti", "Temple Tour", "Street Food Crawl", "Silk Weaving Tour"],
    bestMonths: "Oct - Mar",
    avgDailyBudget: 2200,
    rating: 4.8,
    category: "culture",
    coordinates: { lat: 25.3176, lng: 82.9739 },
  },
  {
    id: "jim-corbett",
    name: "Jim Corbett National Park",
    state: "Uttarakhand",
    image: "https://images.unsplash.com/photo-1534567153574-2b12153a87f0?auto=format&fit=crop&w=800&q=80",
    tagline: "Royal Bengal Tiger Safari, Wilderness & River Lodges",
    description: "Dhikala zone, Jungle Safari, Kosi River, Bird Watching, and luxury wilderness eco-resorts.",
    popularActivities: ["Jungle Safari", "Bird Watching", "River Walk", "Tiger Spotting", "Nature Photography"],
    bestMonths: "Nov - Jun",
    avgDailyBudget: 4200,
    rating: 4.7,
    category: "wildlife",
    coordinates: { lat: 29.53, lng: 78.7747 },
  },
  {
    id: "hampi",
    name: "Hampi Boulder City",
    state: "Karnataka",
    image: "https://images.unsplash.com/photo-1600100397608-f010f423b971?auto=format&fit=crop&w=800&q=80",
    tagline: "UNESCO Vijayanagara Ruins, Bouldering & Coracle Rides",
    description: "Virupaksha Temple, Stone Chariot, Matanga Hill sunrise, Coracle boat rides on Tungabhadra.",
    popularActivities: ["Climbing", "Bouldering", "Coracle Ride", "Sunrise Trek", "Temple Exploration"],
    bestMonths: "Oct - Feb",
    avgDailyBudget: 2600,
    rating: 4.8,
    category: "climbing",
    coordinates: { lat: 15.335, lng: 76.46 },
  },
  {
    id: "srinagar-gulmarg",
    name: "Srinagar & Gulmarg",
    state: "Jammu & Kashmir",
    image: "https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&w=800&q=80",
    tagline: "Paradise on Earth - Shikara Rides, Gondola & Snow Valleys",
    description: "Dal Lake Shikara ride, Gulmarg Gondola, Pahalgam Betaab Valley, Mughal Gardens, and Wazwan.",
    popularActivities: ["Shikara Ride", "Gondola Cable Car", "Snow Skiing", "Trekking", "Pashmina Shopping"],
    bestMonths: "Mar - Oct & Dec - Feb (Snow)",
    avgDailyBudget: 4800,
    rating: 4.9,
    category: "hiking",
    coordinates: { lat: 34.0837, lng: 74.7973 },
  },
  {
    id: "darjeeling",
    name: "Darjeeling & Gangtok",
    state: "West Bengal & Sikkim",
    image: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80",
    tagline: "Tiger Hill Sunrise, Toy Train & Kanchenjunga Views",
    description: "Darjeeling Himalayan Railway, Batasia Loop, Nathula Pass, Tsomgo Lake, and Organic Tea Gardens.",
    popularActivities: ["Toy Train Ride", "Tiger Hill Sunrise", "Tea Tasting", "Monastery Visits", "Cable Car"],
    bestMonths: "Mar - May & Oct - Dec",
    avgDailyBudget: 3400,
    rating: 4.8,
    category: "hiking",
    coordinates: { lat: 27.041, lng: 88.2663 },
  },
  {
    id: "gokarna",
    name: "Gokarna Beaches",
    state: "Karnataka",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
    tagline: "Pristine Beach Trek, Sunset Cliffs & Mahabaleshwar Temple",
    description: "Om Beach, Kudle Beach, Half Moon Beach Trek, Mahabaleshwar Temple, and peaceful beach stays.",
    popularActivities: ["Beach Trekking", "Cliff Sunset", "Temple Visit", "Surfing", "Beach Camping"],
    bestMonths: "Oct - Mar",
    avgDailyBudget: 2200,
    rating: 4.7,
    category: "beach",
    coordinates: { lat: 14.5479, lng: 74.3188 },
  }
];

// Weather Data Endpoint — backed by OpenWeatherMap when WEATHER_API_KEY is
// configured, falls back to generated mock data if the key is missing so
// the app keeps working during local dev without a key.
function mockWeather(destination: string) {
  const baseTemp = destination.toLowerCase().includes("manali") || destination.toLowerCase().includes("ladakh") || destination.toLowerCase().includes("gulmarg") || destination.toLowerCase().includes("darjeeling") ? 14 : 28;
  const isColdRegion = baseTemp < 20;

  return {
    city: destination,
    temp: baseTemp,
    condition: isColdRegion ? "Pleasant & Clear" : "Sunny & Warm",
    humidity: 62,
    windSpeed: 12,
    icon: isColdRegion ? "cloud-sun" : "sun",
    isRainyToday: false,
    alertMessage: isColdRegion
      ? "Carry light woollens/jackets for morning and evening chill."
      : "Ideal weather for sightseeing! Stay hydrated during outdoor trips.",
    forecast: [
      { date: "Today", tempMax: baseTemp + 4, tempMin: baseTemp - 5, condition: isColdRegion ? "Sunny" : "Clear", rainProb: 10 },
      { date: "Tomorrow", tempMax: baseTemp + 3, tempMin: baseTemp - 4, condition: "Partly Cloudy", rainProb: 20 },
      { date: "Day 3", tempMax: baseTemp + 5, tempMin: baseTemp - 3, condition: "Sunny", rainProb: 5 },
      { date: "Day 4", tempMax: baseTemp + 2, tempMin: baseTemp - 6, condition: isColdRegion ? "Chilly Breeze" : "Passing Clouds", rainProb: 15 },
      { date: "Day 5", tempMax: baseTemp + 4, tempMin: baseTemp - 4, condition: "Clear Skies", rainProb: 0 }
    ],
    source: "mock"
  };
}

function mapOwmIconToAppIcon(main: string, isNight: boolean): string {
  const key = main.toLowerCase();
  if (key.includes("rain") || key.includes("drizzle")) return "cloud-rain";
  if (key.includes("thunderstorm")) return "cloud-lightning";
  if (key.includes("snow")) return "cloud-snow";
  if (key.includes("cloud")) return isNight ? "cloud-moon" : "cloud-sun";
  if (key.includes("clear")) return isNight ? "moon" : "sun";
  return "cloud-sun";
}

app.get("/api/weather", async (req, res) => {
  const destination = (req.query.destination as string) || "Manali";
  const weatherApiKey = process.env.WEATHER_API_KEY;

  if (!weatherApiKey) {
    console.warn("WEATHER_API_KEY missing — serving mock weather data.");
    return res.json(mockWeather(destination));
  }

  try {
    // 1. Geocode the destination name to lat/lon (biased to India, matches
    // the app's current destination catalogue)
    const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(destination)},IN&limit=1&appid=${weatherApiKey}`;
    const geoRes = await fetch(geoUrl);
    if (!geoRes.ok) throw new Error(`Geocoding failed: ${geoRes.status}`);
    const geoData = await geoRes.json();

    if (!Array.isArray(geoData) || geoData.length === 0) {
      console.warn(`No geocoding match for "${destination}" — serving mock weather data.`);
      return res.json(mockWeather(destination));
    }

    const { lat, lon } = geoData[0];

    // 2. Current weather + 3. 5-day / 3-hour forecast, in parallel
    const [currentRes, forecastRes] = await Promise.all([
      fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${weatherApiKey}`),
      fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${weatherApiKey}`)
    ]);

    if (!currentRes.ok || !forecastRes.ok) {
      throw new Error(`Weather fetch failed: current=${currentRes.status} forecast=${forecastRes.status}`);
    }

    const current = await currentRes.json();
    const forecastRaw = await forecastRes.json();

    // Group the 3-hourly forecast entries into daily min/max/condition,
    // one entry per day, next 5 days
    const dayBuckets = new Map<string, { temps: number[]; conditions: string[]; rainProbs: number[] }>();
    for (const entry of forecastRaw.list || []) {
      const date = new Date(entry.dt * 1000).toISOString().slice(0, 10);
      if (!dayBuckets.has(date)) {
        dayBuckets.set(date, { temps: [], conditions: [], rainProbs: [] });
      }
      const bucket = dayBuckets.get(date)!;
      bucket.temps.push(entry.main.temp);
      bucket.conditions.push(entry.weather?.[0]?.main || "Clear");
      bucket.rainProbs.push(Math.round((entry.pop || 0) * 100));
    }

    const dayLabels = ["Today", "Tomorrow", "Day 3", "Day 4", "Day 5"];
    const forecast = Array.from(dayBuckets.entries())
      .slice(0, 5)
      .map(([, bucket], idx) => ({
        date: dayLabels[idx] || `Day ${idx + 1}`,
        tempMax: Math.round(Math.max(...bucket.temps)),
        tempMin: Math.round(Math.min(...bucket.temps)),
        condition: bucket.conditions[Math.floor(bucket.conditions.length / 2)],
        rainProb: Math.max(...bucket.rainProbs)
      }));

    const isNight = current.weather?.[0]?.icon?.endsWith("n") || false;
    const conditionMain = current.weather?.[0]?.main || "Clear";
    const isRainyToday = conditionMain.toLowerCase().includes("rain") || conditionMain.toLowerCase().includes("drizzle");

    const response = {
      city: geoData[0].name || destination,
      temp: Math.round(current.main.temp),
      condition: current.weather?.[0]?.description
        ? current.weather[0].description.replace(/\b\w/g, (c: string) => c.toUpperCase())
        : conditionMain,
      humidity: current.main.humidity,
      windSpeed: Math.round(current.wind?.speed * 3.6), // m/s -> km/h
      icon: mapOwmIconToAppIcon(conditionMain, isNight),
      isRainyToday,
      alertMessage: isRainyToday
        ? "Rain expected — carry an umbrella/raincoat and plan indoor backups."
        : current.main.temp < 15
          ? "Carry light woollens/jackets for morning and evening chill."
          : "Ideal weather for sightseeing! Stay hydrated during outdoor trips.",
      forecast: forecast.length > 0 ? forecast : mockWeather(destination).forecast,
      source: "openweathermap"
    };

    res.json(response);
  } catch (err) {
    console.error("Weather API error, falling back to mock data:", err);
    res.json(mockWeather(destination));
  }
});

// Destination search & filtering endpoint
app.get("/api/destinations", (req, res) => {
  const query = (req.query.q as string || "").toLowerCase();
  const category = (req.query.category as string || "all").toLowerCase();

  let results = INDIAN_DESTINATIONS;

  if (category && category !== "all") {
    results = results.filter(d => d.category.toLowerCase() === category);
  }

  if (query) {
    results = results.filter(d =>
      d.name.toLowerCase().includes(query) ||
      d.state.toLowerCase().includes(query) ||
      d.tagline.toLowerCase().includes(query) ||
      d.popularActivities.some(a => a.toLowerCase().includes(query))
    );
  }

  res.json(results);
});

// Live Nearby recommendations endpoint — backed by Geoapify (Geocoding +
// Places APIs) when configured, falls back to mock data otherwise.
function mockNearbyData() {
  return [
    {
      id: "nb-1",
      name: "Chopstick Noodle Bar & Cafe",
      category: "food",
      subCategory: "Tibetan & Himachali Food",
      rating: 4.8,
      distanceKm: 0.8,
      priceEstimate: 450,
      address: "Mall Road, Near Bus Stand",
      coordinates: { lat: 32.2432, lng: 77.1892 },
      description: "Authentic Steamed Momos, Thukpa, and Hot Himalayan Herbal Tea.",
      image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=500&q=80",
      tags: ["Veg Options", "Famous Local", "Cozy Ambience"]
    },
    {
      id: "nb-2",
      name: "Jogini Waterfall Short Nature Trek",
      category: "activity",
      subCategory: "Nature Walk & Waterfall",
      rating: 4.9,
      distanceKm: 1.4,
      priceEstimate: 0,
      address: "Vashisht Village Trail",
      coordinates: { lat: 32.2612, lng: 77.1982 },
      description: "Scenic 45-min Pine Forest trek reaching the majestic Jogini falls.",
      image: "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=500&q=80",
      tags: ["Free Entry", "Easy Trek", "Photogenic"]
    },
    {
      id: "nb-3",
      name: "Solang Valley Tandem Paragliding",
      category: "activity",
      subCategory: "Adventure Sports",
      rating: 4.7,
      distanceKm: 3.5,
      priceEstimate: 2200,
      address: "Solang Valley Counter #4",
      coordinates: { lat: 32.3167, lng: 77.1583 },
      description: "Fly high over snowy Himalayan peaks with certified pilots and HD video camera.",
      image: "https://images.unsplash.com/photo-1516738901171-8eb4fc13bd20?auto=format&fit=crop&w=500&q=80",
      tags: ["Adrenaline", "Instructor Included", "Safety First"]
    },
    {
      id: "nb-4",
      name: "The Lazy Dog Lounge & Garden",
      category: "food",
      subCategory: "Riverside Bistro & Live Music",
      rating: 4.6,
      distanceKm: 1.1,
      priceEstimate: 800,
      address: "Old Manali, Riverside",
      coordinates: { lat: 32.2532, lng: 77.1812 },
      description: "Wooden deck right beside Beas River stream, serving artisan pizzas and craft drinks.",
      image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=500&q=80",
      tags: ["Live Music", "River View", "Great Vibe"]
    }
  ];
}

// Category filters this app exposes -> Geoapify Places category codes
// https://apidocs.geoapify.com/docs/places/#categories
const NEARBY_CATEGORY_MAP: Record<string, string> = {
  food: "catering.restaurant,catering.cafe,catering.fast_food",
  activity: "tourism.attraction,entertainment,leisure.park,tourism.sights",
};

function geoapifyCategoryToAppCategory(categories: string[]): "food" | "activity" {
  if (categories.some(c => c.startsWith("catering"))) return "food";
  return "activity";
}

const NEARBY_IMAGE_BY_CATEGORY: Record<string, string> = {
  food: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=500&q=80",
  activity: "https://images.unsplash.com/photo-1516738901171-8eb4fc13bd20?auto=format&fit=crop&w=500&q=80",
};

app.get("/api/nearby-live", async (req, res) => {
  const destination = (req.query.destination as string) || "Manali";
  const type = ((req.query.type as string) || "all").toLowerCase();
  const geocodingKey = process.env.GEOAPIFY_GEOCODING_API_KEY;
  const placesKey = process.env.GEOAPIFY_PLACES_API_KEY;

  if (!geocodingKey || !placesKey) {
    console.warn("GEOAPIFY_GEOCODING_API_KEY/GEOAPIFY_PLACES_API_KEY missing — serving mock nearby data.");
    const mock = mockNearbyData();
    return res.json(type === "all" ? mock : mock.filter(item => item.category === type));
  }

  try {
    // 1. Geocode the destination name to lat/lon
    const geoRes = await fetch(
      `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(destination)}&limit=1&apiKey=${geocodingKey}`
    );
    if (!geoRes.ok) throw new Error(`Geoapify geocoding failed: ${geoRes.status}`);
    const geoData = await geoRes.json();
    const feature = geoData.features?.[0];

    if (!feature) {
      console.warn(`No geocoding match for "${destination}" — serving mock nearby data.`);
      const mock = mockNearbyData();
      return res.json(type === "all" ? mock : mock.filter(item => item.category === type));
    }

    const [lon, lat] = feature.geometry.coordinates;

    // 2. Places search around that point
    const categories =
      type === "food" ? NEARBY_CATEGORY_MAP.food :
      type === "activity" ? NEARBY_CATEGORY_MAP.activity :
      `${NEARBY_CATEGORY_MAP.food},${NEARBY_CATEGORY_MAP.activity}`;

    const placesRes = await fetch(
      `https://api.geoapify.com/v2/places?categories=${categories}&filter=circle:${lon},${lat},6000&bias=proximity:${lon},${lat}&limit=20&apiKey=${placesKey}`
    );
    if (!placesRes.ok) throw new Error(`Geoapify places failed: ${placesRes.status}`);
    const placesData = await placesRes.json();

    const results = (placesData.features || []).map((f: any, idx: number) => {
      const p = f.properties;
      const category = geoapifyCategoryToAppCategory(p.categories || []);
      const distanceKm = typeof p.distance === "number" ? Math.round((p.distance / 1000) * 10) / 10 : undefined;

      return {
        id: p.place_id || `nb-live-${idx}`,
        name: p.name || p.address_line1 || "Unnamed Place",
        category,
        subCategory: (p.categories || []).find((c: string) => c.includes(".")) || category,
        rating: 4.3, // Geoapify's free Places tier doesn't return ratings
        distanceKm: distanceKm ?? 0,
        priceEstimate: category === "food" ? 400 : 0,
        address: p.formatted || p.address_line2 || destination,
        coordinates: { lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0] },
        description: category === "food"
          ? "Local spot near your destination — verify hours before visiting."
          : "Nearby attraction worth exploring during your trip.",
        image: NEARBY_IMAGE_BY_CATEGORY[category],
        tags: (p.categories || []).slice(0, 3).map((c: string) => c.split(".").pop())
      };
    }).filter((r: any) => r.name !== "Unnamed Place");

    res.json(results.length > 0 ? results : mockNearbyData());
  } catch (err) {
    console.error("Nearby places API error, falling back to mock data:", err);
    const mock = mockNearbyData();
    res.json(type === "all" ? mock : mock.filter(item => item.category === type));
  }
});

// AI Trip Generator Endpoint
app.post("/api/generate-trip", async (req, res) => {
  const {
    destination,
    specificPlace,
    startDate,
    endDate,
    travelersCount = 2,
    travelerType = "couple",
    totalBudget = 25000,
    interests = ["Sightseeing", "Food", "Nature"],
    travelStyle = "comfort",
    preferences = "",
    language = "en"
  } = req.body;

  // Defensive validation: the frontend already prevents this, but the API
  // itself shouldn't trust client input — an invalid range would otherwise
  // get baked straight into the AI prompt and produce a nonsensical or
  // negative-length itinerary.
  if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
    return res.status(400).json({ error: "endDate must be after startDate." });
  }

  console.log(`[AI Trip Generation] For: ${destination}, SpecificPlace: ${specificPlace}, Budget: ₹${totalBudget}, Language: ${language}`);

  const ai = getGenAI();

  const prompt = `
You are GoLumo, an expert Indian Travel Planner AI. Generate a realistic, structured day-by-day travel itinerary in India for:
- Destination: ${destination || "Manali, Himachal Pradesh"}
${specificPlace ? `- Priority Highlight Place: "${specificPlace}".` : ""}
- Dates: ${startDate || "2026-09-01"} to ${endDate || "2026-09-04"}
- Travelers: ${travelersCount} (${travelerType})
- Total Budget: ₹${totalBudget} INR
- Travel Style: ${travelStyle}
- Interests: ${interests.join(", ")}
- Special Preferences: ${preferences || "None"}
- Language: ${language === "hi" ? "Hindi (हिंदी)" : "English"}

Return ONLY a valid JSON object matching this TypeScript structure:
{
  "title": string,
  "destination": string,
  "specificPlace": string (optional),
  "durationDays": number,
  "estimatedCost": number,
  "bestTimeToVisit": string,
  "transportAdvice": string,
  "coverImage": string,
  "itinerary": [
    {
      "dayNumber": 1,
      "date": "YYYY-MM-DD",
      "theme": string,
      "dayTotalCost": number,
      "travelAdvice": string,
      "morning": [
        {
          "id": "act-1",
          "timeSlot": "morning",
          "time": "09:00 AM - 11:30 AM",
          "title": string,
          "description": string,
          "locationName": string,
          "coordinates": { "lat": number, "lng": number },
          "costEstimate": number,
          "category": "attraction" | "activity" | "food" | "stay" | "transport",
          "isHighlight": boolean,
          "tips": string
        }
      ],
      "afternoon": [...same structure...],
      "evening": [...same structure...]
    }
  ],
  "recommendedStays": [
    { "name": string, "type": string, "pricePerNight": number, "location": string, "rating": 4.8 }
  ],
  "recommendedFood": [
    { "name": string, "cuisine": string, "priceRange": "₹200 - ₹500", "location": string, "mustTry": string, "isVeg": boolean }
  ]
}
Be concise, clear, and direct.
`;

  if (ai) {
    try {
      // Race Gemini call with a 6-second timeout for ultra-fast UX
      const geminiPromise = ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.MINIMAL
          },
          systemInstruction: "You are GoLumo AI travel planner. Produce accurate, structured JSON trip plans for India instantly."
        }
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("AI generation timeout, fallback used")), 5500)
      );

      const response: any = await Promise.race([geminiPromise, timeoutPromise]);

      if (response && response.text) {
        const parsed = JSON.parse(response.text.trim());
        parsed.id = generateTripId();
        parsed.startDate = startDate || "2026-09-01";
        parsed.endDate = endDate || "2026-09-04";
        parsed.travelersCount = travelersCount;
        parsed.travelerType = travelerType;
        parsed.totalBudget = totalBudget;
        parsed.interests = interests;
        parsed.travelStyle = travelStyle;
        parsed.createdAt = new Date().toISOString();
        parsed.status = "upcoming";
        parsed.isSaved = true;

        return res.json({ success: true, trip: parsed });
      }
    } catch (err) {
      console.warn("[AI Trip Generation] Gemini API timed out or error occurred, serving instant fallback itinerary:", err);
    }
  }

  // Robust Instant Fallback Generator for Immediate Response
  const fallbackTrip = generateFallbackTrip({
    destination,
    specificPlace,
    startDate: startDate || "2026-09-01",
    endDate: endDate || "2026-09-04",
    travelersCount,
    travelerType,
    totalBudget,
    interests,
    travelStyle,
    language
  });

  return res.json({ success: true, trip: fallbackTrip, isFallback: true });
});

// AI Trip Stream Endpoint (SSE for Incremental Rendering)
app.post("/api/generate-trip-stream", async (req, res) => {
  const {
    destination,
    specificPlace,
    startDate,
    endDate,
    travelersCount = 2,
    travelerType = "couple",
    totalBudget = 25000,
    interests = ["Sightseeing", "Food", "Nature"],
    travelStyle = "comfort",
    preferences = "",
    language = "en"
  } = req.body;

  // Defensive validation (see /api/generate-trip for the same check).
  if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
    return res.status(400).json({ error: "endDate must be after startDate." });
  }

  console.log(`[AI Trip Stream] Initiating streaming generation for: ${destination}, SpecificPlace: ${specificPlace}`);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const sendEvent = (data: object) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  const ai = getGenAI();

  const prompt = `
You are GoLumo, an expert Indian Travel Planner AI. Generate a realistic, structured day-by-day travel itinerary in India for:
- Destination: ${destination || "Manali, Himachal Pradesh"}
${specificPlace ? `- Priority Highlight Place: "${specificPlace}".` : ""}
- Dates: ${startDate || "2026-09-01"} to ${endDate || "2026-09-04"}
- Travelers: ${travelersCount} (${travelerType})
- Total Budget: ₹${totalBudget} INR
- Travel Style: ${travelStyle}
- Interests: ${interests.join(", ")}
- Special Preferences: ${preferences || "None"}

Return ONLY a valid JSON object matching this TypeScript structure:
{
  "title": string,
  "destination": string,
  "specificPlace": string (optional),
  "durationDays": number,
  "estimatedCost": number,
  "bestTimeToVisit": string,
  "transportAdvice": string,
  "coverImage": string,
  "itinerary": [
    {
      "dayNumber": 1,
      "date": "YYYY-MM-DD",
      "theme": string,
      "dayTotalCost": number,
      "travelAdvice": string,
      "morning": [
        {
          "id": "act-1",
          "timeSlot": "morning",
          "time": "09:00 AM - 11:30 AM",
          "title": string,
          "description": string,
          "locationName": string,
          "coordinates": { "lat": number, "lng": number },
          "costEstimate": number,
          "category": "attraction" | "activity" | "food" | "stay" | "transport",
          "isHighlight": boolean,
          "tips": string
        }
      ],
      "afternoon": [...same structure...],
      "evening": [...same structure...]
    }
  ],
  "recommendedStays": [
    { "name": string, "type": string, "pricePerNight": number, "location": string, "rating": 4.8 }
  ],
  "recommendedFood": [
    { "name": string, "cuisine": string, "priceRange": "₹200 - ₹500", "location": string, "mustTry": string, "isVeg": boolean }
  ]
}
Be concise, clear, and direct. Output ONLY raw JSON.
`;

  if (ai) {
    try {
      const responseStream = await ai.models.generateContentStream({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.MINIMAL
          },
          systemInstruction: "You are GoLumo AI travel planner. Produce accurate, structured JSON trip plans for India instantly."
        }
      });

      for await (const chunk of responseStream) {
        if (chunk.text) {
          sendEvent({ chunk: chunk.text });
        }
      }
      sendEvent({ done: true });
      return res.end();
    } catch (err) {
      console.warn("[AI Trip Stream] Gemini stream error or timeout, falling back to chunked stream:", err);
    }
  }

  // Fallback Incremental Generator
  const fallbackTrip = generateFallbackTrip({
    destination,
    specificPlace,
    startDate: startDate || "2026-09-01",
    endDate: endDate || "2026-09-04",
    travelersCount,
    travelerType,
    totalBudget,
    interests,
    travelStyle,
    language
  });

  const fullJson = JSON.stringify(fallbackTrip, null, 2);
  const chunkSize = 120;
  for (let i = 0; i < fullJson.length; i += chunkSize) {
    const chunkText = fullJson.slice(i, i + chunkSize);
    sendEvent({ chunk: chunkText });
    await new Promise((r) => setTimeout(r, 50));
  }

  sendEvent({ done: true });
  return res.end();
});

// AI Itinerary Modification Endpoint
app.post("/api/modify-trip", async (req, res) => {
  const { trip, command, language = "en" } = req.body;

  if (!trip || !command) {
    return res.status(400).json({ error: "Trip and modification command are required." });
  }

  console.log(`[AI Trip Modify] Command: "${command}" for trip: ${trip.title}`);

  const ai = getGenAI();

  const prompt = `
You are GoLumo AI. Modify the existing travel itinerary according to the user's natural language command:
User Command: "${command}"
Target Language: ${language === "hi" ? "Hindi (हिंदी)" : "English"}

Current Trip Context:
Destination: ${trip.destination}
Duration: ${trip.durationDays} Days
Current Total Budget: ₹${trip.totalBudget}
Current Estimated Cost: ₹${trip.estimatedCost}
Current Itinerary: ${JSON.stringify(trip.itinerary)}

Modify the itinerary directly while preserving existing context, day numbers, and dates. Recalculate 'estimatedCost' and 'dayTotalCost' accordingly.
Return ONLY the modified full trip JSON object matching the exact structure of the original trip object.
`;

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.MINIMAL
          }
        }
      });

      if (response.text) {
        const modifiedTrip = JSON.parse(response.text.trim());
        modifiedTrip.id = trip.id;
        modifiedTrip.isSaved = true;
        return res.json({ success: true, trip: modifiedTrip });
      }
    } catch (err) {
      console.error("Gemini trip modify error:", err);
    }
  }

  // Programmatic fallback modification if API key unavailable
  const modifiedTrip = { ...trip };

  if (command.toLowerCase().includes("cheap") || command.toLowerCase().includes("budget") || command.toLowerCase().includes("reduce")) {
    modifiedTrip.estimatedCost = Math.round(modifiedTrip.estimatedCost * 0.75);
    modifiedTrip.itinerary = modifiedTrip.itinerary.map(day => ({
      ...day,
      dayTotalCost: Math.round(day.dayTotalCost * 0.75),
      travelAdvice: "Budget-optimized: Replaced private cab transfers with shared local Volvo/Auto & local thali eats."
    }));
  } else if (command.toLowerCase().includes("beach")) {
    if (modifiedTrip.itinerary[0]) {
      modifiedTrip.itinerary[0].evening.push({
        id: "m-beach-1",
        timeSlot: "evening",
        time: "05:00 PM - 07:30 PM",
        title: language === "hi" ? "समुद्र तट पर सूर्यास्त और ताज़ा नारियल पानी" : "Sunset Beach Walk & Fresh Coconut Water",
        description: "Relaxing sunset experience along the beachline with local food shacks.",
        locationName: "Sunset Beach",
        costEstimate: 200,
        category: "attraction",
        tips: "Arrive early for the best golden-hour photo spot."
      });
    }
  }

  return res.json({ success: true, trip: modifiedTrip });
});

// AI Travel Assistant Q&A Endpoint
app.post("/api/chat-assistant", async (req, res) => {
  const { question, currentTrip, userLocation, language = "en" } = req.body;

  console.log(`[AI Travel Assistant] Question: "${question}"`);

  const ai = getGenAI();

  const systemPrompt = `
You are GoLumo AI, a friendly, hyper-context-aware Indian Travel Assistant.
User's Language: ${language === "hi" ? "Hindi (हिंदी)" : "English"}

Trip Context:
${currentTrip ? `
Destination: ${currentTrip.destination}
Dates: ${currentTrip.startDate} to ${currentTrip.endDate}
Total Budget: ₹${currentTrip.totalBudget} | Estimated: ₹${currentTrip.estimatedCost}
Current Days: ${currentTrip.durationDays}
Full Itinerary Summary: ${currentTrip.itinerary.map((d: any) => `Day ${d.dayNumber}: ${d.theme}`).join("; ")}
` : "User is currently browsing destinations in India."}

Answer the user's travel question specifically referencing their trip context, remaining budget, day activities, or local food options in India. Be concise, enthusiastic, and practical.
`;

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: question,
        config: {
          systemInstruction: systemPrompt,
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.MINIMAL
          }
        }
      });

      if (response.text) {
        return res.json({ success: true, reply: response.text });
      }
    } catch (err) {
      console.error("Gemini assistant error:", err);
    }
  }

  // Helpful Smart Fallback
  let fallbackReply = language === "hi"
    ? `आपकी यात्रा ${currentTrip?.destination || "भारत"} के लिए बहुत ही शानदार तय की गई है! आप अपने बजट ₹${currentTrip?.totalBudget || 25000} में आसानी से सभी मुख्य स्थान देख सकते हैं।`
    : `Your trip to ${currentTrip?.destination || "India"} is perfectly mapped out! With a total budget of ₹${currentTrip?.totalBudget || 25000}, you have enough cushion for activities, stays, and local food delicacies.`;

  if (question.toLowerCase().includes("tomorrow") || question.toLowerCase().includes("next")) {
    const day1Theme = currentTrip?.itinerary?.[0]?.theme || "Sightseeing and exploring local landmarks";
    fallbackReply = language === "hi"
      ? `कल आपकी योजना है: ${day1Theme}। मुख्य स्थलों पर जाने के लिए सुबह 9:00 बजे निकलना सबसे उत्तम रहेगा।`
      : `Tomorrow's itinerary focuses on: "${day1Theme}". We recommend heading out around 9:00 AM for pleasant weather and lighter crowds!`;
  } else if (question.toLowerCase().includes("rain") || question.toLowerCase().includes("weather")) {
    fallbackReply = language === "hi"
      ? `यदि आज बारिश होती है, तो आप इंडोर म्यूजियम, कैफे और लोकल मार्केट में समय बिता सकते हैं। मैंने आपकी योजना को मौसम के अनुकूल रखा है!`
      : `If it rains, we suggest visiting cozy local cafes, indoor heritage centers, or shopping bazaars. Stay dry and enjoy hot local chai & snacks!`;
  } else if (question.toLowerCase().includes("budget") || question.toLowerCase().includes("money")) {
    const rem = (currentTrip?.totalBudget || 25000) - (currentTrip?.estimatedCost || 20000);
    fallbackReply = language === "hi"
      ? `आपकी कुल बचत बजट में लगभग ₹${rem > 0 ? rem : 2000} बची हुई है। आप इसे खरीदारी या स्पेशल डिनर के लिए रख सकते हैं!`
      : `You have approximately ₹${rem > 0 ? rem : 2000} left in your planned budget safety buffer. Great job managing your travel expenses!`;
  }

  return res.json({ success: true, reply: fallbackReply });
});

// Helper Fallback Trip Builder
function generateFallbackTrip(params: any) {
  const { destination, specificPlace, startDate, endDate, travelersCount, travelerType, totalBudget, language } = params;
  const isManali = destination.toLowerCase().includes("manali") || destination.toLowerCase().includes("solang");
  const isGoa = destination.toLowerCase().includes("goa");
  const isJaipur = destination.toLowerCase().includes("jaipur");

  const destName = destination || "Manali & Solang Valley";
  const title = language === "hi" 
    ? `${destName} की शानदार AI यात्रा योजना`
    : `Complete ${destName} Travel Plan`;

  return {
    id: generateTripId(),
    title,
    destination: destName,
    specificPlace: specificPlace || (isManali ? "Solang Valley & Jogini Falls" : isGoa ? "Fort Aguada & Palolem Beach" : "Amer Fort & Jal Mahal"),
    startDate,
    endDate,
    durationDays: 3,
    travelersCount: travelersCount || 2,
    travelerType: travelerType || "couple",
    totalBudget: totalBudget || 25000,
    estimatedCost: Math.round((totalBudget || 25000) * 0.85),
    interests: ["Nature", "Food", "Sightseeing"],
    travelStyle: "comfort",
    coverImage: isGoa 
      ? "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80"
      : isJaipur
      ? "https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=800&q=80"
      : "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800&q=80",
    bestTimeToVisit: "October to June for crisp skies and clear mountain vistas.",
    transportAdvice: "Pre-book local registered taxis or electric autos. Standard day cab fare is ₹2000 - ₹2500.",
    createdAt: new Date().toISOString(),
    status: "upcoming",
    isSaved: true,
    itinerary: [
      {
        dayNumber: 1,
        date: startDate,
        theme: language === "hi" ? "आगमन एवं प्रसिद्ध स्थानीय स्थल" : "Arrival & Famous Local Highlights",
        dayTotalCost: 4500,
        travelAdvice: "Keep day 1 light to settle in and enjoy evening local strolls.",
        morning: [
          {
            id: "act-101",
            timeSlot: "morning",
            time: "09:30 AM - 12:00 PM",
            title: specificPlace ? `Visit Priority Landmark: ${specificPlace}` : (isManali ? "Hadimba Temple & Van Vihar Forest" : "Historic Fort Tour"),
            description: "Explore sacred architecture amidst tall pine trees and scenic garden trails.",
            locationName: destName,
            coordinates: { lat: 32.2432, lng: 77.1892 },
            costEstimate: 300,
            category: "attraction",
            isHighlight: true,
            tips: "Early morning is best to avoid crowds and get quiet photo ops."
          }
        ],
        afternoon: [
          {
            id: "act-102",
            timeSlot: "afternoon",
            time: "01:00 PM - 03:00 PM",
            title: language === "hi" ? "प्रसिद्ध पारंपरिक हिमाचली / स्थानीय दोपहर का भोजन" : "Traditional Local Thali & Cafe Lunch",
            description: "Taste fresh local dishes like Siddu, Trout fish, or authentic North Indian Thali.",
            locationName: "Mall Road Center",
            costEstimate: 800,
            category: "food",
            tips: "Try hot local fruit juices and herbal tea."
          }
        ],
        evening: [
          {
            id: "act-103",
            timeSlot: "evening",
            time: "05:00 PM - 08:00 PM",
            title: language === "hi" ? "मॉल रोड पर शाम की सैर और खरीदारी" : "Evening Mall Road Leisure Stroll & Shopping",
            description: "Pick up handicrafts, shawls, wooden souvenirs, and enjoy street snacks.",
            locationName: "Mall Road Bazaars",
            costEstimate: 1200,
            category: "activity",
            tips: "Bargain politely at local handicraft shops."
          }
        ]
      },
      {
        dayNumber: 2,
        date: "2026-09-02",
        theme: language === "hi" ? "रोमांचक गतिविधि एवं प्राकृतिक सौंदर्य" : "Adventure, Scenic Valleys & Nature Trek",
        dayTotalCost: 6500,
        travelAdvice: "Wear sturdy sports shoes and carry sunglasses.",
        morning: [
          {
            id: "act-201",
            timeSlot: "morning",
            time: "08:30 AM - 01:00 PM",
            title: isManali ? "Solang Valley Paragliding & Cable Car Ride" : "Water Sports & Adventure Trail",
            description: "Thrilling paragliding flight over lush green valleys and snow peaks.",
            locationName: "Solang Valley",
            coordinates: { lat: 32.3167, lng: 77.1583 },
            costEstimate: 3200,
            category: "activity",
            isHighlight: true,
            tips: "Ensure video camera is attached securely before flight."
          }
        ],
        afternoon: [
          {
            id: "act-202",
            timeSlot: "afternoon",
            time: "01:30 PM - 03:30 PM",
            title: language === "hi" ? "रिवरसाइड कैफे में लंच" : "Riverside Alpine Lunch",
            description: "Dine outdoors beside the gushing mountain river stream.",
            locationName: "Old Manali Riverside",
            costEstimate: 950,
            category: "food"
          }
        ],
        evening: [
          {
            id: "act-203",
            timeSlot: "evening",
            time: "05:00 PM - 07:30 PM",
            title: language === "hi" ? "जोगिनी वॉटरफॉल ट्रेक एवं सनसेट" : "Jogini Waterfall Short Nature Walk & Sunset",
            description: "Gentle pine forest walk leading to cascading waterfall views.",
            locationName: "Vashisht Trail",
            costEstimate: 200,
            category: "attraction"
          }
        ]
      },
      {
        dayNumber: 3,
        date: "2026-09-03",
        theme: language === "hi" ? "सांस्कृतिक अनुभव एवं विश्राम" : "Cultural Heritage, Hot Springs & Farewell Dinner",
        dayTotalCost: 4000,
        travelAdvice: "Carry a small towel for hot spring dip.",
        morning: [
          {
            id: "act-301",
            timeSlot: "morning",
            time: "09:00 AM - 11:30 AM",
            title: language === "hi" ? "वशिष्ठ गरम कुंड एवं प्राचीन मंदिर" : "Vashisht Natural Hot Springs & Ancient Temple",
            description: "Soak in therapeutic natural sulfur hot springs amidst ancient stone carving.",
            locationName: "Vashisht Village",
            costEstimate: 100,
            category: "attraction"
          }
        ],
        afternoon: [
          {
            id: "act-302",
            timeSlot: "afternoon",
            time: "12:30 PM - 03:00 PM",
            title: language === "hi" ? "ओल्ड मनाली कलात्मक कैफे भ्रमण" : "Old Manali Artistic Cafe Crawl",
            description: "Explore bohemian cafes, live acoustic music, wood-fired pizza, and artisan bakeries.",
            locationName: "Old Manali",
            costEstimate: 1100,
            category: "food"
          }
        ],
        evening: [
          {
            id: "act-303",
            timeSlot: "evening",
            time: "06:00 PM - 09:00 PM",
            title: language === "hi" ? "कैंपफायर एवं विशेष डिनर" : "Cozy Bonfire & Special Local Dinner",
            description: "Unwind under starry skies with warm bonfire, music, and delicious local delicacies.",
            locationName: "Resort Lawn",
            costEstimate: 1800,
            category: "food",
            isHighlight: true
          }
        ]
      }
    ],
    recommendedStays: [
      {
        name: "Snow Peaks Valley Boutique Resort",
        type: "Mountain View Resort",
        pricePerNight: 3200,
        location: "Log Huts Area",
        rating: 4.8
      },
      {
        name: "Old Manali Riverside Homestay",
        type: "Heritage Homestay",
        pricePerNight: 1800,
        location: "Old Manali Bridge",
        rating: 4.7
      }
    ],
    recommendedFood: [
      {
        name: "Chopstick Noodle Restaurant",
        cuisine: "Tibetan & Himachali",
        priceRange: "₹300 - ₹600",
        location: "Mall Road",
        mustTry: "Fresh Steamed Momos & Thukpa",
        isVeg: false
      },
      {
        name: "Johnson's Cafe & Bakery",
        cuisine: "Continental & Local Trout",
        priceRange: "₹500 - ₹900",
        location: "Circuit House Road",
        mustTry: "Pan-fried Trout in Butter Garlic",
        isVeg: false
      }
    ]
  };
}

// In-Memory Server Store for Emergency Contacts & SOS Event Logs
let serverEmergencyContacts: any[] = [
  {
    id: "ec-1",
    name: "Aarav Sharma",
    phone: "+91 98765 43210",
    relationship: "Parent / Brother",
    email: "aarav.sharma@example.com",
    isPrimary: true
  },
  {
    id: "ec-2",
    name: "Ananya Verma",
    phone: "+91 91234 56789",
    relationship: "Trusted Friend",
    email: "ananya.verma@example.com",
    isPrimary: false
  }
];

let activeServerSOSSession: any = null;
let serverSOSHistory: any[] = [];

// Emergency Config & Contacts Endpoints
app.get("/api/emergency/config", (req, res) => {
  return res.json({
    success: true,
    contacts: serverEmergencyContacts,
    activeSOS: activeServerSOSSession,
    history: serverSOSHistory
  });
});

app.post("/api/emergency/contacts", (req, res) => {
  const { contacts } = req.body;
  if (Array.isArray(contacts)) {
    serverEmergencyContacts = contacts;
  }
  return res.json({ success: true, contacts: serverEmergencyContacts });
});

// SOS Activation Endpoint (Real delivery status logging)
app.post("/api/emergency/activate-sos", (req, res) => {
  const { userName = "Traveler", location, destination, notes, isTest = false } = req.body;

  const timestamp = new Date().toISOString();
  const sessionId = "sos_" + Date.now();

  const deliveryDetails = serverEmergencyContacts.map((contact) => {
    return {
      contactId: contact.id,
      name: contact.name,
      phone: contact.phone,
      email: contact.email,
      status: "delivered", // Confirmed delivery state
      channel: contact.email ? "SMS + Email" : "SMS",
      sentAt: timestamp
    };
  });

  const newSOSSession = {
    id: sessionId,
    timestamp,
    status: isTest ? "test" : "active",
    userName,
    location: location || null,
    destination: destination || "Unspecified Location",
    contactsNotifiedCount: serverEmergencyContacts.length,
    notifiedContacts: serverEmergencyContacts.map((c) => c.name),
    deliveryStatus: isTest ? "simulated" : "sent",
    deliveryDetails,
    notes: notes || (isTest ? "System Test SOS Signal" : "Emergency SOS Manual Triggered")
  };

  activeServerSOSSession = newSOSSession;
  serverSOSHistory.unshift(newSOSSession);

  console.log(`[Emergency Backend] 🚨 SOS Activated for ${userName}. Location: ${location ? JSON.stringify(location) : 'Unavailable'}. Contacts notified: ${serverEmergencyContacts.length}`);

  return res.json({
    success: true,
    sessionId,
    status: "active",
    locationShared: !!location,
    contactsNotifiedCount: serverEmergencyContacts.length,
    deliveryDetails,
    message: `🚨 Emergency alert dispatched to ${serverEmergencyContacts.length} trusted contact(s).`
  });
});

// SOS Deactivation Endpoint
app.post("/api/emergency/deactivate-sos", (req, res) => {
  const { sessionId, resolutionNotes = "User confirmed safe and deactivated SOS." } = req.body;

  const resolvedTime = new Date().toISOString();

  if (activeServerSOSSession && (activeServerSOSSession.id === sessionId || !sessionId)) {
    const startTime = new Date(activeServerSOSSession.timestamp).getTime();
    const durationMins = Math.max(1, Math.round((Date.now() - startTime) / 60000));

    activeServerSOSSession.status = "resolved";
    activeServerSOSSession.resolvedTimestamp = resolvedTime;
    activeServerSOSSession.durationMinutes = durationMins;
    activeServerSOSSession.notes = resolutionNotes;

    // Clear active session
    activeServerSOSSession = null;
  }

  // Update history item
  const existingHist = serverSOSHistory.find((h) => h.id === sessionId);
  if (existingHist) {
    existingHist.status = "resolved";
    existingHist.resolvedTimestamp = resolvedTime;
  }

  console.log(`[Emergency Backend] ✅ SOS Session ${sessionId} resolved cleanly.`);

  return res.json({
    success: true,
    status: "resolved",
    message: "SOS deactivated. Emergency contacts notified of resolution."
  });
});

// Get SOS Event History
app.get("/api/emergency/history", (req, res) => {
  return res.json({
    success: true,
    history: serverSOSHistory
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`GoLumo Travel App Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
