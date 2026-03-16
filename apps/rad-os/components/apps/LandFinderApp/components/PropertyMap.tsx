'use client';

import { useRef, useCallback, useMemo, useEffect, useState } from 'react';
import Map, {
  Marker,
  Popup,
  NavigationControl,
  type MapRef,
} from 'react-map-gl/maplibre';
import type { AuctionProperty } from '../types';

// Use free OpenStreetMap tiles via MapLibre (no API key needed)
// Swap to Mapbox when user adds NEXT_PUBLIC_MAPBOX_TOKEN
const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const MAPBOX_STYLE = 'mapbox://styles/mapbox/light-v11';

// San Diego county center
const INITIAL_VIEW = {
  longitude: -116.9,
  latitude: 33.1,
  zoom: 9,
};

interface Props {
  properties: AuctionProperty[];
  selectedId: string | null;
  hoveredId: string | null;
  onSelect: (id: string | null) => void;
  onHover: (id: string | null) => void;
}

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

function PinDot({
  property,
  isSelected,
  isHovered,
}: {
  property: AuctionProperty;
  isSelected: boolean;
  isHovered: boolean;
}) {
  const isInactive = property.status !== 'active';
  const isLand = property.auctionType === 'unimproved';

  const size = isSelected ? 14 : isHovered ? 12 : 10;
  const color = isInactive
    ? '#9ca3af'
    : isLand
      ? '#16a34a'
      : '#2563eb';

  return (
    <div
      className="rounded-full transition-all duration-base"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        border: `2px solid var(--color-flip)`,
        boxShadow: isSelected
          ? '0 0 0 2px ' + color + ', 0 2px 8px rgba(0,0,0,0.3)'
          : isHovered
            ? '0 1px 4px rgba(0,0,0,0.3)'
            : '0 1px 2px rgba(0,0,0,0.2)',
        cursor: 'pointer',
      }}
    />
  );
}

export function PropertyMap({
  properties,
  selectedId,
  hoveredId,
  onSelect,
  onHover,
}: Props) {
  const mapRef = useRef<MapRef>(null);
  const [popupProperty, setPopupProperty] = useState<AuctionProperty | null>(
    null
  );

  const geoProperties = useMemo(
    () => properties.filter((p) => p.coordinates !== null),
    [properties]
  );

  // Fly to selected property
  useEffect(() => {
    if (!selectedId || !mapRef.current) return;
    const p = geoProperties.find((g) => g.id === selectedId);
    if (p?.coordinates) {
      mapRef.current.flyTo({
        center: [p.coordinates.lng, p.coordinates.lat],
        zoom: Math.max(mapRef.current.getZoom(), 13),
        duration: 800,
      });
      setPopupProperty(p);
    }
  }, [selectedId, geoProperties]);

  const handleMarkerClick = useCallback(
    (p: AuctionProperty) => {
      onSelect(p.id);
      setPopupProperty(p);
    },
    [onSelect]
  );

  const noGeoCount = properties.length - geoProperties.length;

  return (
    <div className="w-full h-full relative">
      <Map
        ref={mapRef}
        initialViewState={INITIAL_VIEW}
        style={{ width: '100%', height: '100%' }}
        mapStyle={MAPBOX_TOKEN ? MAPBOX_STYLE : MAP_STYLE}
        {...(MAPBOX_TOKEN ? { mapboxAccessToken: MAPBOX_TOKEN } : {})}
        onClick={() => {
          onSelect(null);
          setPopupProperty(null);
        }}
      >
        <NavigationControl position="top-left" />

        {geoProperties.map((p) => (
          <Marker
            key={p.id}
            longitude={p.coordinates!.lng}
            latitude={p.coordinates!.lat}
            anchor="center"
            onClick={(e: { originalEvent: MouseEvent }) => {
              e.originalEvent.stopPropagation();
              handleMarkerClick(p);
            }}
          >
            <div
              onMouseEnter={() => onHover(p.id)}
              onMouseLeave={() => onHover(null)}
            >
              <PinDot
                property={p}
                isSelected={selectedId === p.id}
                isHovered={hoveredId === p.id}
              />
            </div>
          </Marker>
        ))}

        {popupProperty?.coordinates && (
          <Popup
            longitude={popupProperty.coordinates.lng}
            latitude={popupProperty.coordinates.lat}
            anchor="bottom"
            offset={12}
            closeOnClick={false}
            onClose={() => setPopupProperty(null)}
            className="land-finder-popup"
          >
            <div className="p-1 min-w-[180px]">
              <p className="text-xs font-medium leading-tight">
                {popupProperty.address}
              </p>
              <p className="text-sm text-sub mt-0.5">
                {popupProperty.city}, {popupProperty.zip}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm font-semibold">
                  {formatCurrency(popupProperty.openingBid)}
                </span>
                <span className="text-xs text-mute">
                  Assessed: {formatCurrency(popupProperty.totalAssessedValue)}
                </span>
              </div>
              <div className="flex gap-2 mt-1">
                <a
                  href={popupProperty.externalLinks.zillow}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-link hover:underline"
                >
                  Zillow
                </a>
                <a
                  href={popupProperty.externalLinks.redfin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-link hover:underline"
                >
                  Redfin
                </a>
              </div>
            </div>
          </Popup>
        )}
      </Map>

      {/* Ungeocodable count */}
      {noGeoCount > 0 && (
        <div className="absolute bottom-2 left-2 bg-page/90 backdrop-blur-sm text-xs text-mute px-2 py-1 rounded border border-line">
          {noGeoCount} properties not shown (no coordinates)
        </div>
      )}

      {/* Legend */}
      <div className="absolute top-2 right-2 bg-page/90 backdrop-blur-sm text-xs px-2 py-1.5 rounded border border-line flex flex-col gap-1">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-success inline-block" />
          <span className="text-sub">Land</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-link inline-block" />
          <span className="text-sub">Improved</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-mute inline-block" />
          <span className="text-sub">Inactive</span>
        </div>
      </div>
    </div>
  );
}
