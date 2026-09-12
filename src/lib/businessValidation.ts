import { BusinessPlace } from '@/types/business';

/**
 * List of Google Places types that represent physical roads, geographic borders,
 * political zones, or non-commercial address structures rather than active commercial businesses.
 */
const NON_BUSINESS_TYPES = new Set([
  'route',
  'street_address',
  'intersection',
  'political',
  'locality',
  'sublocality',
  'sublocality_level_1',
  'sublocality_level_2',
  'administrative_area_level_1',
  'administrative_area_level_2',
  'country',
  'postal_code',
  'postal_code_prefix',
  'postal_code_suffix',
  'natural_feature',
  'colloquial_area',
  'neighborhood',
  'premise',
  'subpremise',
  'plus_code',
]);

/**
 * Regex patterns identifying fake dummy placeholders, unnamed places,
 * plus codes, or generic numbers.
 */
const DUMMY_OR_UNNAMED_PATTERNS = [
  /^business\s*#\d+/i,                                // "Business #51", "Business #60", "Business#10"
  /^[a-z\s]+#\d+$/i,                                  // "Restaurant #1", "Store #2"
  /^#\d+/i,                                           // "#60", "#101"
  /^unnamed\b/i,                                      // "Unnamed Place", "Unnamed Road", "Unnamed"
  /^unknown\b/i,                                      // "Unknown Place", "Unknown"
  /^\s*$/i,                                           // Empty / whitespace
  /^(null|undefined|n\/a|none)$/i,                    // Literal string placeholders
  /^[2-9cfghjmpqrvwx]{4,8}\+[2-9cfghjmpqrvwx]{2,7}/i, // Plus codes (e.g. 87G8+QP)
];

/**
 * Regex patterns matching raw road addresses or highway names without a business name.
 */
const ROAD_OR_ADDRESS_ONLY_PATTERNS = [
  // E.g. '100 Main St', '125 Main St, Local District', '50 8th St Ste 821', '250 Oak Ave Apt 4B'
  /^\d+[\s\w.,#-]+?\s+(?:st|street|rd|road|ave|avenue|blvd|boulevard|dr|drive|ln|lane|way|ct|court|hwy|highway|pkwy|parkway|loop|cir|circle|pl|place|trail|row)(?:\s*(?:,|ste|suite|apt|unit|#|fl|floor|bldg|building|\d+).*|\s*,.*)?$/i,
  // E.g. 'Highway 101', 'US-11W', 'I-40 East', 'State Route 33'
  /^(?:state\s+route|sr|us|hwy|highway|interstate|i)[-\s]?\d+[a-z]?(?:\s+(?:east|west|north|south|e|w|n|s))?$/i,
];

/**
 * Validates whether a place is a legitimate commercial business and NOT:
 * - A generated dummy like "Business #XX"
 * - An unnamed road or location
 * - A pure street address or highway
 * - A non-business geographical type (route, intersection, locality, etc.)
 * - A permanently closed business
 */
export function isValidBusinessPlace(place: Partial<BusinessPlace> | null | undefined): boolean {
  if (!place) return false;

  const name = place.name?.trim() || '';
  if (!name) return false;

  // 1. Check dummy and unnamed name patterns
  for (const pattern of DUMMY_OR_UNNAMED_PATTERNS) {
    if (pattern.test(name)) {
      return false;
    }
  }

  // 2. Check road and highway address-only patterns
  for (const pattern of ROAD_OR_ADDRESS_ONLY_PATTERNS) {
    if (pattern.test(name)) {
      return false;
    }
  }

  // 3. Filter out permanently closed businesses
  if (place.businessStatus === 'CLOSED_PERMANENTLY') {
    return false;
  }

  // 4. Filter out non-business primary types
  if (place.primaryType && NON_BUSINESS_TYPES.has(place.primaryType.toLowerCase())) {
    return false;
  }

  // 5. Filter out places whose types are exclusively non-business
  if (place.types && place.types.length > 0) {
    const commercialTypes = place.types.filter(
      (t) =>
        !NON_BUSINESS_TYPES.has(t.toLowerCase()) &&
        t.toLowerCase() !== 'establishment' &&
        t.toLowerCase() !== 'point_of_interest'
    );
    if (
      place.types.some((t) => t === 'route' || t === 'street_address' || t === 'intersection') &&
      commercialTypes.length === 0
    ) {
      return false;
    }
  }

  return true;
}
