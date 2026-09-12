'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import { BusinessPlace, SearchCenter, CategoryKey, MapTheme, ExploreMode } from '@/types/business';
import { DEFAULT_CENTER } from '@/lib/constants';
import { exportBusinessesToCSV, copyOpportunitiesToClipboard } from '@/lib/exportUtils';
import { isValidBusinessPlace } from '@/lib/businessValidation';
import { filterBusinesses } from '@/lib/businessFilters';
import { PindropTopBar } from '@/components/Search/PindropTopBar';
import { PindropBottomBar } from '@/components/Controls/PindropBottomBar';
import { PindropLeadsDrawer } from '@/components/Sidebar/PindropLeadsDrawer';
import { MapContainer } from '@/components/Map/MapContainer';
import { BusinessDetailModal } from '@/components/Detail/BusinessDetailModal';
import { ApiKeyBanner } from '@/components/Common/ApiKeyBanner';

export default function Home() {
  const [apiKey, setApiKey] = useState<string>(
    () => process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() || ''
  );
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID';
  const [mapTheme, setMapTheme] = useState<MapTheme>('dark');
  const [exploreMode, setExploreMode] = useState<ExploreMode>('pin');

  // Search parameters
  const [centerPin, setCenterPin] = useState<SearchCenter>(DEFAULT_CENTER);
  const [radiusMeters, setRadiusMeters] = useState<number>(750);
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>('all');
  const [opportunitiesOnly, setOpportunitiesOnly] = useState<boolean>(false);
  const [socialPageOnly, setSocialPageOnly] = useState<boolean>(false);
  const [selectedRatingRanges, setSelectedRatingRanges] = useState<string[]>([]);
  const [selectedReviewCountRanges, setSelectedReviewCountRanges] = useState<string[]>([]);

  // Map view controls
  const [zoomLevel, setZoomLevel] = useState<number>(15);
  const tiltAngle = 45;

  // Business state
  const [businesses, setBusinesses] = useState<BusinessPlace[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessPlace | null>(null);
  const [hoveredBusinessId, setHoveredBusinessId] = useState<string | null>(null);

  // UI state
  const [activeNavTab, setActiveNavTab] = useState<'drop' | 'leads' | 'sites' | 'you'>('drop');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [searchTriggerCount, setSearchTriggerCount] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);

  // Load API Key on mount from env or localStorage
  useEffect(() => {
    const envKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (envKey && envKey.trim()) {
      setApiKey(envKey.trim());
    } else {
      const storedKey = localStorage.getItem('gmp_api_key');
      if (storedKey) {
        setApiKey(storedKey);
      }
    }

    const storedTheme = localStorage.getItem('pindrop_theme') as MapTheme;
    if (storedTheme === 'dark' || storedTheme === 'light') {
      setMapTheme(storedTheme);
    }
  }, []);

  const handleApiKeyChange = (newKey: string) => {
    setApiKey(newKey);
    localStorage.setItem('gmp_api_key', newKey);
  };

  const handleToggleTheme = () => {
    setMapTheme((prev) => {
      const next: MapTheme = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('pindrop_theme', next);
      return next;
    });
  };

  // Attempt user geolocation on load or CTA
  const handleLocateUser = useCallback(() => {
    if (!navigator.geolocation) {
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setCenterPin({
          lat: latitude,
          lng: longitude,
          address: 'Current Location',
        });
        setIsLocating(false);
      },
      (err) => {
        console.warn('Geolocation denied or unavailable:', err.message);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  // Stabilized callback to prevent infinite re-render cycles
  const handleBusinessesFetched = useCallback((fetched: BusinessPlace[]) => {
    setBusinesses(fetched.filter(isValidBusinessPlace));
  }, []);

  // Advanced filter handlers
  const handleToggleRatingRange = (rangeKey: string) => {
    setSelectedRatingRanges((prev) =>
      prev.includes(rangeKey) ? prev.filter((k) => k !== rangeKey) : [...prev, rangeKey]
    );
  };

  const handleToggleReviewCountRange = (rangeKey: string) => {
    setSelectedReviewCountRanges((prev) =>
      prev.includes(rangeKey) ? prev.filter((k) => k !== rangeKey) : [...prev, rangeKey]
    );
  };

  const handleClearAdvancedFilters = () => {
    setSelectedRatingRanges([]);
    setSelectedReviewCountRanges([]);
  };

  // Filtered businesses based on presence, category, and advanced ratings/review counts.
  // Shares filterBusinesses with the map so pins and the leads list can never disagree.
  const filteredBusinesses = useMemo(
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

  // Export handlers
  const handleExportCSV = () => {
    const targetBusinesses = opportunitiesOnly
      ? filteredBusinesses.filter((b) => !b.hasWebsite)
      : filteredBusinesses;
    exportBusinessesToCSV(
      targetBusinesses,
      `pindrop_leads_${centerPin.lat.toFixed(3)}_${centerPin.lng.toFixed(3)}.csv`
    );
  };

  const handleCopyClipboard = async () => {
    const opportunities = filteredBusinesses.filter((b) => !b.hasWebsite);
    const success = await copyOpportunitiesToClipboard(opportunities);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Trigger search on the current spot
  const handleSearchThisSpot = () => {
    setSearchTriggerCount((prev) => prev + 1);
  };

  // Bottom Nav tab handler
  const handleNavTabChange = (tab: 'drop' | 'leads' | 'sites' | 'you') => {
    setActiveNavTab(tab);
    if (tab === 'you') {
      setShowSettings(true);
    }
  };

  return (
    <APIProvider apiKey={apiKey} libraries={['places', 'marker', 'geometry', 'geocoding']}>
      <main className="relative w-screen h-screen overflow-hidden bg-[#1b2030] font-sans">
        {/* API Key Modal / Settings Banner */}
        {showSettings && (
          <ApiKeyBanner
            currentKey={apiKey}
            onKeyChange={(k) => {
              handleApiKeyChange(k);
              setShowSettings(false);
            }}
          />
        )}

        {/* Top Floating Pindrop Search Bar Header */}
        <PindropTopBar
          onPlaceSelect={(newCenter) => setCenterPin(newCenter)}
          onLocateMe={handleLocateUser}
          isLocating={isLocating}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          opportunitiesOnly={opportunitiesOnly}
          onToggleOpportunitiesOnly={() => {
            setOpportunitiesOnly((prev) => {
              const next = !prev;
              if (next) setSocialPageOnly(false);
              return next;
            });
          }}
          socialPageOnly={socialPageOnly}
          onToggleSocialPageOnly={() => {
            setSocialPageOnly((prev) => {
              const next = !prev;
              if (next) setOpportunitiesOnly(false);
              return next;
            });
          }}
          selectedRatingRanges={selectedRatingRanges}
          onToggleRatingRange={handleToggleRatingRange}
          selectedReviewCountRanges={selectedReviewCountRanges}
          onToggleReviewCountRange={handleToggleReviewCountRange}
          onClearAdvancedFilters={handleClearAdvancedFilters}
          totalFilteredCount={filteredBusinesses.length}
          onExportCSV={handleExportCSV}
          onZoomIn={() => setZoomLevel((z) => Math.min(20, z + 1))}
          onZoomOut={() => setZoomLevel((z) => Math.max(3, z - 1))}
          apiKey={apiKey}
        />

        {/* Interactive 3D Map Container with custom styled pins & radius slider */}
        <MapContainer
          apiKey={apiKey}
          mapId={mapId}
          mapTheme={mapTheme}
          exploreMode={exploreMode}
          centerPin={centerPin}
          radiusMeters={radiusMeters}
          selectedCategory={selectedCategory}
          opportunitiesOnly={opportunitiesOnly}
          socialPageOnly={socialPageOnly}
          selectedRatingRanges={selectedRatingRanges}
          selectedReviewCountRanges={selectedReviewCountRanges}
          selectedBusinessId={selectedBusiness?.id}
          hoveredBusinessId={hoveredBusinessId}
          onCenterPinChange={setCenterPin}
          onBusinessesFetched={handleBusinessesFetched}
          onBusinessSelect={setSelectedBusiness}
          onBusinessHover={setHoveredBusinessId}
          isSearching={isSearching}
          setIsSearching={setIsSearching}
          searchTriggerCount={searchTriggerCount}
          zoomLevel={zoomLevel}
          tiltAngle={tiltAngle}
        />

        {/* Floating Pindrop Bottom Navigation Bar */}
        <PindropBottomBar
          activeTab={activeNavTab}
          onTabChange={handleNavTabChange}
          onSearchThisSpot={handleSearchThisSpot}
          isSearching={isSearching}
          onOpenSettings={() => setShowSettings(true)}
          radiusMeters={radiusMeters}
          onRadiusChange={setRadiusMeters}
          mapTheme={mapTheme}
          onToggleTheme={handleToggleTheme}
          exploreMode={exploreMode}
          onExploreModeChange={setExploreMode}
        />

        {/* Sliding Leads & Sites Drawer */}
        <PindropLeadsDrawer
          isOpen={activeNavTab === 'leads' || activeNavTab === 'sites'}
          onClose={() => setActiveNavTab('drop')}
          businesses={filteredBusinesses}
          selectedBusinessId={selectedBusiness?.id}
          onBusinessSelect={setSelectedBusiness}
          onExportCSV={handleExportCSV}
          onCopyClipboard={handleCopyClipboard}
          copied={copied}
        />

        {/* Business Detail Modal */}
        <BusinessDetailModal
          business={selectedBusiness}
          onClose={() => setSelectedBusiness(null)}
        />
      </main>
    </APIProvider>
  );
}
