import { NextRequest, NextResponse } from 'next/server';
import { isValidBusinessPlace } from '@/lib/businessValidation';
import { placesCaller } from '@/lib/serverApiKey';

// Only the search box uses this, and it shows name + address and moves the map. Keeping the
// mask to Pro-tier fields (no website/phone/rating) makes every keystroke cheaper.
const FIELD_MASK = 'places.id,places.displayName,places.formattedAddress,places.location,places.types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, lat, lng, radius, apiKey } = body;

    const caller = placesCaller(req, apiKey);

    if ('error' in caller) {
      return caller.error === 'cross-origin'
        ? NextResponse.json({ error: 'Cross-origin requests are not allowed.' }, { status: 403 })
        : NextResponse.json({ error: 'Google Maps API Key is required.' }, { status: 400 });
    }

    if (typeof query !== 'string' || !query.trim()) {
      return NextResponse.json({ error: 'Search query is required.' }, { status: 400 });
    }

    const payload: any = {
      textQuery: query.trim(),
      maxResultCount: 10,
    };

    // If coordinates are provided, bias the search around the current map viewport
    if (lat !== undefined && lng !== undefined) {
      payload.locationBias = {
        circle: {
          center: { latitude: Number(lat), longitude: Number(lng) },
          radius: Math.min(Number(radius || 5000), 50000),
        },
      };
    }

    let data: any;
    try {
      data = await caller.call('/places:searchText', { method: 'POST', fieldMask: FIELD_MASK, body: payload });
    } catch (e: any) {
      console.error('Google Places Text Search API error:', e?.status, e?.message);
      return NextResponse.json({ error: e?.message || 'Google Places Text Search request failed.' }, { status: e?.status || 502 });
    }

    const places = (data.places || []).map((p: any) => ({
      id: p.id,
      name: p.displayName?.text || '',
      formattedAddress: p.formattedAddress || '',
      location: { lat: p.location?.latitude ?? 0, lng: p.location?.longitude ?? 0 },
      types: p.types || [],
    }));

    // The top hit may be a city or street, which is still a valid place to move the map to.
    const top = places[0];
    const targetCenter = top
      ? { lat: top.location.lat, lng: top.location.lng, address: top.formattedAddress || top.name || query }
      : null;

    return NextResponse.json({ places: places.filter(isValidBusinessPlace), targetCenter });
  } catch (error: any) {
    console.error('Text Search API handler error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
