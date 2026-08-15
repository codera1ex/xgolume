import { DestinationCardData, Trip, UserProfile } from "../types";

export const INITIAL_USER_PROFILE: UserProfile = {
  id: "usr_101",
  name: "Aarav Sharma",
  email: "aarav.travels@golumo.app",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
  preferredLanguage: "en",
  travelStyle: "comfort",
  interests: ["Hiking", "Heritage", "Food", "Photography"],
  budgetPreference: "moderate",
  foodPreference: "veg",
  accommodationPreference: "hotel",
  homeCity: "New Delhi",
  notificationsEnabled: true,
  weatherAlertsEnabled: true
};

export const INITIAL_TRIPS: Trip[] = [
  {
    id: "trip_demo_1",
    title: "Manali & Solang Valley High Peak Adventure",
    destination: "Manali, Himachal Pradesh",
    specificPlace: "Solang Valley & Rohtang Pass",
    startDate: "2026-09-10",
    endDate: "2026-09-13",
    durationDays: 4,
    travelersCount: 2,
    travelerType: "couple",
    totalBudget: 28000,
    estimatedCost: 23500,
    interests: ["Hiking", "Paragliding", "Local Food", "Nature Walk"],
    travelStyle: "comfort",
    preferences: "Vegetarian food only, comfortable hotel with balcony view",
    coverImage: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800&q=80",
    bestTimeToVisit: "October to June for crisp Himalayan mountain views",
    transportAdvice: "Book registered local cabs for Rohtang permit pass. Shared Volvo bus from Delhi to Manali recommended.",
    createdAt: "2026-08-10T10:00:00Z",
    status: "upcoming",
    isSaved: true,
    recommendedStays: [
      {
        name: "Snow Peaks Alpine Resort",
        type: "4-Star Mountain View Hotel",
        pricePerNight: 3500,
        location: "Log Huts Area, Manali",
        rating: 4.8
      },
      {
        name: "Old Manali Riverside Heritage Homestay",
        type: "Cozy Wooden Cottage",
        pricePerNight: 2200,
        location: "Old Manali Village",
        rating: 4.7
      }
    ],
    recommendedFood: [
      {
        name: "Chopstick Noodle Restaurant",
        cuisine: "Tibetan & Himachali Veg Delicacies",
        priceRange: "₹300 - ₹500",
        location: "Mall Road",
        mustTry: "Veg Steamed Momos & Thukpa",
        isVeg: true
      },
      {
        name: "Dylan's Toasted Roast Coffee House",
        cuisine: "Cafe & Fresh Bakery",
        priceRange: "₹200 - ₹400",
        location: "Old Manali",
        mustTry: "Hot Chocolate Fudge & Filter Coffee",
        isVeg: true
      }
    ],
    itinerary: [
      {
        dayNumber: 1,
        date: "2026-09-10",
        theme: "Arrival, Mall Road Stroll & Ancient Temples",
        dayTotalCost: 4200,
        travelAdvice: "Settle into your hotel, unpack, and enjoy relaxed evening walk.",
        morning: [
          {
            id: "d1-m1",
            timeSlot: "morning",
            time: "10:00 AM - 12:30 PM",
            title: "Hadimba Devi Temple & Cedar Pine Forest",
            description: "Visit the 16th-century wooden temple tucked inside towering Dhungri Deodar forests.",
            locationName: "Dhungri Van Vihar, Manali",
            coordinates: { lat: 32.2483, lng: 77.1802 },
            costEstimate: 200,
            category: "attraction",
            isHighlight: true,
            tips: "Hire local traditional Himachali attire for memorable photos."
          }
        ],
        afternoon: [
          {
            id: "d1-a1",
            timeSlot: "afternoon",
            time: "01:30 PM - 03:00 PM",
            title: "Traditional Himachali Lunch at Mall Road",
            description: "Taste authentic Siddu (steamed stuffed wheat bread) with ghee and mint chutney.",
            locationName: "Mall Road Center",
            costEstimate: 600,
            category: "food"
          }
        ],
        evening: [
          {
            id: "d1-e1",
            timeSlot: "evening",
            time: "05:00 PM - 08:00 PM",
            title: "Mall Road Shopping & Sunset Point Walk",
            description: "Stroll along bustling pedestrian walkways, pick up wooden handicrafts and woolen shawls.",
            locationName: "Mall Road",
            costEstimate: 1200,
            category: "activity"
          }
        ]
      },
      {
        dayNumber: 2,
        date: "2026-09-11",
        theme: "Solang Valley Paragliding & Adventure Sports",
        dayTotalCost: 7800,
        travelAdvice: "Start early by 8:30 AM to beat traffic along Solang Highway.",
        morning: [
          {
            id: "d2-m1",
            timeSlot: "morning",
            time: "08:30 AM - 01:00 PM",
            title: "Solang Valley Paragliding & Cable Car Ride",
            description: "Fly tandem over alpine valley glades with panoramic views of snow-capped peaks.",
            locationName: "Solang Valley",
            coordinates: { lat: 32.3167, lng: 77.1583 },
            costEstimate: 3500,
            category: "activity",
            isHighlight: true,
            tips: "Includes HD Go-Pro video recording from pilot."
          }
        ],
        afternoon: [
          {
            id: "d2-a1",
            timeSlot: "afternoon",
            time: "01:30 PM - 03:30 PM",
            title: "Riverside Bistro Lunch",
            description: "Wood-fired stone oven pizzas and fresh fruit juices right next to Beas River stream.",
            locationName: "Old Manali Riverside",
            costEstimate: 900,
            category: "food"
          }
        ],
        evening: [
          {
            id: "d2-e1",
            timeSlot: "evening",
            time: "05:00 PM - 07:30 PM",
            title: "Jogini Waterfall Pine Forest Nature Walk",
            description: "Trek through quiet apple orchards and pine groves up to cascading Jogini waterfalls.",
            locationName: "Vashisht Village Trail",
            coordinates: { lat: 32.2612, lng: 77.1982 },
            costEstimate: 150,
            category: "attraction"
          }
        ]
      },
      {
        dayNumber: 3,
        date: "2026-09-12",
        theme: "Natural Hot Springs & Old Manali Cafe Crawl",
        dayTotalCost: 3800,
        travelAdvice: "Relaxed schedule to soak in mountain vibes and live music.",
        morning: [
          {
            id: "d3-m1",
            timeSlot: "morning",
            time: "09:30 AM - 12:00 PM",
            title: "Vashisht Sulfur Hot Springs & Temple",
            description: "Experience natural hot spring mineral baths revered for medicinal properties.",
            locationName: "Vashisht Village",
            costEstimate: 100,
            category: "attraction"
          }
        ],
        afternoon: [
          {
            id: "d3-a1",
            timeSlot: "afternoon",
            time: "01:00 PM - 03:30 PM",
            title: "Old Manali Bohemian Cafe Crawl",
            description: "Listen to acoustic guitarists while enjoying fresh baked pies and herbal mountain teas.",
            locationName: "Old Manali Lanes",
            costEstimate: 800,
            category: "food"
          }
        ],
        evening: [
          {
            id: "d3-e1",
            timeSlot: "evening",
            time: "06:00 PM - 09:00 PM",
            title: "Private Resort Bonfire & Cultural Evening",
            description: "Stargazing beside warm open bonfire with traditional Himachali folk music.",
            locationName: "Resort Courtyard",
            costEstimate: 1500,
            category: "activity",
            isHighlight: true
          }
        ]
      }
    ]
  }
];

export const CATEGORY_FILTERS = [
  { id: "all", labelEn: "All Places", labelHi: "सभी स्थान", icon: "Compass" },
  { id: "hiking", labelEn: "Hiking", labelHi: "हाइकिंग", icon: "Footprints" },
  { id: "climbing", labelEn: "Climbing", labelHi: "पहाड़ चढ़ाई", icon: "Mountain" },
  { id: "beach", labelEn: "Beaches", labelHi: "समुद्र तट", icon: "Sun" },
  { id: "culture", labelEn: "Culture", labelHi: "संस्कृति", icon: "Sparkles" },
  { id: "backwaters", labelEn: "Backwaters", labelHi: "बैकवाटर्स", icon: "Waves" },
  { id: "wildlife", labelEn: "Wildlife", labelHi: "वन्यजीव", icon: "Trees" },
  { id: "heritage", labelEn: "Heritage Forts", labelHi: "शाही किले", icon: "Castle" },
  { id: "camping", labelEn: "Camping", labelHi: "कैंपिंग", icon: "Tent" }
];
