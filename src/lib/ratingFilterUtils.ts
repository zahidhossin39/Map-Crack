import type { BusinessPlace } from '@/types/business';

export interface RatingFilterOption {
  key: string;
  label: string;
  badge?: string;
  minRating: number;
  maxRating: number;
  unratedOnly?: boolean;
}

export interface ReviewCountFilterOption {
  key: string;
  label: string;
  subtitle: string;
  minCount: number;
  maxCount: number;
}

export const RATING_FILTER_OPTIONS: RatingFilterOption[] = [
  {
    key: '4.6-5.0',
    label: '4.6 – 5.0',
    badge: 'Top rated',
    minRating: 4.6,
    maxRating: 5.0,
  },
  {
    key: '4.0-4.5',
    label: '4.0 – 4.5',
    badge: 'High rated',
    minRating: 4.0,
    maxRating: 4.5999,
  },
  {
    key: '3.0-3.9',
    label: '3.0 – 3.9',
    badge: 'Average',
    minRating: 3.0,
    maxRating: 3.9999,
  },
  {
    key: 'under-3.0',
    label: 'Under 3.0',
    badge: 'Below 3.0',
    minRating: 0.01,
    maxRating: 2.9999,
  },
  {
    key: 'unrated',
    label: 'No ratings yet',
    badge: '0 reviews',
    minRating: 0,
    maxRating: 0,
    unratedOnly: true,
  },
];

export const REVIEW_COUNT_FILTER_OPTIONS: ReviewCountFilterOption[] = [
  {
    key: 'under-20',
    label: 'Under 20',
    subtitle: '0 – 19 reviews',
    minCount: 0,
    maxCount: 19,
  },
  {
    key: '20-50',
    label: '20 – 50',
    subtitle: '20 – 50 reviews',
    minCount: 20,
    maxCount: 50,
  },
  {
    key: '50-100',
    label: '50 – 100',
    subtitle: '50 – 100 reviews',
    minCount: 50,
    maxCount: 100,
  },
  {
    key: '100-200',
    label: '100 – 200',
    subtitle: '100 – 200 reviews',
    minCount: 100,
    maxCount: 200,
  },
  {
    key: '200+',
    label: '200+',
    subtitle: 'Above 200 reviews',
    minCount: 201,
    maxCount: Infinity,
  },
];

/**
 * Checks if a business's rating satisfies the selected rating ranges.
 * If no rating ranges are selected, returns true (no filter applied).
 */
function matchesRatingFilter(
  rating: number | null | undefined,
  selectedRanges: string[]
): boolean {
  if (!selectedRanges || selectedRanges.length === 0) return true;

  const numericRating = typeof rating === 'number' ? rating : 0;
  const isUnrated = !rating || rating === 0;

  return selectedRanges.some((rangeKey) => {
    const opt = RATING_FILTER_OPTIONS.find((o) => o.key === rangeKey);
    if (!opt) return true;

    if (opt.unratedOnly) {
      return isUnrated;
    }

    if (isUnrated) {
      return false;
    }

    return numericRating >= opt.minRating && numericRating <= opt.maxRating;
  });
}

/**
 * Checks if a business's review count satisfies the selected review count ranges.
 * If no review count ranges are selected, returns true (no filter applied).
 */
function matchesReviewCountFilter(
  userRatingCount: number | null | undefined,
  selectedRanges: string[]
): boolean {
  if (!selectedRanges || selectedRanges.length === 0) return true;

  const count = typeof userRatingCount === 'number' ? userRatingCount : 0;

  return selectedRanges.some((rangeKey) => {
    const opt = REVIEW_COUNT_FILTER_OPTIONS.find((o) => o.key === rangeKey);
    if (!opt) return true;

    return count >= opt.minCount && count <= opt.maxCount;
  });
}

/**
 * Combined matcher for advanced rating and review count filters.
 * Returns true if the business matches both rating criteria AND review count criteria.
 * If neither is selected, returns true.
 */
export function matchesAdvancedFilters(
  business: BusinessPlace,
  selectedRatingRanges: string[],
  selectedReviewCountRanges: string[]
): boolean {
  const ratingMatches = matchesRatingFilter(business.rating, selectedRatingRanges);
  if (!ratingMatches) return false;

  const reviewCountMatches = matchesReviewCountFilter(
    business.userRatingCount,
    selectedReviewCountRanges
  );
  if (!reviewCountMatches) return false;

  return true;
}
