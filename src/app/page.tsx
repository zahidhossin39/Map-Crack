'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import { BusinessPlace, SearchCenter, CategoryKey, MapTheme } from '@/types/business';
import { DEFAULT_CENTER } from '@/lib/constants';
import { exportBusinessesToCSV, copyOpportunitiesToClipboard } from '@/lib/exportUtils';
import { PindropTopBar } from '@/components/Search/PindropTopBar';
import { PindropBottomBar } from '@/components/Controls/PindropBottomBar';
import { PindropLeadsDrawer } from '@/components/Sidebar/PindropLeadsDrawer';
import { MapContainer } from '@/components/Map/MapContainer';
import { BusinessDetailModal } from '@/components/Detail/BusinessDetailModal';
import { LocationOnboardingModal } from '@/components/Common/LocationOnboardingModal';
import { ApiKeyBanner } from '@/components/Common/ApiKeyBanner';

export default function Home() {
  const [apiKey, setApiKey] = useState<string>('');
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID';
  const mapTheme: MapTheme = 'dark';

  // Search parameters
  const [centerPin, setCenterPin] = useState<SearchCenter>(DEFAULT_CENTER);
  const [radiusMeters, setRadiusMeters] = useState<number>(750);
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>('all');
  const [opportunitiesOnly, setOpportunitiesOnly] = useState<boolean>(false);

  // Map view controls
  const [zoomLevel, setZoomLevel] = useState<number>(15);
  const [tiltAngle, setTiltAngle] = useState<number>(45);

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
  const [showOnboarding, setShowOnboarding] = useState<boolean>(true);
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

    const onboardingDismissed = sessionStorage.getItem('pindrop_onboarding_dismissed');
    if (onboardingDismissed) {
      setShowOnboarding(false);
    }
  }, []);

  const handleApiKeyChange = (newKey: string) => {
    setApiKey(newKey);
    localStorage.setItem('gmp_api_key', newKey);
  };

  // Attempt user geolocation on load or CTA
  const handleLocateUser = useCallback(() => {
    if (!navigator.geolocation) {
      setShowOnboarding(false);
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
        setShowOnboarding(false);
        sessionStorage.setItem('pindrop_onboarding_dismissed', 'true');
      },
      (err) => {
        console.warn('Geolocation denied or unavailable:', err.message);
        setIsLocating(false);
        setShowOnboarding(false);
        sessionStorage.setItem('pindrop_onboarding_dismissed', 'true');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  const handleSearchByAddress = () => {
    setShowOnboarding(false);
    sessionStorage.setItem('pindrop_onboarding_dismissed', 'true');
    setTimeout(() => {
      const input = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
      if (input) input.focus();
    }, 150);
  };

  // Export handlers
  const handleExportCSV = () => {
    const targetBusinesses = opportunitiesOnly
      ? businesses.filter((b) => !b.hasWebsite)
      : businesses;
    exportBusinessesToCSV(
      targetBusinesses,
      `pindrop_leads_${centerPin.lat.toFixed(3)}_${centerPin.lng.toFixed(3)}.csv`
    );
  };

  const handleCopyClipboard = async () => {
    const opportunities = businesses.filter((b) => !b.hasWebsite);
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

  const opportunityCount = businesses.filter((b) => !b.hasWebsite).length;

  return (
    <APIProvider apiKey={apiKey} libraries={['places', 'marker', 'geometry', 'geocoding']}>
      <main className="relative w-screen h-screen overflow-hidden bg-[#1b2030] font-sans">
        {/* Onboarding Location Choice Modal */}
        <LocationOnboardingModal
          isOpen={showOnboarding}
          onUseLocation={handleLocateUser}
          onSearchByAddress={handleSearchByAddress}
          isLocating={isLocating}
        />

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
          currentAddress={centerPin.address}
          opportunityCount={opportunityCount}
          onPlaceSelect={(newCenter) => setCenterPin(newCenter)}
          onLocateMe={handleLocateUser}
          isLocating={isLocating}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          opportunitiesOnly={opportunitiesOnly}
          onToggleOpportunitiesOnly={() => setOpportunitiesOnly(!opportunitiesOnly)}
          onZoomIn={() => setZoomLevel((z) => Math.min(20, z + 1))}
          onZoomOut={() => setZoomLevel((z) => Math.max(3, z - 1))}
          apiKey={apiKey}
        />

        {/* Interactive 3D Map Container with custom styled pins & radius slider */}
        <MapContainer
          apiKey={apiKey}
          mapId={mapId}
          mapTheme={mapTheme}
          centerPin={centerPin}
          radiusMeters={radiusMeters}
          selectedCategory={selectedCategory}
          opportunitiesOnly={opportunitiesOnly}
          selectedBusinessId={selectedBusiness?.id}
          hoveredBusinessId={hoveredBusinessId}
          onCenterPinChange={setCenterPin}
          onRadiusChange={setRadiusMeters}
          onBusinessesFetched={setBusinesses}
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
          onTiltUp={() => setTiltAngle((t) => Math.min(67.5, t + 15))}
          onTiltDown={() => setTiltAngle((t) => Math.max(0, t - 15))}
          onOpenSettings={() => setShowSettings(true)}
        />

        {/* Sliding Leads & Sites Drawer */}
        <PindropLeadsDrawer
          isOpen={activeNavTab === 'leads' || activeNavTab === 'sites'}
          onClose={() => setActiveNavTab('drop')}
          businesses={businesses}
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
