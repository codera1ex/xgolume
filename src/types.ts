export type Language = 'en' | 'hi';

export type TravelerType = 'solo' | 'couple' | 'family' | 'friends';

export type TravelStyle = 'budget' | 'comfort' | 'luxury' | 'adventure' | 'cultural' | 'relaxed';

export type ActivityCategory = 'attraction' | 'activity' | 'food' | 'stay' | 'transport';

export interface ItineraryActivity {
  id: string;
  timeSlot: 'morning' | 'afternoon' | 'evening';
  time: string;
  title: string;
  description: string;
  locationName: string;
  coordinates?: { lat: number; lng: number };
  costEstimate: number;
  category: ActivityCategory;
  isHighlight?: boolean;
  tips?: string;
}

export interface DayPlan {
  dayNumber: number;
  date: string;
  theme: string;
  morning: ItineraryActivity[];
  afternoon: ItineraryActivity[];
  evening: ItineraryActivity[];
  dayTotalCost: number;
  travelAdvice?: string;
}

export interface RecommendedStay {
  name: string;
  type: string;
  pricePerNight: number;
  location: string;
  rating: number;
  image?: string;
}

export interface RecommendedFoodItem {
  name: string;
  cuisine: string;
  priceRange: string;
  location: string;
  mustTry: string;
  isVeg?: boolean;
}

export interface Trip {
  id: string;
  title: string;
  destination: string;
  isFallback?: boolean;
  specificPlace?: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  travelersCount: number;
  travelerType: TravelerType;
  totalBudget: number;
  estimatedCost: number;
  interests: string[];
  travelStyle: TravelStyle;
  preferences?: string;
  coverImage: string;
  itinerary: DayPlan[];
  recommendedStays: RecommendedStay[];
  recommendedFood: RecommendedFoodItem[];
  transportAdvice: string;
  bestTimeToVisit: string;
  createdAt: string;
  status: 'upcoming' | 'active' | 'completed';
  isSaved: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  preferredLanguage: Language;
  travelStyle: TravelStyle;
  interests: string[];
  budgetPreference: 'budget' | 'moderate' | 'luxury';
  foodPreference: 'veg' | 'non-veg' | 'jain' | 'vegan' | 'anything';
  accommodationPreference: 'hostel' | 'hotel' | 'resort' | 'homestay';
  homeCity: string;
  notificationsEnabled: boolean;
  weatherAlertsEnabled: boolean;
}

export interface WeatherDayForecast {
  date: string;
  tempMax: number;
  tempMin: number;
  condition: string;
  rainProb: number;
}

export interface WeatherInfo {
  city: string;
  temp: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  icon: string;
  forecast: WeatherDayForecast[];
  isRainyToday: boolean;
  alertMessage?: string;
}

export interface LiveNearbyItem {
  id: string;
  name: string;
  category: 'activity' | 'food' | 'attraction' | 'stay';
  subCategory: string;
  rating: number;
  distanceKm: number;
  priceEstimate: number;
  address: string;
  coordinates: { lat: number; lng: number };
  description: string;
  image: string;
  tags: string[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  suggestedActions?: { label: string; actionPrompt: string }[];
}

export interface DestinationCardData {
  id: string;
  name: string;
  state: string;
  image: string;
  tagline: string;
  description: string;
  popularActivities: string[];
  bestMonths: string;
  avgDailyBudget: number;
  rating: number;
  category: 'hiking' | 'climbing' | 'beach' | 'culture' | 'backwaters' | 'wildlife' | 'heritage' | 'camping';
  coordinates: { lat: number; lng: number };
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  email?: string;
  isPrimary: boolean;
}

export interface EmergencySettings {
  sosEnabled: boolean;
  autoShareLocation: boolean;
  checkInEscalationEnabled: boolean;
  testModeEnabled: boolean;
  preferredCountry: 'IN' | 'US' | 'GB' | 'AU' | 'OTHER';
}

export interface SOSHistoryEvent {
  id: string;
  timestamp: string;
  resolvedTimestamp?: string;
  status: 'active' | 'resolved' | 'cancelled' | 'test';
  location?: { lat: number; lng: number; address?: string };
  destination?: string;
  durationMinutes?: number;
  contactsNotifiedCount: number;
  notifiedContacts: string[];
  deliveryStatus: 'sent' | 'delivered' | 'failed' | 'simulated';
  notes?: string;
}

export interface SafetyCheckInState {
  id: string;
  scheduledTime: string;
  durationMinutes: number;
  status: 'pending' | 'confirmed_safe' | 'escalated' | 'cancelled';
  escalatedContactName?: string;
  createdAt: string;
}

export interface EmergencyServicesNumbers {
  country: string;
  police: string;
  ambulance: string;
  fire: string;
  touristHelpline?: string;
  womenHelpline?: string;
  general: string;
}

