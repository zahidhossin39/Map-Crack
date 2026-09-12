import { NextRequest, NextResponse } from 'next/server';
import { isValidBusinessPlace } from '@/lib/businessValidation';
import { resolveServerKey } from '@/lib/serverApiKey';

const DEFAULT_COMMERCIAL_TYPES = [
  'restaurant',
  'cafe',
  'bakery',
  'bar',
  'store',
  'supermarket',
  'clothing_store',
  'car_repair',
  'beauty_salon',
  'hair_care',
  'spa',
  'gym',
  'hotel',
  'lodging',
  'real_estate_agency',
  'lawyer',
  'accounting',
  'dentist',
  'doctor',
  'pharmacy',
];

function formatPlaces(rawPlaces: any[]) {
  return rawPlaces
    .map((p: any) => {
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
    })
    .filter(isValidBusinessPlace);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      lat,
      lng,
      radius = 750,
      categoryTypes = [],
      categoryKey,
      categoryLabel,
      apiKey,
    } = body;

    const { key, reason } = resolveServerKey(req, apiKey);

    if (!key) {
      return reason === 'cross-origin'
        ? NextResponse.json({ error: 'Cross-origin requests are not allowed.' }, { status: 403 })
        : NextResponse.json({ error: 'Google Maps API Key is required.' }, { status: 400 });
    }

    if (lat === undefined || lng === undefined) {
      return NextResponse.json(
        { error: 'Latitude and Longitude are required.' },
        { status: 400 }
      );
    }

    const fieldMask = [
      'places.id',
      'places.displayName',
      'places.location',
      'places.formattedAddress',
      'places.websiteUri',
      'places.nationalPhoneNumber',
      'places.internationalPhoneNumber',
      'places.rating',
      'places.userRatingCount',
      'places.priceLevel',
      'places.primaryType',
      'places.primaryTypeDisplayName',
      'places.types',
      'places.regularOpeningHours',
      'places.photos',
      'places.googleMapsUri',
      'places.businessStatus',
    ].join(',');

    let rawPlaces: any[] = [];

    // 1. First Attempt: searchNearby
    const nearbyPayload: any = {
      locationRestriction: {
        circle: {
          center: {
            latitude: Number(lat),
            longitude: Number(lng),
          },
          radius: Math.min(Number(radius), 50000),
        },
      },
      maxResultCount: 20,
      rankPreference: 'POPULARITY',
    };

    if (Array.isArray(categoryTypes) && categoryTypes.length > 0) {
      nearbyPayload.includedPrimaryTypes = categoryTypes.slice(0, 50);
    } else {
      nearbyPayload.includedPrimaryTypes = DEFAULT_COMMERCIAL_TYPES;
    }

    let quotaExceeded = false;
    let lastError: string | null = null;

    const readError = async (res: Response, label: string) => {
      const body = await res.text();
      let message = body;
      try {
        message = JSON.parse(body)?.error?.message || body;
      } catch {
        // non-JSON body, keep the raw text
      }
      console.error(`${label} failed (${res.status}): ${message}`);
      return message;
    };

    try {
      const response = await fetch(
        'https://places.googleapis.com/v1/places:searchNearby',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': key,
            'X-Goog-FieldMask': fieldMask,
          },
          body: JSON.stringify(nearbyPayload),
        }
      );

      if (response.ok) {
        const data = await response.json();
        rawPlaces = data.places || [];
      } else {
        if (response.status === 429) {
          quotaExceeded = true;
        }
        lastError = await readError(response, 'searchNearby');
      }
    } catch (e: any) {
      lastError = e?.message || 'searchNearby request failed';
      console.error('searchNearby fetch error, falling back to searchText:', e);
    }

    // 2. Second Attempt: If searchNearby hit quota (429) or returned 0, try searchText with locationBias!
    if (rawPlaces.length === 0) {
      let textQuery = 'local businesses';
      if (categoryLabel && categoryLabel !== 'All businesses') {
        textQuery = categoryLabel;
      } else if (categoryKey && categoryKey !== 'all') {
        textQuery = categoryKey.replace(/_/g, ' ');
      } else if (Array.isArray(categoryTypes) && categoryTypes.length > 0) {
        textQuery = categoryTypes[0].replace(/_/g, ' ');
      }

      try {
        const textResponse = await fetch(
          'https://places.googleapis.com/v1/places:searchText',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Goog-Api-Key': key,
              'X-Goog-FieldMask': fieldMask,
            },
            body: JSON.stringify({
              textQuery,
              locationBias: {
                circle: {
                  center: {
                    latitude: Number(lat),
                    longitude: Number(lng),
                  },
                  radius: Math.min(Number(radius), 50000),
                },
              },
              maxResultCount: 20,
            }),
          }
        );

        if (textResponse.ok) {
          const textData = await textResponse.json();
          rawPlaces = textData.places || [];
        } else {
          if (textResponse.status === 429) {
            quotaExceeded = true;
          }
          lastError = await readError(textResponse, 'searchText');
        }
      } catch (e: any) {
        lastError = e?.message || 'searchText request failed';
        console.error('searchText fetch error:', e);
      }
    }

    // 3. Return verified commercial businesses only (NO fabricated dummy places)
    const places = formatPlaces(rawPlaces);

    // Distinguish "Google rejected the request" from a genuine zero-result search, so the UI
    // never reports "no businesses found" when the request was actually broken.
    let warning: string | undefined;
    if (places.length === 0) {
      if (quotaExceeded) {
        warning =
          'Google Places API daily quota limit reached. You can update your API key in Settings (You tab).';
      } else if (lastError) {
        warning = `Google Places request failed: ${lastError}`;
      }
    }

    return NextResponse.json({ places, ...(warning ? { warning } : {}) });
  } catch (error: any) {
    console.error('Nearby API handler error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
