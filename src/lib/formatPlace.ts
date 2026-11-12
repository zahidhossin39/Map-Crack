import { isValidBusinessPlace } from '@/lib/businessValidation';

// Fields every place lookup asks Google for (search results and Place Details).
export const PLACE_FIELDS = [
  'id',
  'displayName',
  'location',
  'formattedAddress',
  'websiteUri',
  'nationalPhoneNumber',
  'internationalPhoneNumber',
  'rating',
  'userRatingCount',
  'priceLevel',
  'primaryType',
  'primaryTypeDisplayName',
  'types',
  'regularOpeningHours',
  'photos',
  'googleMapsUri',
  'businessStatus',
  'utcOffsetMinutes',
];

// Google's raw place -> our BusinessPlace shape. No filtering, so a closed business still
// comes through (Place Details needs that to report a closure).
export function formatPlace(p: any) {
  const website = p.websiteUri?.trim();
  const hasWebsite = Boolean(website && website.length > 0);

  const latCoord = p.location?.latitude ?? 0;
  const lngCoord = p.location?.longitude ?? 0;

  const photos =
    p.photos?.map((ph: any) => ({
      url: `/api/places/photo?name=${encodeURIComponent(ph.name)}&w=800`,
      authorAttributions: ph.authorAttributions,
    })) || [];

  return {
    id: p.id,
    name: p.displayName?.text?.trim() || '',
    formattedAddress: p.formattedAddress || '',
    location: {
      lat: latCoord,
      lng: lngCoord,
    },
    hasWebsite,
    websiteURI: hasWebsite ? website : undefined,
    nationalPhoneNumber: p.nationalPhoneNumber || '',
    internationalPhoneNumber: p.internationalPhoneNumber || '',
    rating: p.rating || null,
    userRatingCount: p.userRatingCount || 0,
    priceLevel: p.priceLevel || null,
    primaryType: p.primaryType || '',
    primaryTypeDisplayName: p.primaryTypeDisplayName?.text || '',
    types: p.types || [],
    businessStatus: p.businessStatus || 'OPERATIONAL',
    utcOffsetMinutes: p.utcOffsetMinutes ?? null,
    regularOpeningHours: p.regularOpeningHours
      ? {
          openNow: p.regularOpeningHours.openNow,
          weekdayDescriptions: p.regularOpeningHours.weekdayDescriptions || [],
        }
      : null,
    photos,
    googleMapsURI:
      p.googleMapsUri ||
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        p.displayName?.text || ''
      )}`,
  };
}

export function formatPlaces(rawPlaces: any[]) {
  return rawPlaces.map(formatPlace).filter(isValidBusinessPlace);
}
