# GoLumo — Merged App (Onboarding + Sign in + Home)

Teeno alag Google AI Studio apps ek single app me merge kar diye gaye hain:

1. **Onboarding** → 3-slide "Get Started" intro (`public/onboarding.html`, iframe se load hota hai)
2. **Sign in** → Phone + OTP login aur Google login (`src/components/auth/`)
3. **GoLumo main app** → Trip planner, AI assistant, maps, weather, SOS, profile (`src/HomeApp.tsx` + `server.ts`)

## App Flow

```
First open (ya logout ke baad)
        │
        ▼
  Onboarding slides ──"Get Started"/"Skip"──▶ Sign in / Sign up (Phone-OTP ya Google)
                                                        │
                                                        ▼
                                                   Home (GoLumo app)
                                                        │
                                                     Logout
                                                        │
                                                        ▼
                                            Wapas Onboarding slides pe
```

## Status: kya real hai, kya abhi bhi demo hai

| Feature | Status | Chahiye |
|---|---|---|
| AI Trip Generator / Chat / Modify Trip | ✅ **Real** | `GEMINI_API_KEY` (already given) |
| Weather (home banner + modal) | ✅ **Real** | `WEATHER_API_KEY` — OpenWeatherMap (already given) |
| Phone OTP login | ✅ **Real** (Supabase Auth) | `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (already given) + **Twilio connect karna baaki hai Supabase dashboard me**, warna OTP SMS nahi jaayega |
| Google login | ✅ **Real code hai**, but | Supabase dashboard me Google provider **on karna baaki hai** (Client ID/Secret chahiye) |
| Trips + Profile storage | ✅ **Real** (Supabase Postgres, localStorage se sync) | Same Supabase keys — bas ek baar `supabase-schema.sql` run karna hai |
| Maps | ✅ Already real (free Leaflet + OpenStreetMap) | Kuch nahi |
| Nearby Places | ✅ **Real** (Geoapify Places + Geocoding) | `GEOAPIFY_GEOCODING_API_KEY` + `GEOAPIFY_PLACES_API_KEY` (already given) |
| Emergency SOS alert | ❌ Abhi bhi simulated, real SMS/call nahi jaata | Twilio account + phone number (agar chahiye to bolna) |

## Setup Steps

**Prerequisites:** Node.js installed hona chahiye.

1. Dependencies install karo:
   ```
   npm install
   ```
2. `.env.example` ko `.env.local` me copy karo aur apni keys daalo:
   ```
   GEMINI_API_KEY="your_gemini_key"
   WEATHER_API_KEY="your_openweathermap_key"
   VITE_SUPABASE_URL="https://your-project.supabase.co"
   VITE_SUPABASE_ANON_KEY="your_supabase_anon_key"
   ```
3. **Supabase database setup (ek hi baar karna hai):**
   - Supabase Dashboard → SQL Editor khol kar `supabase-schema.sql` file ka poora content paste karo aur Run karo. Yeh do table banayega: `profiles` aur `trips`, dono me Row Level Security on rahegi (har user sirf apna data dekh/edit kar sakta hai).
4. **Phone OTP kaam karne ke liye:** Supabase Dashboard → Authentication → Providers → Phone → Twilio connect karo (Account SID, Auth Token, aur ek Twilio phone number chahiye). Tab tak phone OTP request pe error dikhega ("SMS provider not set up yet").
5. **Google login kaam karne ke liye:** Supabase Dashboard → Authentication → Providers → Google → on karo, Google Cloud Console se OAuth Client ID + Secret daalo, aur redirect URL Supabase khud de dega jo Google Console me daalni hogi.
6. App run karo:
   ```
   npm run dev
   ```
7. Production build:
   ```
   npm run build
   npm run start
   ```

## Demo Mode (agar Supabase keys nahi bhi dogey)

Agar `.env.local` me `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` khali chodoge, app automatically **demo mode** me chalega — phone OTP locally generate hoga (screen pe kahin nahi dikhega ab, but verify kaam karega kyunki compare demo-mode me hi hota hai), aur Google button ek fake demo account se seedha login kar dega. Isse aap Twilio/Google OAuth setup complete kiye bina bhi poori app test kar sakte ho.

## Android APK / Play Store banane ke steps

App ka backend (Gemini, Weather, Nearby, Auth) ek real server pe chalna zaroori hai — APK ke andar chalna secure nahi hota (keys expose ho jaayengi). Isliye 2 phase:

### Phase 1: App ko live/deploy karo (ek baar)

1. Is project ko GitHub pe push karo (naya repo banao, code push karo).
2. **[Render.com](https://render.com)** pe free account banao (ya Railway.app — dono Node.js backend host kar sakte hain, Vercel/Netlify nahi kyunki woh sirf static/serverless hai, yeh app ek persistent Express server hai).
3. Render pe "New Web Service" → apna GitHub repo connect karo:
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run start`
4. Render dashboard → Environment tab me sab keys daalo (`GEMINI_API_KEY`, `WEATHER_API_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `GEOAPIFY_GEOCODING_API_KEY`, `GEOAPIFY_PLACES_API_KEY`).
5. Deploy hone ke baad ek URL milega, jaise `https://golumo.onrender.com` — yeh URL save kar lo.

### Phase 2: Android APK banao (Capacitor se)

Yeh steps apne local computer pe karni hain (is chat me nahi, kyunki Android Studio chahiye):

1. **Android Studio install karo** (free): https://developer.android.com/studio
2. Project folder me jaake:
   ```
   npm install
   ```
3. `capacitor.config.ts` file kholo, `server.url` me apna Phase-1 wala real deployed URL daal do (abhi placeholder hai).
4. Android project generate karo:
   ```
   npx cap add android
   npx cap sync android
   npx cap open android
   ```
   Yeh Android Studio khol dega apne aap.
5. Android Studio me: **Build → Generate Signed Bundle / APK** → APK/AAB choose karo → naya keystore banao (yeh file safe rakhna, dobara chahiye hogi updates ke liye) → Build.
6. Ban gaya APK apne phone pe install karke test karo (USB se ya file bhej ke).

### Play Store pe daalne ke liye

1. [Google Play Console](https://play.google.com/console) pe developer account banao (**$25 one-time fee**).
2. "Create App" → naam, category, screenshots, description, privacy policy URL (zaroori hai — ek simple privacy policy page banani padegi).
3. Signed **AAB** file (APK nahi, AAB chahiye Play Store ke liye — same Generate Signed Bundle step me AAB option choose karna) upload karo.
4. Content rating questionnaire fill karo, submit for review — Google 1-7 din me review karta hai.

### Chhota tip
Testing ke liye Play Store ka wait mat karo — Phase 2 wala APK seedha kisi bhi Android phone pe "Install from unknown sources" on karke install ho jaata hai, review ki zaroorat nahi.

## Important Notes

- `GEOAPIFY_ROUTING_API_KEY` di gayi hai but abhi code me use nahi ki — yeh future me trip map pe real turn-by-turn route line dikhane ke liye reserve rakhi hai. Chaho to bata dena, wire kar dunga.
- **API keys kabhi bhi chat/message me paste mat karna** — sirf `.env.local` file me. Yeh file `.gitignore` me already hai, GitHub pe accidentally upload nahi hogi.
- Trips aur Profile ab localStorage (fast local cache) + Supabase (real database) dono me save hote hain — agar Supabase keys nahi di, sirf localStorage use hoga jaisa pehle tha.
- Logout karne pe dono clear ho jaate hain (Supabase session + onboarding flag) — wapas onboarding se shuru hota hai.
