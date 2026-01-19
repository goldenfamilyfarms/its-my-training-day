/**
 * Question 5: Micro-Frontend Architecture
 * 
 * Implements Module Federation with Webpack 5 for multi-team development
 * with independent deployments, shared dependencies, and event bus communication.
 */

import React, { useState, useEffect, Suspense, lazy } from 'react';

// Types
interface RemoteModule {
  module: string;
  component: string;
  fallback?: React.ComponentType;
}

interface SharedState {
  selectedEquipment: string | null;
  activeAlerts: any[];
  userPermissions: Record<string, boolean>;
}

// Event Bus for cross-module communication
class EventBus {
  private events: Map<string, Array<(data: any) => void>> = new Map();

  subscribe(event: string, callback: (data: any) => void): () => void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }

    this.events.get(event)!.push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.events.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  emit(event: string, data: any): void {
    const callbacks = this.events.get(event);
    if (!callbacks) return;

    callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event handler for ${event}:`, error);
      }
    });
  }

  unsubscribe(event: string, callback: (data: any) => void): void {
    const callbacks = this.events.get(event);
    if (!callbacks) return;

    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }
}

export const eventBus = new EventBus();

// Remote module loader with error handling
interface RemoteModuleLoaderProps {
  module: string;
  component: string;
  fallback?: React.ComponentType;
  onError?: (error: Error) => void;
}

function RemoteModuleLoader({ 
  module, 
  component, 
  fallback: Fallback,
  onError 
}: RemoteModuleLoaderProps) {
  const [Module, setModule] = useState<React.ComponentType | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const loadModule = async () => {
      try {
        // Dynamic import with retry logic
        const container = await loadRemoteContainer(module);
        const factory = await container.get(`./${component}`);
        const LoadedModule = factory();
        setModule(() => LoadedModule.default || LoadedModule);
        setError(null);
      } catch (err) {
        console.error(`Failed to load module ${module}:`, err);
        const loadError = err instanceof Error ? err : new Error('Unknown error');
        setError(loadError);
        onError?.(loadError);

        // Fallback to local version if available
        if (Fallback && retryCount < 2) {
          setRetryCount(prev => prev + 1);
          setTimeout(() => {
            setModule(() => Fallback);
          }, 1000 * (retryCount + 1)); // Exponential backoff
        }
      }
    };

    loadModule();
  }, [module, component, Fallback, retryCount, onError]);

  if (error && !Fallback) {
    return (
      <div role="alert" style={{ padding: '20px', border: '1px solid #f00' }}>
        <h3>Failed to load {module} module</h3>
        <p>{error.message}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  if (!Module) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div className="spinner" role="status" aria-label="Loading module">
          Loading {module}...
        </div>
      </div>
    );
  }

  return <Module />;
}

// Load remote container (Module Federation)
async function loadRemoteContainer(moduleName: string): Promise<any> {
  // In production, this would use Webpack Module Federation
  // For now, simulating the API
  
  const remoteUrl = getRemoteUrl(moduleName);
  
  // Load the remote entry script
  await loadScript(`${remoteUrl}/remoteEntry.js`);
  
  // Get the container
  const container = (window as any)[moduleName];
  if (!container) {
    throw new Error(`Container ${moduleName} not found`);
  }
  
  // Initialize the container
  await container.init(__webpack_share_scopes__.default);
  
  return container;
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
}

function getRemoteUrl(moduleName: string): string {
  const remoteUrls: Record<string, string> = {
    equipmentControl: 'http://localhost:3001',
    qualityAnalysis: 'http://localhost:3002',
    inventoryManagement: 'http://localhost:3003',
  };
  
  return remoteUrls[moduleName] || '';
}

// Shared state provider
interface SharedStateContextValue {
  sharedState: SharedState;
  setSharedState: React.Dispatch<React.SetStateAction<SharedState>>;
  eventBus: EventBus;
}

const SharedStateContext = React.createContext<SharedStateContextValue | null>(null);

export function SharedStateProvider({ children }: { children: React.ReactNode }) {
  const [sharedState, setSharedState] = useState<SharedState>({
    selectedEquipment: null,
    activeAlerts: [],
    userPermissions: {},
  });

  useEffect(() => {
    // Subscribe to cross-module events
    const unsubscribeEquipment = eventBus.subscribe('equipment:selected', (equipment) => {
      setSharedState(prev => ({ ...prev, selectedEquipment: equipment }));
    });

    const unsubscribeAlert = eventBus.subscribe('alert:new', (alert) => {
      setSharedState(prev => ({
        ...prev,
        activeAlerts: [...prev.activeAlerts, alert],
      }));
    });

    return () => {
      unsubscribeEquipment();
      unsubscribeAlert();
    };
  }, []);

  return (
    <SharedStateContext.Provider value={{ sharedState, setSharedState, eventBus }}>
      {children}
    </SharedStateContext.Provider>
  );
}

export function useSharedState() {
  const context = React.useContext(SharedStateContext);
  if (!context) {
    throw new Error('useSharedState must be used within SharedStateProvider');
  }
  return context;
}

// Host application router
export function HostApplication() {
  const [user, setUser] = useState<any>(null);

  return (
    <SharedStateProvider>
      <div className="host-app">
        <nav style={{ padding: '10px', backgroundColor: '#f5f5f5' }}>
          <h1>Semiconductor Manufacturing Platform</h1>
          <div>
            <a href="#equipment">Equipment Control</a>
            <a href="#quality">Quality Analysis</a>
            <a href="#inventory">Inventory Management</a>
          </div>
        </nav>

        <main style={{ padding: '20px' }}>
          <Suspense fallback={<div>Loading...</div>}>
            <Routes />
          </Suspense>
        </main>
      </div>
    </SharedStateProvider>
  );
}

function Routes() {
  return (
    <div>
      <Route
        path="/equipment/*"
        module="equipmentControl"
        component="EquipmentApp"
        fallback={EquipmentFallback}
      />
      <Route
        path="/quality/*"
        module="qualityAnalysis"
        component="QualityApp"
      />
      <Route
        path="/inventory/*"
        module="inventoryManagement"
        component="InventoryApp"
      />
    </div>
  );
}

interface RouteProps {
  path: string;
  module: string;
  component: string;
  fallback?: React.ComponentType;
}

function Route({ path, module, component, fallback }: RouteProps) {
  // In production, use React Router
  const currentPath = window.location.hash.replace('#', '') || window.location.pathname;
  
  if (!currentPath.startsWith(path)) {
    return null;
  }

  return (
    <RemoteModuleLoader
      module={module}
      component={component}
      fallback={fallback}
    />
  );
}

// Fallback components
function EquipmentFallback() {
  return (
    <div style={{ padding: '20px' }}>
      <h2>Equipment Control (Fallback)</h2>
      <p>Remote module unavailable. Using fallback version.</p>
    </div>
  );
}

// Example: Equipment Control Module (would be in separate repo)
export function EquipmentApp() {
  const { sharedState, eventBus } = useSharedState();

  const handleEquipmentSelect = (equipmentId: string) => {
    eventBus.emit('equipment:selected', equipmentId);
  };

  return (
    <div>
      <h2>Equipment Control</h2>
      <p>Selected Equipment: {sharedState.selectedEquipment || 'None'}</p>
      <button onClick={() => handleEquipmentSelect('eq-123')}>
        Select Equipment 123
      </button>
    </div>
  );
}

// Webpack Module Federation Configuration (for reference)
/*
// Host webpack.config.js
const ModuleFederationPlugin = require('webpack/lib/container/ModuleFederationPlugin');

module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: 'host',
      remotes: {
        equipmentControl: 'equipmentControl@http://localhost:3001/remoteEntry.js',
        qualityAnalysis: 'qualityAnalysis@http://localhost:3002/remoteEntry.js',
        inventoryManagement: 'inventory@http://localhost:3003/remoteEntry.js',
      },
      shared: {
        react: { singleton: true, requiredVersion: '^18.2.0' },
        'react-dom': { singleton: true, requiredVersion: '^18.2.0' },
        '@semiconductor/shared-ui': { singleton: true },
      },
    }),
  ],
};

// Remote webpack.config.js (equipment-control)
module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: 'equipmentControl',
      filename: 'remoteEntry.js',
      exposes: {
        './EquipmentApp': './src/EquipmentApp',
      },
      shared: {
        react: { singleton: true },
        'react-dom': { singleton: true },
      },
    }),
  ],
};
*/

// Type declarations for Module Federation
declare global {
  interface Window {
    [key: string]: any;
  }
  
  const __webpack_share_scopes__: {
    default: any;
  };
}

