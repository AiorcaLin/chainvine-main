// Performance optimization tool functions
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Cache tool
export const createCache = <T>(maxSize: number = 100) => {
  const cache = new Map<string, {
    value: T;
    timestamp: number;
  }>();

  return {
    get: (key: string) => {
      const item = cache.get(key);
      if (item && Date.now() - item.timestamp < 5 * 60 * 1000) { // 5 minutes expiration
        return item.value;
      }
      cache.delete(key);
      return null;
    },
    set: (key: string, value: T) => {
      if (cache.size >= maxSize) {
        // Delete the oldest item
        const oldestKey = Array.from(cache.entries())
          .sort((a, b) => a[1].timestamp - b[1].timestamp)[0][0];
        cache.delete(oldestKey);
      }
      cache.set(key, {
        value,
        timestamp: Date.now()
      });
    }
  };
}; 