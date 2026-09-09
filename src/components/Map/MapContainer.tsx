'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Map,
  useMap,
  useMapsLibrary,
  MapMouseEvent,
} from '@vis.gl/react-google-maps';
import { BusinessPlace, SearchCenter, CategoryKey, MapTheme } from '@/types/business';
import { CATEGORIES } from '@/lib/constants';
import { calculateDistanceMeters } from '@/lib/exportUtils';
import { RadiusCircle } from '@/components/Map/RadiusCircle';
import { RadiusSliderOverlay } from '@/components/Map/RadiusSliderOverlay';
import { CustomMarkerLayer } from '@/components/Map/CustomMarkerLayer';
import { Loader2, AlertCircle } from 'lucide-react';

interface MapContainerProps {
  apiKey: string;
  mapId: string;
  mapTheme: MapTheme;
  centerPin: SearchCenter;
  radiusMeters: number;
  selectedCategory: CategoryKey;
  opportunitiesOnly: boolean;
  selectedBusinessId?: string | null;
  hoveredBusinessId?: string | null;
  onCenterPinChange: (newCenter: SearchCenter) => void;
  onRadiusChange: (radius: number) => void;
  onBusinessesFetched: (businesses: BusinessPlace[]) => void;
  onBusinessSelect: (business: BusinessPlace) => void;
  onBusinessHover: (id: string | null) => void;
  isSearching: boolean;
  setIsSearching: (val: boolean) => void;
  searchTriggerCount: number;
  zoomLevel: number;
  tiltAngle: number;
}

