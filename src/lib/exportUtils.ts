import { BusinessPlace } from '@/types/business';

/**
 * Exports the list of businesses to a clean CSV file
 */
export function exportBusinessesToCSV(
  businesses: BusinessPlace[],
  filename: string = 'local_business_opportunities.csv'
) {
  if (!businesses.length) return;

  const headers = [
    'Name',
    'Has Website',
    'Website URL',
    'Phone Number',
    'Address',
    'Category',
    'Rating',
    'Review Count',
    'Business Status',
    'Google Maps URL',
    'Distance (m)',
  ];

  const escapeCSV = (val?: string | number | boolean | null) => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = businesses.map((b) => [
    escapeCSV(b.name),
    escapeCSV(b.hasWebsite ? 'Yes' : 'NO - Opportunity'),
    escapeCSV(b.websiteURI || ''),
    escapeCSV(b.nationalPhoneNumber || b.internationalPhoneNumber || ''),
    escapeCSV(b.formattedAddress || ''),
    escapeCSV(b.primaryTypeDisplayName || b.primaryType || ''),
    escapeCSV(b.rating || ''),
    escapeCSV(b.userRatingCount || ''),
    escapeCSV(b.businessStatus || ''),
    escapeCSV(b.googleMapsURI || ''),
    escapeCSV(b.distanceMeters ? Math.round(b.distanceMeters) : ''),
  ]);

  const csvContent =
    'data:text/csv;charset=utf-8,\uFEFF' +
    [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Copies a formatted text summary of no-website opportunities to the clipboard
 */
export async function copyOpportunitiesToClipboard(
  opportunities: BusinessPlace[]
): Promise<boolean> {
  if (!opportunities.length) return false;

  const lines = opportunities.map((b, i) => {
    const parts = [
      `${i + 1}. ${b.name}`,
      `   📍 Address: ${b.formattedAddress || 'N/A'}`,
      `   📞 Phone: ${b.nationalPhoneNumber || b.internationalPhoneNumber || 'N/A'}`,
      `   ⭐ Rating: ${b.rating ? `${b.rating} (${b.userRatingCount || 0} reviews)` : 'No reviews'}`,
      `   🏷️ Category: ${b.primaryTypeDisplayName || b.primaryType || 'Local Business'}`,
      `   🗺️ Maps: ${b.googleMapsURI || 'N/A'}`,
    ];
    return parts.join('\n');
  });

  const text = `=== LOCAL BUSINESS OPPORTUNITIES (NO WEBSITE) ===\nTotal Leads: ${opportunities.length}\n\n${lines.join('\n\n')}`;

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy text: ', err);
    return false;
  }
}

/**
 * Calculates distance in meters between two lat/lng coordinates (Haversine formula)
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) *
      Math.cos(phi2) *
      Math.sin(deltaLambda / 2) *
      Math.sin(deltaLambda / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
