const Redis = require('ioredis');

// Initialize Redis client
let redis;

try {
  // Only try to connect to Redis if REDIS_URL is provided (production)
  if (process.env.REDIS_URL) {
    redis = new Redis(process.env.REDIS_URL, {
      retryDelayOnFailover: 100,
      enableReadyCheck: false,
      maxRetriesPerRequest: null,
    });
    
    redis.on('connect', () => {
      console.log('✅ Redis connected successfully');
    });
    
    redis.on('error', (err) => {
      console.log('❌ Redis connection error:', err.message);
    });
  } else {
    console.log('ℹ️ Redis not configured - running without cache (development mode)');
    redis = null;
  }
} catch (error) {
  console.log('❌ Redis initialization failed:', error.message);
  redis = null;
}

// Cache key generators
const CACHE_KEYS = {
  allCompositions: 'compositions:all',
  compositionById: (id) => `composition:${id}`,
  compositionsByGenre: (genre) => `compositions:genre:${genre}`,
  health: 'api:health'
};

// Cache durations (in seconds)
const CACHE_DURATIONS = {
  allCompositions: 300,    // 5 minutes
  singleComposition: 1800, // 30 minutes
  genreCompositions: 600,  // 10 minutes
  health: 60               // 1 minute
};

/**
 * Get data from cache
 */
async function getFromCache(key) {
  if (!redis) return null;
  
  try {
    const cached = await redis.get(key);
    if (cached) {
      console.log(`🎯 Cache HIT: ${key}`);
      return JSON.parse(cached);
    }
    console.log(`❌ Cache MISS: ${key}`);
    return null;
  } catch (error) {
    console.log(`❌ Cache GET error for ${key}:`, error.message);
    return null;
  }
}

/**
 * Set data in cache
 */
async function setInCache(key, data, duration = 300) {
  if (!redis) return false;
  
  try {
    await redis.setex(key, duration, JSON.stringify(data));
    console.log(`💾 Cache SET: ${key} (expires in ${duration}s)`);
    return true;
  } catch (error) {
    console.log(`❌ Cache SET error for ${key}:`, error.message);
    return false;
  }
}

/**
 * Delete specific cache keys
 */
async function deleteFromCache(keys) {
  if (!redis || !Array.isArray(keys)) return false;
  
  try {
    if (keys.length > 0) {
      await redis.del(...keys);
      console.log(`🗑️ Cache DELETED: ${keys.join(', ')}`);
    }
    return true;
  } catch (error) {
    console.log(`❌ Cache DELETE error:`, error.message);
    return false;
  }
}

/**
 * Clear all composition caches (useful after updates)
 */
async function clearCompositionCaches() {
  if (!redis) return false;
  
  try {
    const pattern = 'composition*';
    const keys = await redis.keys(pattern);
    
    if (keys.length > 0) {
      await redis.del(...keys);
      console.log(`🧹 Cleared ${keys.length} composition cache entries`);
    }
    
    return true;
  } catch (error) {
    console.log(`❌ Error clearing composition caches:`, error.message);
    return false;
  }
}

/**
 * Get cache statistics
 */
async function getCacheStats() {
  if (!redis) return { connected: false };
  
  try {
    const info = await redis.info('memory');
    const keyCount = await redis.dbsize();
    
    return {
      connected: true,
      keyCount,
      memoryUsage: info.split('\n').find(line => line.startsWith('used_memory_human:'))?.split(':')[1]?.trim() || 'unknown'
    };
  } catch (error) {
    return { connected: false, error: error.message };
  }
}

/**
 * Cached wrapper for Notion API calls
 */
async function withCache(cacheKey, duration, fetchFunction) {
  // Try cache first
  const cached = await getFromCache(cacheKey);
  if (cached) {
    return cached;
  }
  
  // Cache miss - fetch fresh data
  try {
    const freshData = await fetchFunction();
    await setInCache(cacheKey, freshData, duration);
    return freshData;
  } catch (error) {
    console.log(`❌ Error in withCache for ${cacheKey}:`, error.message);
    throw error;
  }
}

module.exports = {
  redis,
  CACHE_KEYS,
  CACHE_DURATIONS,
  getFromCache,
  setInCache,
  deleteFromCache,
  clearCompositionCaches,
  getCacheStats,
  withCache
};