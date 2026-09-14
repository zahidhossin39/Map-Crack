'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Map,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import { BusinessPlace, SearchCenter, CategoryKey, MapTheme, ExploreMode } from '@/types/business';
import { CATEGORIES } from '@/lib/constants';
import { calculateDistanceMeters } from '@/lib/exportUtils';
import { RadiusCircle } from '@/components/Map/RadiusCircle';
import { CustomMarkerLayer } from '@/components/Map/CustomMarkerLayer';
import { getAllLeadStatuses } from '@/lib/pindropUtils';
import { getAllSelectedIds, toggleSelected, SELECTION_CHANGED_EVENT } from '@/lib/selection';
import {
  getAllSpeedScores,
  setSpeedScore,
  fetchPageSpeedMobile,
  SPEED_CHANGED_EVENT,
} from '@/lib/pagespeed';
import { isValidBusinessPlace } from '@/lib/businessValidation';
import { filterBusinesses } from '@/lib/businessFilters';
import { Loader2, AlertCircle } from 'lucide-react';

const MAX_ACCUMULATED_BUSINESSES = 500;

interface MapContainerProps {
  apiKey: string;
  mapId: string;
  mapTheme: MapTheme;
  exploreMode?: ExploreMode;
  centerPin: SearchCenter;
  radiusMeters: number;
  selectedCategory: CategoryKey;
  opportunitiesOnly: boolean;
  socialPageOnly?: boolean;
  selectedRatingRanges?: string[];
  selectedReviewCountRanges?: string[];
  selectedBusinessId?: string | null;
  hoveredBusinessId?: string | null;
  onCenterPinChange: (newCenter: SearchCenter) => void;
  onBusinessesFetched: (businesses: BusinessPlace[]) => void;
  onBusinessSelect: (business: BusinessPlace) => void;
  onBusinessHover: (id: string | null) => void;
  isSearching: boolean;
  setIsSearching: (val: boolean) => void;
  searchTriggerCount: number;
  clearTrigger?: number;
  zoomLevel: number;
  tiltAngle: number;
}