const MapController: React.FC<{
  apiKey: string;
  centerPin: SearchCenter;
  radiusMeters: number;
  selectedCategory: CategoryKey;
  opportunitiesOnly: boolean;
  selectedBusinessId?: string | null;
  hoveredBusinessId?: string | null;
  onCenterPinChange: (newCenter: SearchCenter) => void;
  onRadiusChange: (radius: number) => void;
  onBusinessesFetched: (businesses: BusinessPlace[]) => void;
  onBusinessSelect: (business: BusinessPlace) => void;
  onBusinessHover: (id: string | null) => void;
  isSearching: boolean;
  setIsSearching: (val: boolean) => void;
  searchTriggerCount: number;
  zoomLevel: number;
  tiltAngle: number;
}> = ({
  apiKey,
  centerPin,
  radiusMeters,
  selectedCategory,
  opportunitiesOnly,
  selectedBusinessId,
  hoveredBusinessId,
  onCenterPinChange,
  onRadiusChange,
  onBusinessesFetched,
  onBusinessSelect,
  onBusinessHover,
  isSearching,
  setIsSearching,
  searchTriggerCount,
  zoomLevel,
  tiltAngle,
}) => {
  const map = useMap();
  const geocodingLib = useMapsLibrary('geocoding');

  const [businesses, setBusinesses] = useState<BusinessPlace[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Pan map smoothly when centerPin changes
  useEffect(() => {
    if (map && centerPin) {
      map.panTo({ lat: centerPin.lat, lng: centerPin.lng });
    }
  }, [map, centerPin.lat, centerPin.lng]);

  // Update zoom when zoomLevel changes
  useEffect(() => {
    if (map && zoomLevel) {
      map.setZoom(zoomLevel);
    }
  }, [map, zoomLevel]);

  // Update tilt/pitch when tiltAngle changes
  useEffect(() => {
    if (map && tiltAngle !== undefined) {
      map.setTilt(tiltAngle);
    }
  }, [map, tiltAngle]);

  // Execute Nearby Search via live Places API (New) endpoint
  const executeSearch = useCallback(async () => {
    setIsSearching(true);
    setErrorMessage(null);

    try {
      const categoryObj = CATEGORIES.find((c) => c.key === selectedCategory);
      const categoryTypes = categoryObj?.types || [];

      const res = await fetch('/api/places/nearby', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: centerPin.lat,
          lng: centerPin.lng,
          radius: radiusMeters,
          categoryTypes,
          apiKey,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch places');
      }

      const rawPlaces: BusinessPlace[] = data.places || [];

      // Calculate exact distance from center pin
      const mappedBusinesses = rawPlaces.map((p) => {
        const dist = calculateDistanceMeters(
          centerPin.lat,
          centerPin.lng,
          p.location.lat,
          p.location.lng
        );
        return {
          ...p,
          distanceMeters: dist,
        };
      });

      // Sort: No-website opportunities first, then by distance
      mappedBusinesses.sort((a, b) => {
        if (!a.hasWebsite && b.hasWebsite) return -1;
        if (a.hasWebsite && !b.hasWebsite) return 1;
        return (a.distanceMeters || 0) - (b.distanceMeters || 0);
      });

      setBusinesses(mappedBusinesses);
      onBusinessesFetched(mappedBusinesses);
    } catch (err: any) {
      console.error('Live Places API search error:', err);
      setErrorMessage(err?.message || 'Search failed. Please check your API key.');
      setBusinesses([]);
      onBusinessesFetched([]);
    } finally {
      setIsSearching(false);
    }
  }, [
    centerPin.lat,
    centerPin.lng,
    radiusMeters,
    selectedCategory,
    apiKey,
    setIsSearching,
    onBusinessesFetched,
  ]);

  // Debounced search trigger on pin, radius, category, or manual refresh
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      executeSearch();
    }, 350);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [executeSearch, searchTriggerCount]);

  // Click on map to drop a new pin
  const handleMapClick = useCallback(
    async (e: MapMouseEvent) => {
      if (!e.detail.latLng) return;
      const { lat, lng } = e.detail.latLng;

      let address = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

      if (geocodingLib) {
        try {
          const geocoder = new geocodingLib.Geocoder();
          const geoRes = await geocoder.geocode({ location: { lat, lng } });
          if (geoRes.results && geoRes.results[0]) {
            address = geoRes.results[0].formatted_address;
          }
        } catch (err) {
          // ignore geocode failure and use lat/lng fallback
        }
      }

      onCenterPinChange({
        lat,
        lng,
        address,
      });
    },
    [geocodingLib, onCenterPinChange]
  );

  const displayedBusinesses = opportunitiesOnly
    ? businesses.filter((b) => !b.hasWebsite)
    : businesses;

  return (
    <>
      <MapEventListener onMapClick={handleMapClick} />

      {/* Emerald Green Radius Circle (Image 2) */}
      <RadiusCircle
        center={{ lat: centerPin.lat, lng: centerPin.lng }}
        radiusMeters={radiusMeters}
      />

      {/* Interactive Search Radius Slider Overlay (Image 2) */}
      <RadiusSliderOverlay
        radiusMeters={radiusMeters}
        onRadiusChange={onRadiusChange}
      />

      {/* Custom Marker Layer with Orange (No Website) & Green Pins */}
      <CustomMarkerLayer
        centerPin={centerPin}
        businesses={displayedBusinesses}
        selectedBusinessId={selectedBusinessId}
        hoveredBusinessId={hoveredBusinessId}
        onBusinessSelect={onBusinessSelect}
        onBusinessHover={onBusinessHover}
      />

      {/* Scanning status indicator */}
      {isSearching && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-slate-900/90 text-emerald-400 border border-emerald-500/40 px-4 py-2 rounded-full shadow-2xl backdrop-blur-xl text-xs font-bold animate-pulse">
          <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
          <span>Scanning for local businesses...</span>
        </div>
      )}

      {/* Error notification */}
      {errorMessage && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 max-w-md w-full px-4">
          <div className="flex items-center gap-3 bg-slate-900/95 border border-amber-500/50 text-slate-200 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-xl text-xs">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-white">Notice</p>
              <p className="text-slate-300 mt-0.5">{errorMessage}</p>
            </div>
            <button
              onClick={executeSearch}
              className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm"
            >
              Retry
            </button>
          </div>
        </div>
      )}
    </>
  );
};

const MapEventListener: React.FC<{ onMapClick: (e: MapMouseEvent) => void }> = ({
  onMapClick,
}) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    const listener = map.addListener('click', onMapClick);
    return () => {
      google.maps.event.removeListener(listener);
    };
  }, [map, onMapClick]);

  return null;
};

export const MapContainer: React.FC<MapContainerProps> = (props) => {
  const { mapId, mapTheme, centerPin } = props;

  return (
    <div className="relative w-full h-full min-h-screen bg-[#1b2030] overflow-hidden">
      <Map
        mapId={mapId || 'DEMO_MAP_ID'}
        colorScheme={mapTheme === 'dark' ? 'DARK' : 'LIGHT'}
        defaultCenter={{ lat: centerPin.lat, lng: centerPin.lng }}
        defaultZoom={15}
        defaultTilt={45}
        defaultHeading={0}
        gestureHandling="greedy"
        disableDefaultUI={true}
        internalUsageAttributionIds={['gmp_git_agentskills_v1']}
        className="w-full h-full"
      >
        <MapController {...props} />
      </Map>
    </div>
  );
};
