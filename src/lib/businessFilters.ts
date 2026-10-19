import { BusinessPlace, CategoryKey } from '@/types/business';
import { CATEGORIES } from '@/lib/constants';
import { isSocialPageOnly } from '@/lib/pindropUtils';
import { matchesAdvancedFilters } from '@/lib/ratingFilterUtils';
import { isValidBusinessPlace } from '@/lib/businessValidation';
import { scoreLead, HOT_SCORE } from '@/lib/leadScore';
import { getAllXrays } from '@/lib/xray';

interface BusinessFilterOptions {
  opportunitiesOnly: boolean;
  socialPageOnly: boolean;
  hotOnly: boolean;
  selectedCategory: CategoryKey;
  selectedRatingRanges: string[];
  selectedReviewCountRanges: string[];
}

/**
 * Single source of truth for which businesses are visible. The map and the leads list
 * must agree — when this lived in both, a change to one silently desynced the pins
 * from the sidebar.
 */
export function filterBusinesses(
  businesses: BusinessPlace[],
  {
    opportunitiesOnly,
    socialPageOnly,
    hotOnly,
    selectedCategory,
    selectedRatingRanges,
    selectedReviewCountRanges,
  }: BusinessFilterOptions
): BusinessPlace[] {
  // Best leads first, so the caller works top-down.
  const xrays = getAllXrays();
  const scores = new Map(businesses.map((b) => [b.id, scoreLead(b, xrays[b.id]).score]));
  const score = (b: BusinessPlace) => scores.get(b.id) ?? 0;

  return businesses.filter((b) => {
    if (!isValidBusinessPlace(b)) return false;

    if (opportunitiesOnly) {
      if (b.hasWebsite && b.websiteURI && b.websiteURI.trim() !== '') return false;
    }

    if (hotOnly && score(b) < HOT_SCORE) return false;

    if (socialPageOnly) {
      if (!isSocialPageOnly(b.websiteURI)) return false;
    }

    if (selectedCategory && selectedCategory !== 'all') {
      const categoryObj = CATEGORIES.find((c) => c.key === selectedCategory);
      if (categoryObj && categoryObj.types.length > 0) {
        const matchesType = categoryObj.types.some(
          (t) => b.primaryType === t || b.types?.includes(t)
        );
        const matchesName = b.name.toLowerCase().includes(selectedCategory.replace(/_/g, ' '));
        if (!matchesType && !matchesName) return false;
      }
    }

    if (!matchesAdvancedFilters(b, selectedRatingRanges, selectedReviewCountRanges)) {
      return false;
    }

    return true;
  }).sort((a, b) => score(b) - score(a));
}
