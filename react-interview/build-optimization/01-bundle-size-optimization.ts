/**
 * Build Optimization & Bundle Size Management
 * 
 * Demonstrates code splitting, tree shaking, lazy loading, and bundle analysis
 * for optimizing React application load performance.
 */

// webpack.config.js example
export const webpackConfig = {
  // Code splitting configuration
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        // Vendor chunk for node_modules
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10,
          reuseExistingChunk: true,
        },
        // Common chunk for shared code
        common: {
          minChunks: 2,
          priority: 5,
          reuseExistingChunk: true,
        },
        // React and React DOM in separate chunk
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
          name: 'react-vendor',
          priority: 20,
        },
      },
    },
    // Tree shaking
    usedExports: true,
    sideEffects: false,
  },
  
  // Production optimizations
  mode: 'production',
  devtool: 'source-map',
  
  // Module resolution
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    alias: {
      '@': './src',
      'react-dom$': 'react-dom/profiling',
      'scheduler/tracing': 'scheduler/tracing-profiling',
    },
  },
};

// vite.config.ts example
export const viteConfig = {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'router': ['react-router', 'react-router-dom'],
          'ui-libs': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    sourcemap: true,
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
};

// Lazy loading components
import { lazy, Suspense } from 'react';

// Route-based code splitting
const EquipmentDashboard = lazy(() => import('./pages/EquipmentDashboard'));
const QualityAnalysis = lazy(() => import('./pages/QualityAnalysis'));
const InventoryManagement = lazy(() => import('./pages/InventoryManagement'));

// Component-based code splitting
const HeavyChart = lazy(() => 
  import('./components/HeavyChart').then(module => ({
    default: module.HeavyChart,
  }))
);

// Dynamic imports with preloading
export function preloadComponent(componentPath: string) {
  return import(componentPath);
}

// Bundle analyzer script
export const analyzeBundle = `
// package.json script
// "analyze": "webpack-bundle-analyzer dist/stats.json"

// Or with source-map-explorer
// "analyze": "source-map-explorer 'dist/**/*.js'"
`;

// Tree-shaking example - use named exports
export function utilityFunction1() {
  return 'function1';
}

export function utilityFunction2() {
  return 'function2';
}

// Import only what you need
// ✅ Good: import { utilityFunction1 } from './utils';
// ❌ Bad: import * as utils from './utils';

// Dynamic imports for conditional loading
export async function loadFeature(featureName: string) {
  switch (featureName) {
    case 'advanced-charts':
      return await import('./features/AdvancedCharts');
    case 'reporting':
      return await import('./features/Reporting');
    default:
      return null;
  }
}

// Preload critical resources
export function preloadCriticalResources() {
  // Preload fonts
  const fontLink = document.createElement('link');
  fontLink.rel = 'preload';
  fontLink.as = 'font';
  fontLink.href = '/fonts/main-font.woff2';
  fontLink.crossOrigin = 'anonymous';
  document.head.appendChild(fontLink);

  // Prefetch next route
  const prefetchLink = document.createElement('link');
  prefetchLink.rel = 'prefetch';
  prefetchLink.href = '/equipment-dashboard';
  document.head.appendChild(prefetchLink);
}

// Resource hints
export const resourceHints = `
<!-- In HTML head -->
<link rel="preconnect" href="https://api.example.com">
<link rel="dns-prefetch" href="https://cdn.example.com">
<link rel="preload" href="/critical.css" as="style">
<link rel="prefetch" href="/next-page.js" as="script">
`;

// Compression configuration
export const compressionConfig = `
// For Express.js
const compression = require('compression');
app.use(compression({
  level: 6,
  threshold: 1024, // Only compress files > 1KB
}));

// For Nginx
// gzip on;
// gzip_types text/plain text/css application/json application/javascript;
// gzip_min_length 1000;
`;

// Service Worker for caching
export const serviceWorkerCache = `
// Cache static assets
const CACHE_NAME = 'app-v1';
const STATIC_ASSETS = [
  '/',
  '/static/css/main.css',
  '/static/js/main.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
`;

// Performance monitoring
export function trackBundleSize() {
  if ('performance' in window && 'getEntriesByType' in performance) {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    
    resources.forEach((resource) => {
      if (resource.initiatorType === 'script' || resource.initiatorType === 'link') {
        console.log('Resource:', {
          name: resource.name,
          size: resource.transferSize,
          duration: resource.duration,
        });
      }
    });
  }
}

// Lazy load images
export function LazyImage({ src, alt }: { src: string; alt: string }) {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const imgRef = React.useRef<HTMLImageElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsLoaded(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: '50px' }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <img
      ref={imgRef}
      src={isLoaded ? src : undefined}
      alt={alt}
      loading="lazy"
      style={{ backgroundColor: '#f0f0f0' }}
    />
  );
}

// Bundle size limits
export const bundleSizeLimits = `
// .size-limit.json
[
  {
    "path": "dist/main.js",
    "limit": "200 KB"
  },
  {
    "path": "dist/vendor.js",
    "limit": "500 KB"
  }
]
`;

// Import React for type checking
import React from 'react';

