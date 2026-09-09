import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { lat, lng, radius = 750, categoryTypes = [], apiKey } = body;

    const key = apiKey || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!key) {
      return NextResponse.json(
        { error: 'Google Maps API Key is required.' },
        { status: 400 }
      );
    }

    if (lat === undefined || lng === undefined) {
      return NextResponse.json(
        { error: 'Latitude and Longitude are required.' },
        { status: 400 }
      );
    }

    const payload: any = {
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
      payload.includedPrimaryTypes = categoryTypes.slice(0, 50);
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
      'https://places.googleapis.com/v1/places:searchNearby',
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
      console.error('Google Places Nearby API error:', data);
      return NextResponse.json(
        {
          error: data.error?.message || 'Google Places API request failed.',
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

      // Extract photo references if present
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

    return NextResponse.json({ places });
  } catch (error: any) {
    console.error('Nearby API handler error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