const MapController: React.FC<MapContainerProps> = ({
  apiKey,
  mapTheme,
  exploreMode = 'pin',
  centerPin,
  radiusMeters,
  selectedCategory,
  opportunitiesOnly,
  socialPageOnly = false,
  selectedRatingRanges = [],
  selectedReviewCountRanges = [],
  selectedBusinessId,
  hoveredBusinessId,
  onCenterPinChange,
  onBusinessesFetched,
  onBusinessSelect,
  onBusinessHover,
  isSearching,
  setIsSearching,
  searchTriggerCount,
  clearTrigger = 0,
  zoomLevel,
  tiltAngle,
}) => {
  const map = useMap();
  const geocodingLib = useMapsLibrary('geocoding');

  const [businesses, setBusinesses] = useState<BusinessPlace[]>([]);
  // Lets roam read the current list without a state updater, so the fetch callback below
  // stays outside setBusinesses (updaters must be pure; React may run them twice).
  const businessesRef = useRef<BusinessPlace[]>([]);
  businessesRef.current = businesses;
  const [leadStatuses, setLeadStatuses] = useState<Record<string, any>>({});
  const [selectedIds, setSelectedIds] = useState<Record<string, true>>({});
  const [speedScores, setSpeedScores] = useState<Record<string, number>>({});
  const [checkingIds, setCheckingIds] = useState<Record<string, true>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAbove50km, setIsAbove50km] = useState<boolean>(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Stable references for callbacks to prevent infinite re-render cycles
  const onBusinessesFetchedRef = useRef(onBusinessesFetched);
  onBusinessesFetchedRef.current = onBusinessesFetched;

  const setIsSearchingRef = useRef(setIsSearching);
  setIsSearchingRef.current = setIsSearching;

  // Deduplication tracking to prevent duplicate in-flight or identical searches
  const lastSearchKeyRef = useRef<string>('');
  const isSearchRunningRef = useRef<boolean>(false);
  const lastRoamKeyRef = useRef<string>('');
  const isRoamRunningRef = useRef<boolean>(false);

  // Sync lead pipeline statuses reactively across components
  useEffect(() => {
    setLeadStatuses(getAllLeadStatuses());

    const handleStatusSync = () => {
      setLeadStatuses(getAllLeadStatuses());
    };

    window.addEventListener('pindrop_lead_status_changed', handleStatusSync);
    window.addEventListener('storage', handleStatusSync);
    return () => {
      window.removeEventListener('pindrop_lead_status_changed', handleStatusSync);
      window.removeEventListener('storage', handleStatusSync);
    };
  }, []);

  // Selection is stored independently of pipeline status, so a prospect stays starred
  // after it becomes Talking or Client.
  useEffect(() => {
    const sync = () => setSelectedIds(getAllSelectedIds());
    sync();
    window.addEventListener(SELECTION_CHANGED_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(SELECTION_CHANGED_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  // Speed scores are cached per business, so a checked site keeps its score across searches.
  useEffect(() => {
    const sync = () => setSpeedScores(getAllSpeedScores());
    sync();
    window.addEventListener(SPEED_CHANGED_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(SPEED_CHANGED_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const handleCheckSpeed = async (id: string, url: string) => {
    if (checkingIds[id]) return;
    setCheckingIds((prev) => ({ ...prev, [id]: true }));
    const score = await fetchPageSpeedMobile(url, apiKey);
    setCheckingIds((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    if (score !== null) setSpeedScore(id, score);
  };

  // Clear the accumulated sweep on demand.
  useEffect(() => {
    if (clearTrigger === 0) return;
    lastSearchKeyRef.current = '';
    lastRoamKeyRef.current = '';
    setBusinesses([]);
    onBusinessesFetchedRef.current([]);
  }, [clearTrigger]);

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

  // Dynamically update Google Maps colorScheme when theme changes
  useEffect(() => {
    if (map) {
      map.setOptions({
        colorScheme: mapTheme === 'dark' ? 'DARK' : 'LIGHT',
      });
    }
  }, [map, mapTheme]);

  // Monitor map zoom & bounds to determine if visible scale is above 50km
  useEffect(() => {
    if (!map) return;

    const updateScale = () => {
      const bounds = map.getBounds();
      const center = map.getCenter();
      const zoom = map.getZoom();

      if (bounds && center) {
        const ne = bounds.getNorthEast();
        // Calculate distance from center to northeast corner (diagonal)
        const distCorner = calculateDistanceMeters(
          center.lat(),
          center.lng(),
          ne.lat(),
          ne.lng()
        );
        // Distance from center to north edge (half-height)
        const distVertical = calculateDistanceMeters(
          center.lat(),
          center.lng(),
          ne.lat(),
          center.lng()
        );
        // Distance from center to east edge (half-width)
        const distHorizontal = calculateDistanceMeters(
          center.lat(),
          center.lng(),
          center.lat(),
          ne.lng()
        );

        // Effective visible radius of viewport (average half-dimension)
        const visibleRadius = (distVertical + distHorizontal) / 2;

        // Viewport scale exceeds 50km (50,000 meters)
        // Zoom <= 10 also corresponds to > 50km visible scale on standard displays
        const above =
          visibleRadius > 50000 ||
          distCorner > 65000 ||
          (typeof zoom === 'number' && zoom <= 10);

        setIsAbove50km((prev) => (prev !== above ? above : prev));
      } else if (typeof zoom === 'number') {
        const above = zoom <= 10;
        setIsAbove50km((prev) => (prev !== above ? above : prev));
      }
    };

    updateScale();

    const zoomListener = map.addListener('zoom_changed', updateScale);
    const boundsListener = map.addListener('bounds_changed', updateScale);
    const idleListener = map.addListener('idle', updateScale);

    return () => {
      google.maps.event.removeListener(zoomListener);
      google.maps.event.removeListener(boundsListener);
      google.maps.event.removeListener(idleListener);
    };
  }, [map]);

  // Execute Nearby Search via live Places API (New) endpoint
  const executeSearch = useCallback(async () => {
    if (isSearchRunningRef.current) return;

    const searchKey = `${centerPin.lat.toFixed(5)}_${centerPin.lng.toFixed(5)}_${radiusMeters}_${selectedCategory}_${apiKey}_${searchTriggerCount}`;
    if (lastSearchKeyRef.current === searchKey) {
      return;
    }

    isSearchRunningRef.current = true;
    setIsSearchingRef.current(true);
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
          categoryKey: selectedCategory,
          categoryLabel: categoryObj?.label,
          apiKey,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch places');
      }

      if (data.warning) {
        setErrorMessage(data.warning);
      }

      lastSearchKeyRef.current = searchKey;

      const rawPlaces: BusinessPlace[] = (data.places || []).filter(isValidBusinessPlace);

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

      // Accumulate across searches: Google caps every search at 20 results with no
      // pagination, so sweeping an area is the only way to build a real list.
      // distanceMeters stays relative to the pin each business was found from.
      const validPrev = businessesRef.current.filter(isValidBusinessPlace);
      const existingIds = new Set(validPrev.map((b) => b.id));
      const newUnique = mappedBusinesses.filter((b) => !existingIds.has(b.id));
      const merged = [...validPrev, ...newUnique].slice(-MAX_ACCUMULATED_BUSINESSES);

      merged.sort((a, b) => {
        if (!a.hasWebsite && b.hasWebsite) return -1;
        if (a.hasWebsite && !b.hasWebsite) return 1;
        return (a.distanceMeters || 0) - (b.distanceMeters || 0);
      });

      setBusinesses(merged);
      onBusinessesFetchedRef.current(merged);
    } catch (err: any) {
      console.error('Live Places API search error:', err);
      setErrorMessage(err?.message || 'Search failed. Please check your API key.');
      // Keep whatever was already collected; one failed search must not wipe the sweep.
    } finally {
      isSearchRunningRef.current = false;
      setIsSearchingRef.current(false);
    }
  }, [
    centerPin.lat,
    centerPin.lng,
    radiusMeters,
    selectedCategory,
    apiKey,
    searchTriggerCount,
  ]);

  // Execute Roam Search across visible viewport bounds
  const executeRoamSearch = useCallback(async () => {
    if (!map) return;
    if (isAbove50km) return; // Prevent unnecessary roam queries when zoomed out beyond 50km
    if (isRoamRunningRef.current) return;

    const center = map.getCenter();
    if (!center) return;

    const lat = center.lat();
    const lng = center.lng();

    // Compute approximate radius from viewport bounds
    let radius = 2000;
    const bounds = map.getBounds();
    if (bounds) {
      const ne = bounds.getNorthEast();
      const dist = calculateDistanceMeters(lat, lng, ne.lat(), ne.lng());
      radius = Math.min(Math.max(Math.round(dist * 0.8), 500), 5000);
    }

    // 2dp ~= 1.1km. At 3dp (~110m) almost every pan fired another billable Places request.
    const roamKey = `${lat.toFixed(2)}_${lng.toFixed(2)}_${radius}_${selectedCategory}_${apiKey}`;
    if (lastRoamKeyRef.current === roamKey) {
      return;
    }

    isRoamRunningRef.current = true;
    setIsSearchingRef.current(true);
    setErrorMessage(null);

    try {
      const categoryObj = CATEGORIES.find((c) => c.key === selectedCategory);
      const categoryTypes = categoryObj?.types || [];

      const res = await fetch('/api/places/nearby', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat,
          lng,
          radius,
          categoryTypes,
          categoryKey: selectedCategory,
          categoryLabel: categoryObj?.label,
          apiKey,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch places');
      }

      if (data.warning) {
        setErrorMessage(data.warning);
      }

      lastRoamKeyRef.current = roamKey;

      const rawPlaces: BusinessPlace[] = (data.places || []).filter(isValidBusinessPlace);
      const mappedBusinesses = rawPlaces.map((p) => ({
        ...p,
        distanceMeters: calculateDistanceMeters(lat, lng, p.location.lat, p.location.lng),
      }));

      const validPrev = businessesRef.current.filter(isValidBusinessPlace);
      const existingIds = new Set(validPrev.map((b) => b.id));
      const newUnique = mappedBusinesses.filter((b) => !existingIds.has(b.id));
      // ponytail: roam accumulates across pans, so drop the oldest beyond the cap. Swap for
      // "keep nearest to current centre" if users complain about pins vanishing behind them.
      const merged = [...validPrev, ...newUnique].slice(-MAX_ACCUMULATED_BUSINESSES);

      setBusinesses(merged);
      onBusinessesFetchedRef.current(merged);
    } catch (err: any) {
      console.error('Roam Places search error:', err);
    } finally {
      isRoamRunningRef.current = false;
      setIsSearchingRef.current(false);
    }
  }, [map, selectedCategory, apiKey, isAbove50km]);

  // When in Roam Mode, listen to map idle (pan/zoom stop) to discover places
  useEffect(() => {
    if (!map || exploreMode !== 'roam') return;

    let timer: NodeJS.Timeout;
    const idleListener = map.addListener('idle', () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        executeRoamSearch();
      }, 750);
    });

    return () => {
      clearTimeout(timer);
      google.maps.event.removeListener(idleListener);
    };
  }, [map, exploreMode, executeRoamSearch]);

  // Debounced search trigger on pin, radius, category, or manual refresh (Pin mode only)
  useEffect(() => {
    if (exploreMode === 'roam') return;

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      executeSearch();
    }, 400);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [exploreMode, executeSearch]);

  // Click on map to drop a new pin
  const handleMapClick = useCallback(
    // Registered via map.addListener, so this is the raw Google Maps event (e.latLng),
    // not the @vis.gl wrapper event (e.detail.latLng).
    async (e: google.maps.MapMouseEvent) => {
      if (exploreMode === 'roam') return;
      if (!e.latLng) return;
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();

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
    [geocodingLib, onCenterPinChange, exploreMode]
  );

  const displayedBusinesses = useMemo(
    () =>
      filterBusinesses(businesses, {
        opportunitiesOnly,
        socialPageOnly,
        selectedCategory,
        selectedRatingRanges,
        selectedReviewCountRanges,
      }),
    [
      businesses,
      opportunitiesOnly,
      socialPageOnly,
      selectedCategory,
      selectedRatingRanges,
      selectedReviewCountRanges,
    ]
  );

  return (
    <>
      <MapEventListener onMapClick={handleMapClick} />

      {/* Emerald Green Radius Circle (Only in Pin Mode) */}
      {exploreMode !== 'roam' && (
        <RadiusCircle
          center={{ lat: centerPin.lat, lng: centerPin.lng }}
          radiusMeters={radiusMeters}
        />
      )}

      {/* Custom Marker Layer with 6 Pin Types (Hidden when zoomed out > 50km for peak performance) */}
      <CustomMarkerLayer
        centerPin={centerPin}
        businesses={isAbove50km ? [] : displayedBusinesses}
        selectedBusinessId={selectedBusinessId}
        hoveredBusinessId={hoveredBusinessId}
        onBusinessSelect={onBusinessSelect}
        onBusinessHover={onBusinessHover}
        exploreMode={exploreMode}
        leadStatuses={leadStatuses}
        selectedIds={selectedIds}
        onToggleSelect={(id) => toggleSelected(id)}
        speedScores={speedScores}
        checkingIds={checkingIds}
        onCheckSpeed={handleCheckSpeed}
      />

      {/* 50km Zoom Scale Notice & Performance Booster */}
      {isAbove50km && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5 bg-slate-900/90 text-amber-300 border border-amber-500/40 px-4 py-2 rounded-full shadow-2xl backdrop-blur-xl text-xs font-semibold animate-in fade-in slide-in-from-top-2 duration-200">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
          <span>Zoom in closer (&lt; 50km) to view business pins</span>
          <button
            onClick={() => {
              if (map) {
                map.setZoom(13);
                if (exploreMode !== 'roam') {
                  map.panTo({ lat: centerPin.lat, lng: centerPin.lng });
                }
              }
            }}
            className="ml-1 px-2.5 py-0.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 hover:text-white border border-amber-500/40 text-[11px] font-bold transition-colors cursor-pointer"
          >
            Zoom In
          </button>
        </div>
      )}

      {/* Scanning status indicator */}
      {isSearching && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-slate-900/90 text-emerald-400 border border-emerald-500/40 px-4 py-2 rounded-full shadow-2xl backdrop-blur-xl text-xs font-bold animate-pulse">
          <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
          <span>
            {exploreMode === 'roam'
              ? 'Free Roam: Discovering visible businesses...'
              : 'Scanning for local businesses...'}
          </span>
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

const MapEventListener: React.FC<{ onMapClick: (e: google.maps.MapMouseEvent) => void }> = ({
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
    <div className={`relative w-full h-full min-h-screen ${mapTheme === 'dark' ? 'bg-[#1b2030]' : 'bg-[#e5e3df]'} overflow-hidden`}>
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
