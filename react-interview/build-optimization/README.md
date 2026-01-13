# Build Optimization & Code Splitting - Interview Deep Dive

Production-ready build optimization strategies for React applications to minimize bundle size and improve load times.

## 🎯 Key Metrics

- **Initial Load**: < 200KB gzipped for critical path
- **Time to Interactive**: < 3 seconds on 3G
- **Lighthouse Score**: > 90/100

---

## Bundle Analysis

```bash
# Analyze bundle size
npm run build
npx webpack-bundle-analyzer dist/stats.json
```

**Look for**:
- Large dependencies (>100KB)
- Duplicate dependencies
- Unused exports

---

## Key Optimization Strategies

### 1. Code Splitting

**Route-based splitting** (most impact):

```typescript
// ❌ BAD: Everything in main bundle
import ComplianceModule from './ComplianceModule';
import ReportsModule from './ReportsModule';
import SettingsModule from './SettingsModule';

// ✅ GOOD: Split by route
const ComplianceModule = lazy(() => import('./ComplianceModule'));
const ReportsModule = lazy(() => import('./ReportsModule'));
const SettingsModule = lazy(() => import('./SettingsModule'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/compliance" element={<ComplianceModule />} />
        <Route path="/reports" element={<ReportsModule />} />
        <Route path="/settings" element={<SettingsModule />} />
      </Routes>
    </Suspense>
  );
}
```

**Component-level splitting**:

```typescript
// Heavy chart library loaded only when needed
const Chart = lazy(() => import('./Chart'));

function Dashboard() {
  const [showChart, setShowChart] = useState(false);

  return (
    <div>
      <button onClick={() => setShowChart(true)}>Show Chart</button>
      {showChart && (
        <Suspense fallback={<ChartSkeleton />}>
          <Chart data={data} />
        </Suspense>
      )}
    </div>
  );
}
```

### 2. Tree Shaking

```typescript
// ❌ BAD: Imports entire library
import _ from 'lodash'; // 70KB
import * as dateFns from 'date-fns'; // 100KB

// ✅ GOOD: Import only what you need
import debounce from 'lodash/debounce'; // 5KB
import { format } from 'date-fns/format'; // 10KB
```

### 3. Dynamic Imports

```typescript
// Load heavy library only when needed
async function exportToPDF() {
  const jsPDF = await import('jspdf'); // Load on demand
  const doc = new jsPDF.default();
  doc.save('report.pdf');
}
```

### 4. Optimize Dependencies

**Replace heavy libraries**:

```typescript
// ❌ moment.js (70KB)
import moment from 'moment';

// ✅ date-fns (10-20KB with tree shaking)
import { format } from 'date-fns';

// ❌ lodash (70KB)
import _ from 'lodash';

// ✅ Native + specific imports (5-10KB)
import debounce from 'lodash/debounce';
```

### 5. Production Build

```json
// package.json
{
  "scripts": {
    "build": "vite build --mode production",
    "analyze": "vite-bundle-visualizer"
  }
}
```

**Vite/Webpack config**:

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs
        dead_code: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          charts: ['recharts', 'd3'],
          forms: ['react-hook-form', 'zod'],
        },
      },
    },
  },
});
```

---

## 🔑 Key Strategies

- ✅ Route-based code splitting
- ✅ Lazy load heavy components
- ✅ Tree shaking (named imports)
- ✅ Replace heavy dependencies
- ✅ Dynamic imports for rare features
- ✅ Bundle analysis & monitoring
- ✅ Production builds optimized

**Target**: Main bundle < 200KB, total < 1MB

Good luck with your Adobe TechGRC interview! 🚀
