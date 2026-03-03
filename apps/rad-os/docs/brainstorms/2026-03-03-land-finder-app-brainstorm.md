# Land Finder App Brainstorm

**Date:** 2026-03-03
**Status:** Decided

## What We're Building

A RadOS desktop app ("Land Finder") that displays San Diego county tax auction properties on a split-view map + list. The initial dataset is 160 properties (81 improved + 79 unimproved land) from a March 2026 county auction XLS. Users can filter by value/bid to find deals, and click through to Zillow/Redfin for photos and comps. Long-term this becomes a "Rad Land Finder" for a land fund — scanning multiple auction sites across the internet.

## Why This Approach

**Pre-processed static data with client-side Mapbox GL.**

160 properties is trivially small — no need for server-side filtering, pagination, or API routes. A one-time Node script converts the XLS to geocoded JSON. The app imports that JSON and does all filtering/sorting client-side. This is the simplest architecture that delivers the full experience (map pins, list view, filtering, external links).

When the land fund grows to scan multiple auction sites, we evolve the prep script into an ingestion pipeline and swap the static import for an API route. The app component stays identical.

## Key Decisions

- **Map provider:** Mapbox GL via `react-map-gl` (user will provide API key)
- **Geocoding:** Mapbox Geocoding API, run as a one-time prep script, results cached in JSON
- **Data scope:** Land + Improved properties only (filter out 555 timeshares), but keep them in the JSON with a type field for optional viewing
- **Layout:** Split view — map left, scrollable property list right, synced selection
- **Property images:** External links to Zillow/Redfin (generated from address), not embedded
- **State management:** Local `useState` for UI state (filters, selection, hover). No Zustand slice needed for v1 — 160 items don't need global state
- **Window size:** `{ width: 900, height: 600 }` — needs horizontal space for split view

## App Features (v1)

### Split View
- **Left panel:** Mapbox GL map with colored pins (green=land, blue=improved, gray=canceled/redeemed)
- **Right panel:** Scrollable property list with compact cards
- **Synced:** Click a pin → scroll to and highlight the card. Click a card → fly to pin on map.

### Filtering & Sorting
- Filter by: Auction Type (land/improved), City, Status (active/withdrawn/redeemed)
- Sort by: Opening Bid (asc/desc), Total Assessed Value, Land Value
- Search by: Address or APN text search
- "Deal score" indicator: ratio of Opening Bid to Total Assessed Value (lower = better deal)

### Property Card
- Address, City, Zip
- Auction Type badge (Land / Improved)
- Opening Bid (prominent)
- Assessed Value + Deal score
- Status badge (Active / Withdrawn / Redeemed)
- External links: Zillow, Redfin, Google Maps

### Map Features
- Clustered pins at zoom-out levels
- Color-coded by auction type
- Popup on hover with address + opening bid
- Fly-to animation on card click

## Data Pipeline

```
XLS file
  → scripts/parse-auction-data.ts (Node script)
    → Mapbox Geocoding API (batch, ~160 calls)
      → lib/mockData/auction-properties.json
        → LandFinderApp imports directly
```

### JSON Shape

```typescript
interface AuctionProperty {
  id: string;           // from ID# column
  apn: string;          // Assessor's Parcel Number
  address: string;      // full street address
  city: string;
  zip: string;
  auctionType: 'improved' | 'unimproved';
  landValue: number;
  improvements: number;
  totalAssessedValue: number;
  openingBid: number;
  status: 'active' | 'withdrawn' | 'redeemed';
  description: string;  // legal description
  coordinates: {
    lat: number;
    lng: number;
  } | null;             // null if geocoding failed
  dealScore: number;    // openingBid / totalAssessedValue (lower = better)
  externalLinks: {
    zillow: string;     // https://www.zillow.com/homes/{encoded-address}_rb/
    redfin: string;     // https://www.redfin.com/search?q={encoded-address}
    googleMaps: string; // https://www.google.com/maps/search/{encoded-address}
  };
}
```

## Open Questions

- Mapbox API key storage: `.env.local` with `NEXT_PUBLIC_MAPBOX_TOKEN`? Or baked into the geocode script only?
- Should canceled/redeemed properties be hidden by default or shown with visual de-emphasis?
- Future: RSS/scraping pipeline for auto-ingesting new auction lists from county sites

## File Structure

```
components/apps/LandFinderApp/
├── index.tsx
├── LandFinderApp.tsx
├── types.ts
└── components/
    ├── PropertyMap.tsx        # Mapbox GL map with pins
    ├── PropertyList.tsx       # Scrollable list of property cards
    ├── PropertyCard.tsx       # Individual property card
    ├── PropertyFilters.tsx    # Filter/sort controls
    └── PropertyPopup.tsx      # Map pin popup

scripts/
└── parse-auction-data.ts     # XLS → geocoded JSON

lib/mockData/
└── auction-properties.json   # Geocoded property data
```

## Research Notes

- RadOS apps receive `{ windowId: string }` as sole prop
- Use `contentPadding: false` for custom layouts
- `Web3Shell` provides the flex-col + footer pattern (not needed for v1 — no wallet actions)
- Register in `lib/constants.tsx` with lazy import
- Existing AuctionsApp is the closest analog but handles NFT auctions, not real estate
- No map libraries currently in the project — `react-map-gl` + `mapbox-gl` will be new deps
- Tailwind v4: use `max-w-[28rem]` not `max-w-md` (see memory notes)

## Dependencies to Add

```bash
npm install react-map-gl mapbox-gl
npm install -D @types/mapbox-gl xlsx  # xlsx for the parse script
```
