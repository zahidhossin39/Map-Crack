# Map Crack

An interactive, high-performance web application inspired by [pindrop.host](https://pindrop.host/) that allows users to drop a pin anywhere on the map, scan nearby local businesses in real-time, and crack open **opportunities** (local businesses that have no website listed) for outreach, lead generation, and web design prospecting.

---

## Features

- 📍 **Interactive Pin Dropping & Radius Control**: Click anywhere on the map or search an address with autocomplete to drop a pin. Adjust radius (250m to 5km) with a live visual circle overlay.
- ⚡ **Live Places API (New) Integration**: Uses modern `Place.searchNearby` and `AdvancedMarkerElement` to query live local businesses and fetch ratings, reviews, opening hours, contact details, and photos.
- 🚀 **Opportunity Detection**: Highlights businesses lacking a website with attention-grabbing glowing markers, badges, and prioritized sorting.
- 📊 **Prospecting Intel & Export**: Provides real-time metrics on opportunity density, with instant **CSV Export** and **Copy to Clipboard** formatted prospect summaries.
- 📱 **Mobile-First & One-Handed Usability**: Desktop glassmorphic sidebar and responsive swipeable mobile bottom sheet for on-the-go prospecting.
- 🎨 **Sleek Light & Dark Themes**: Custom-styled Google Map views with fluid animations and rich glassmorphism.

---

## Tech Stack

- **Framework**: Next.js 14+ (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS, Glassmorphism, Lucide Icons
- **Maps SDK**: `@vis.gl/react-google-maps` (Official Google Maps React Library)
- **APIs**: Maps JavaScript API, Places API (New), Geocoding API

---

## Environment Setup

1. Copy the example environment file:
   ```bash
   cp .env.local.example .env.local
   ```
2. Open `.env.local` and add your Google Maps Platform API key:
   ```env
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
   NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID=DEMO_MAP_ID
   ```

### Google Cloud Requirements

Ensure the following APIs are enabled in your [Google Cloud Console](https://console.cloud.google.com/google/maps-apis/overview):
1. **Maps JavaScript API**
2. **Places API (New)**
3. **Geocoding API** *(optional, for address resolution on pin clicks)*

> [!TIP]
> **API Key Security (Production)**:
> In Google Cloud Console, restrict your API key to **HTTP referrers (websites)** (e.g. `https://yourdomain.com/*` or `http://localhost:3000/*` for local testing) and restrict API access to only the enabled Maps & Places APIs.

---

## Running Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Compliance & Legal Notice

- **Cost Notice**: Usage of Google Maps Platform products and services may incur costs against your Google Cloud project billing account. Prototyping can be performed using Google's Maps Demo Key.
- **Attribution**: All place details and map services are powered by and legally attributed to **Google Maps**.
