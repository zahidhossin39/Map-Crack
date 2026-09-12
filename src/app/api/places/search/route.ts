import { NextRequest, NextResponse } from 'next/server';
import { isValidBusinessPlace } from '@/lib/businessValidation';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, lat, lng, radius, apiKey } = body;

    const key = apiKey || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!key) {
      return NextResponse.json(
        { error: 'Google Maps API Key is required.' },
        { status: 400 }
      );
    }

    if (!query || !query.trim()) {
      return NextResponse.json(
        { error: 'Search query is required.' },
        { status: 400 }
      );
    }

    const payload: any = {
      textQuery: query.trim(),
      maxResultCount: 20,
    };

    // If coordinates are provided, bias the search around the current map viewport
    if (lat !== undefined && lng !== undefined) {
      payload.locationBias = {
        circle: {
          center: {
            latitude: Number(lat),
            longitude: Number(lng),
          },
          radius: Math.min(Number(radius || 5000), 50000),
        },
      };
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

    const response = await fetch(
      'https://places.googleapis.com/v1/places:searchText',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': key,
          'X-Goog-FieldMask': fieldMask,
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('Google Places Text Search API error:', data);
      return NextResponse.json(
        {
          error: data.error?.message || 'Google Places Text Search request failed.',
          status: data.error?.status,
        },
        { status: response.status }
      );
    }

    const rawPlaces = data.places || [];

    const places = rawPlaces.map((p: any) => {
      const website = p.websiteUri?.trim();
      const hasWebsite = Boolean(website && website.length > 0);

      const latCoord = p.location?.latitude ?? 0;
      const lngCoord = p.location?.longitude ?? 0;

      const photos = p.photos?.map((ph: any) => ({
        url: `https://places.googleapis.com/v1/${ph.name}/media?maxWidthPx=800&key=${key}`,
        authorAttributions: ph.authorAttributions,
      })) || [];

      return {
        id: p.id,
        name: p.displayName?.text || 'Unnamed Place',
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
        googleMapsURI: p.googleMapsUri || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.displayName?.text || '')}`,
      };
    });

    // Determine target center for the search (can be a city, locality, address, or business)
    let targetCenter = null;
    if (places.length > 0) {
      targetCenter = {
        lat: places[0].location.lat,
        lng: places[0].location.lng,
        address: places[0].formattedAddress || places[0].name || query,
      };
    }

    // Filter places so suggestions only list valid commercial businesses
    const validPlaces = places.filter(isValidBusinessPlace);

    return NextResponse.json({ places: validPlaces, targetCenter });
  } catch (error: any) {
    console.error('Text Search API handler error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
