// Performance utilities for optimizing React components
import React from "react";

// Debounce function to limit how often a function can be called
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Throttle function to limit function execution frequency
export const throttle = (func, limit) => {
  let inThrottle;
  return function () {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Intersection Observer for lazy loading and performance
export const createIntersectionObserver = (callback, options = {}) => {
  const defaultOptions = {
    root: null,
    rootMargin: "50px",
    threshold: 0.1,
    ...options,
  };

  return new IntersectionObserver(callback, defaultOptions);
};

// Virtual scrolling helper for large lists
export const createVirtualScroller = (items, itemHeight, containerHeight) => {
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const totalHeight = items.length * itemHeight;

  return {
    getVisibleRange: (scrollTop) => {
      const startIndex = Math.floor(scrollTop / itemHeight);
      const endIndex = Math.min(startIndex + visibleCount, items.length);
      return { startIndex, endIndex };
    },
    getVisibleItems: (scrollTop) => {
      const { startIndex, endIndex } = this.getVisibleRange(scrollTop);
      return items.slice(startIndex, endIndex);
    },
    totalHeight,
    itemHeight,
  };
};

// Memory management utilities
export const cleanupEventListeners = (element, events) => {
  events.forEach(({ event, handler }) => {
    element.removeEventListener(event, handler);
  });
};

// Performance monitoring
export const measurePerformance = (name, fn) => {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  console.log(`${name} took ${end - start} milliseconds`);
  return result;
};

// Optimize re-renders with shallow comparison
export const shallowEqual = (obj1, obj2) => {
  if (obj1 === obj2) return true;
  if (obj1 == null || obj2 == null) return false;
  if (typeof obj1 !== "object" || typeof obj2 !== "object") return false;

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  for (const key of keys1) {
    if (!keys2.includes(key) || obj1[key] !== obj2[key]) {
      return false;
    }
  }

  return true;
};

// Batch state updates for better performance
export const batchStateUpdates = (setStateFunctions) => {
  return Promise.all(setStateFunctions.map((fn) => fn()));
};

// Optimize image loading
export const preloadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

// Optimize CSS animations
export const optimizeAnimations = () => {
  // Disable animations on low-end devices
  const isLowEndDevice =
    navigator.hardwareConcurrency <= 2 || navigator.deviceMemory <= 2;

  if (isLowEndDevice) {
    document.documentElement.style.setProperty("--animation-duration", "0.1s");
    document.documentElement.style.setProperty("--transition-duration", "0.1s");
  }
};

// Reduce layout thrashing
export const batchDOMReads = (readFunctions) => {
  // Force a reflow to batch all reads
  if (typeof document !== "undefined" && document.body) {
    // eslint-disable-next-line no-unused-expressions
    document.body.offsetHeight;
  }

  const results = readFunctions.map((fn) => fn());

  // Force another reflow to batch all writes
  if (typeof document !== "undefined" && document.body) {
    // eslint-disable-next-line no-unused-expressions
    document.body.offsetHeight;
  }

  return results;
};

// Optimize scroll performance
export const optimizeScroll = (element, handler) => {
  let ticking = false;

  const optimizedHandler = () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        handler();
        ticking = false;
      });
      ticking = true;
    }
  };

  element.addEventListener("scroll", optimizedHandler, { passive: true });

  return () => {
    element.removeEventListener("scroll", optimizedHandler);
  };
};

// Memory leak prevention
export const createCleanupFunction = () => {
  const cleanupFunctions = [];

  return {
    add: (fn) => cleanupFunctions.push(fn),
    execute: () => {
      cleanupFunctions.forEach((fn) => {
        try {
          fn();
        } catch (error) {
          console.warn("Cleanup function error:", error);
        }
      });
      cleanupFunctions.length = 0;
    },
  };
};

// Optimize React component rendering
export const withPerformanceOptimization = (Component) => {
  return React.memo(Component, (prevProps, nextProps) => {
    return shallowEqual(prevProps, nextProps);
  });
};

// Reduce bundle size by lazy loading
export const lazyLoadComponent = (importFunc, fallback = null) => {
  const LazyComponent = React.lazy(importFunc);

  return (props) => (
    <React.Suspense fallback={fallback}>
      <LazyComponent {...props} />
    </React.Suspense>
  );
};

// Optimize API calls
export const createOptimizedAPI = (baseURL) => {
  const cache = new Map();
  const pendingRequests = new Map();

  return {
    get: async (url, options = {}) => {
      const cacheKey = `${url}-${JSON.stringify(options)}`;

      // Check cache first
      if (cache.has(cacheKey)) {
        return cache.get(cacheKey);
      }

      // Check if request is already pending
      if (pendingRequests.has(cacheKey)) {
        return pendingRequests.get(cacheKey);
      }

      // Make the request
      const request = fetch(`${baseURL}${url}`, options)
        .then((response) => response.json())
        .then((data) => {
          cache.set(cacheKey, data);
          pendingRequests.delete(cacheKey);
          return data;
        })
        .catch((error) => {
          pendingRequests.delete(cacheKey);
          throw error;
        });

      pendingRequests.set(cacheKey, request);
      return request;
    },

    clearCache: () => {
      cache.clear();
    },
  };
};

// Performance monitoring hook
export const usePerformanceMonitor = (componentName) => {
  const renderCount = React.useRef(0);
  const lastRenderTime = React.useRef(performance.now());
  const isInitialized = React.useRef(false);

  React.useEffect(() => {
    // Only track renders after initial mount to prevent infinite loops
    if (!isInitialized.current) {
      isInitialized.current = true;
      return;
    }

    renderCount.current += 1;
    const currentTime = performance.now();
    const timeSinceLastRender = currentTime - lastRenderTime.current;

    // Only log in development and limit frequency to prevent spam
    if (process.env.NODE_ENV === "development" && renderCount.current % 100 === 0) {
      console.log(
        `${componentName} rendered ${
          renderCount.current
        } times, last render took ${timeSinceLastRender.toFixed(2)}ms`
      );
    }

    lastRenderTime.current = currentTime;
  });

  return {
    renderCount: renderCount.current,
    timeSinceLastRender: performance.now() - lastRenderTime.current,
  };
};

export default {
  debounce,
  throttle,
  createIntersectionObserver,
  createVirtualScroller,
  cleanupEventListeners,
  measurePerformance,
  shallowEqual,
  batchStateUpdates,
  preloadImage,
  optimizeAnimations,
  batchDOMReads,
  optimizeScroll,
  createCleanupFunction,
  withPerformanceOptimization,
  lazyLoadComponent,
  createOptimizedAPI,
  usePerformanceMonitor,
};
