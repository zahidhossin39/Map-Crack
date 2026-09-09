import { BusinessPlace } from '@/types/business';
import { calculateDistanceMeters } from '@/lib/exportUtils';

/**
 * Generates realistic local business places around coordinates for instant interactive testing
 * when an API key is missing, or for demo exploration.
 */
export function generateSampleBusinesses(
  centerLat: number,
  centerLng: number,
  radiusMeters: number,
  categoryKey: string = 'all'
): BusinessPlace[] {
  const sampleTemplates = [
    {
      name: "Bella's Artisan Bakery & Pastry",
      category: 'restaurant',
      typeDisplay: 'Bakery & Cafe',
      hasWebsite: false, // OPPORTUNITY!
      phone: '+1 (212) 555-0142',
      rating: 4.8,
      reviewsCount: 142,
      hours: [
        'Monday: 7:00 AM – 6:00 PM',
        'Tuesday: 7:00 AM – 6:00 PM',
        'Wednesday: 7:00 AM – 6:00 PM',
        'Thursday: 7:00 AM – 6:00 PM',
        'Friday: 7:00 AM – 8:00 PM',
        'Saturday: 8:00 AM – 8:00 PM',
        'Sunday: 8:00 AM – 4:00 PM',
      ],
      photoUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80',
      addressSuffix: 'Main St',
    },
    {
      name: 'Apex Auto Repair & Diagnostics',
      category: 'automotive',
      typeDisplay: 'Auto Repair Shop',
      hasWebsite: false, // OPPORTUNITY!
      phone: '+1 (212) 555-0189',
      rating: 4.9,
      reviewsCount: 88,
      hours: [
        'Monday - Friday: 8:00 AM – 6:00 PM',
        'Saturday: 9:00 AM – 3:00 PM',
        'Sunday: Closed',
      ],
      photoUrl: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=800&auto=format&fit=crop&q=80',
      addressSuffix: 'Commercial Blvd',
    },
    {
      name: 'Golden Dragon Gourmet Cuisine',
      category: 'restaurant',
      typeDisplay: 'Chinese Restaurant',
      hasWebsite: true,
      websiteURI: 'https://goldendragon-example.com',
      phone: '+1 (212) 555-0193',
      rating: 4.5,
      reviewsCount: 310,
      hours: [
        'Monday - Sunday: 11:30 AM – 10:30 PM',
      ],
      photoUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80',
      addressSuffix: 'Broadway Ave',
    },
    {
      name: 'Dr. Emily Vance Family Dental',
      category: 'health',
      typeDisplay: 'Dental Clinic',
      hasWebsite: false, // OPPORTUNITY!
      phone: '+1 (212) 555-0174',
      rating: 5.0,
      reviewsCount: 64,
      hours: [
        'Monday - Thursday: 8:30 AM – 5:00 PM',
        'Friday: 8:30 AM – 2:00 PM',
        'Saturday - Sunday: Closed',
      ],
      photoUrl: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800&auto=format&fit=crop&q=80',
      addressSuffix: 'Park Ave Suite 400',
    },
    {
      name: 'Urban Thread Boutique & Tailoring',
      category: 'store',
      typeDisplay: 'Clothing Store',
      hasWebsite: false, // OPPORTUNITY!
      phone: '+1 (212) 555-0128',
      rating: 4.7,
      reviewsCount: 52,
      hours: [
        'Tuesday - Saturday: 10:00 AM – 7:00 PM',
        'Sunday: 12:00 PM – 5:00 PM',
        'Monday: Closed',
      ],
      photoUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop&q=80',
      addressSuffix: 'Market St',
    },
    {
      name: 'Blue Harbor Seafood Grill',
      category: 'restaurant',
      typeDisplay: 'Seafood Restaurant',
      hasWebsite: true,
      websiteURI: 'https://blueharborgriil-sample.com',
      phone: '+1 (212) 555-0155',
      rating: 4.6,
      reviewsCount: 220,
      hours: [
        'Monday - Sunday: 12:00 PM – 11:00 PM',
      ],
      photoUrl: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&auto=format&fit=crop&q=80',
      addressSuffix: 'Waterfront Way',
    },
    {
      name: 'Precision Plumbing & Drain Co.',
      category: 'services',
      typeDisplay: 'Plumbing Service',
      hasWebsite: false, // OPPORTUNITY!
      phone: '+1 (212) 555-0112',
      rating: 4.9,
      reviewsCount: 95,
      hours: [
        '24/7 Emergency Service',
      ],
      photoUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
      addressSuffix: 'Industrial Pkwy',
    },
    {
      name: 'Luxe Hair Studio & Day Spa',
      category: 'beauty',
      typeDisplay: 'Hair & Beauty Salon',
      hasWebsite: false, // OPPORTUNITY!
      phone: '+1 (212) 555-0163',
      rating: 4.8,
      reviewsCount: 118,
      hours: [
        'Tuesday - Saturday: 9:00 AM – 7:00 PM',
        'Sunday - Monday: Closed',
      ],
      photoUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&auto=format&fit=crop&q=80',
      addressSuffix: 'Cedar Lane',
    },
    {
      name: 'The Roasted Bean Espresso Bar',
      category: 'cafe',
      typeDisplay: 'Coffee Shop',
      hasWebsite: true,
      websiteURI: 'https://roastedbean-coffee.com',
      phone: '+1 (212) 555-0133',
      rating: 4.7,
      reviewsCount: 420,
      hours: [
        'Monday - Friday: 6:30 AM – 7:00 PM',
        'Saturday - Sunday: 7:30 AM – 6:00 PM',
      ],
      photoUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop&q=80',
      addressSuffix: 'Oak Street',
    },
    {
      name: 'Metro Locksmith & Security',
      category: 'services',
      typeDisplay: 'Locksmith Service',
      hasWebsite: false, // OPPORTUNITY!
      phone: '+1 (212) 555-0181',
      rating: 4.9,
      reviewsCount: 76,
      hours: ['24/7 Available'],
      photoUrl: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=800&auto=format&fit=crop&q=80',
      addressSuffix: '5th Ave',
    },
    {
      name: 'Grandview Boutique Hotel',
      category: 'lodging',
      typeDisplay: 'Hotel',
      hasWebsite: true,
      websiteURI: 'https://grandviewhotel-example.com',
      phone: '+1 (212) 555-0199',
      rating: 4.4,
      reviewsCount: 180,
      hours: ['Open 24 Hours'],
      photoUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80',
      addressSuffix: 'Highland Blvd',
    },
  ];

  // Filter by category if requested
  const filteredTemplates =
    categoryKey === 'all'
      ? sampleTemplates
      : sampleTemplates.filter((t) => t.category === categoryKey);

  const templatesToUse = filteredTemplates.length > 0 ? filteredTemplates : sampleTemplates;

  // Distribute places in a circle around center coordinates within radius
  return templatesToUse.map((tmpl, index) => {
    const angle = (index / templatesToUse.length) * 2 * Math.PI + (index * 0.3);
    const distFraction = 0.25 + (0.65 * ((index % 5) / 4));
    const dist = radiusMeters * distFraction;

    // 1 deg lat ~ 111,000m
    const latOffset = (dist * Math.cos(angle)) / 111000;
    const lngOffset = (dist * Math.sin(angle)) / (111000 * Math.cos((centerLat * Math.PI) / 180));

    const lat = centerLat + latOffset;
    const lng = centerLng + lngOffset;

    const actualDist = calculateDistanceMeters(centerLat, centerLng, lat, lng);

    return {
      id: `sample-place-${index}-${tmpl.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      name: tmpl.name,
      formattedAddress: `${100 + index * 12} ${tmpl.addressSuffix}`,
      location: { lat, lng },
      hasWebsite: tmpl.hasWebsite,
      websiteURI: tmpl.hasWebsite ? tmpl.websiteURI : undefined,
      nationalPhoneNumber: tmpl.phone,
      internationalPhoneNumber: tmpl.phone,
      rating: tmpl.rating,
      userRatingCount: tmpl.reviewsCount,
      primaryTypeDisplayName: tmpl.typeDisplay,
      primaryType: tmpl.category,
      types: [tmpl.category],
      businessStatus: 'OPERATIONAL',
      regularOpeningHours: {
        openNow: true,
        weekdayDescriptions: tmpl.hours,
      },
      photos: [
        {
          url: tmpl.photoUrl,
          getURI: () => tmpl.photoUrl,
        },
      ],
      googleMapsURI: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(tmpl.name)}`,
      distanceMeters: actualDist,
    };
  });
}
