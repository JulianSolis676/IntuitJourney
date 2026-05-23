/**
 * Cache Service for Journey Results
 * 
 * Implements a resilient local caching strategy:
 * 1. First, always try to fetch from TfL API
 * 2. If successful, save to local cache (AsyncStorage)
 * 3. If TfL fails, try to retrieve from local cache
 * 4. If cache has data, show with "outdated" message
 * 5. If no cache, then it's a real error
 *
 * Why local cache only?
 * - Works without internet connection
 * - Fast response times (~30ms vs 500ms remote)
 * - Private to each user (no cloud data sharing)
 * - Optimized for mobile devices
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

interface CachedJourney {
  journeys: any[];
  timestamp: number;
  isOutdated: boolean;
}

const CACHE_KEY_PREFIX = 'journey_cache_';
const CACHE_EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Generate cache key from origin and destination
 */
export const generateCacheKey = (from: string, to: string): string => {
  const normalizedFrom = from.trim().toLowerCase();
  const normalizedTo = to.trim().toLowerCase();
  return `${CACHE_KEY_PREFIX}${normalizedFrom}_to_${normalizedTo}`;
};

/**
 * Save journey results to local cache (AsyncStorage)
 */
export const saveToLocalCache = async (
  from: string,
  to: string,
  journeys: any[]
): Promise<boolean> => {
  try {
    const cacheKey = generateCacheKey(from, to);
    const cachedData: CachedJourney = {
      journeys,
      timestamp: Date.now(),
      isOutdated: false,
    };

    await AsyncStorage.setItem(cacheKey, JSON.stringify(cachedData));
    console.log(`✅ Journey cached locally for ${from} → ${to}`);
    return true;
  } catch (error) {
    console.error('❌ Error saving to local cache:', error);
    return false;
  }
};

/**
 * Retrieve journey results from local cache
 */
export const getFromLocalCache = async (
  from: string,
  to: string
): Promise<CachedJourney | null> => {
  try {
    const cacheKey = generateCacheKey(from, to);
    const cachedData = await AsyncStorage.getItem(cacheKey);

    if (!cachedData) {
      console.log(`⚠️ No cache found for ${from} → ${to}`);
      return null;
    }

    const parsed: CachedJourney = JSON.parse(cachedData);
    const isExpired = Date.now() - parsed.timestamp > CACHE_EXPIRY_TIME;

    if (isExpired) {
      console.log(`⏰ Cache expired for ${from} → ${to}`);
      // Mark as outdated but still usable
      parsed.isOutdated = true;
    } else {
      console.log(`✅ Fresh cache found for ${from} → ${to}`);
      parsed.isOutdated = false;
    }

    return parsed;
  } catch (error) {
    console.error('❌ Error retrieving from local cache:', error);
    return null;
  }
};

/**
 * Clear all cached journeys
 */
export const clearAllCache = async (): Promise<boolean> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter((key) => key.startsWith(CACHE_KEY_PREFIX));

    if (cacheKeys.length > 0) {
      await AsyncStorage.multiRemove(cacheKeys);
      console.log(`✅ Cleared ${cacheKeys.length} cache entries`);
      return true;
    }

    console.log('ℹ️ No cache entries to clear');
    return true;
  } catch (error) {
    console.error('❌ Error clearing cache:', error);
    return false;
  }
};

/**
 * Get cache statistics
 */
export const getCacheStats = async (): Promise<{
  totalEntries: number;
  totalSize: string;
}> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter((key) => key.startsWith(CACHE_KEY_PREFIX));
    let totalSize = 0;

    for (const key of cacheKeys) {
      const data = await AsyncStorage.getItem(key);
      if (data) {
        totalSize += data.length;
      }
    }

    return {
      totalEntries: cacheKeys.length,
      totalSize: `${(totalSize / 1024).toFixed(2)} KB`,
    };
  } catch (error) {
    console.error('❌ Error getting cache stats:', error);
    return { totalEntries: 0, totalSize: '0 KB' };
  }
};


