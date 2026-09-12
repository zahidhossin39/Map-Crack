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
  isSocialOnly?: boolean;
  leadStatus?: LeadStatus;
}

export type LeadStatus = 'none' | 'talking' | 'client' | 'nogo';

export interface SearchCenter {
  lat: number;
  lng: number;
  address?: string;
}

export type CategoryKey =
  | 'all'
  | 'barbershop'
  | 'hair_salon'
  | 'nail_salon'
  | 'spa'
  | 'plumbing'
  | 'electrician'
  | 'landscaping'
  | 'roofing'
  | 'painting'
  | 'general_contractor'
  | 'auto_repair'
  | 'car_wash'
  | 'restaurant'
  | 'cafe'
  | 'bakery'
  | 'bar'
  | 'gym'
  | 'dentist'
  | 'veterinary'
  | 'florist'
  | 'pet_store'
  | 'real_estate'
  | 'insurance'
  | 'law_firm'
  | string;

export interface CategoryOption {
  key: CategoryKey;
  label: string;
  icon?: string;
  types: string[]; // Google Places API primary types or types
}

export type MapTheme = 'dark' | 'light' | 'silver' | 'night';

export type ExploreMode = 'pin' | 'roam';

