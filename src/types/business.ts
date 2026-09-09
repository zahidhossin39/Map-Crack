export interface BusinessPlace {
  id: string;
  name: string;
  formattedAddress?: string | null;
  location: {
    lat: number;
    lng: number;
  };
  hasWebsite: boolean;
  websiteURI?: string | null;
  nationalPhoneNumber?: string | null;
  internationalPhoneNumber?: string | null;
  rating?: number | null;
  userRatingCount?: number | null;
  priceLevel?: string | number | null;
  primaryType?: string | null;
  primaryTypeDisplayName?: string | null;
  types?: string[] | null;
  businessStatus?: string | null;
  isOpenNow?: boolean | null;
  weekdayDescriptions?: string[] | null;
  regularOpeningHours?: {
    openNow?: boolean | null;
    weekdayDescriptions?: string[] | null;
    periods?: any[];
  } | null | any;
  photos?: any[] | null;
  reviews?: any[] | null;
  googleMapsURI?: string | null;
  distanceMeters?: number;
}

export interface SearchCenter {
  lat: number;
  lng: number;
  address?: string;
}

export type CategoryKey =
  | 'all'
  | 'restaurant'
  | 'cafe'
  | 'store'
  | 'services'
  | 'health'
  | 'beauty'
  | 'automotive'
  | 'lodging';

export interface CategoryOption {
  key: CategoryKey;
  label: string;
  icon: string;
  types: string[]; // Google Places API primary types or types
}

export type MapTheme = 'dark' | 'light' | 'silver' | 'night';

export interface SearchFilter {
  category: CategoryKey;
  radiusMeters: number;
  opportunitiesOnly: boolean; // No website only
  searchQuery?: string;
  sortBy: 'opportunities_first' | 'rating' | 'reviews' | 'distance';
}
