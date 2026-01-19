/**
 * Migration Strategy: Class Components to Functional Components
 * 
 * Demonstrates step-by-step migration from class components to functional
 * components with hooks, including lifecycle method conversions and state management.
 */

import React, { Component, useState, useEffect, useCallback, useRef, useMemo } from 'react';

// ============================================
// BEFORE: Class Component
// ============================================
interface ClassComponentProps {
  userId: string;
  onUserLoaded?: (user: any) => void;
}

interface ClassComponentState {
  user: any | null;
  loading: boolean;
  error: string | null;
  secondsActive: number;
}

class UserProfileClass extends Component<ClassComponentProps, ClassComponentState> {
  private timer: NodeJS.Timeout | null = null;
  private abortController: AbortController | null = null;

  constructor(props: ClassComponentProps) {
    super(props);
    this.state = {
      user: null,
      loading: true,
      error: null,
      secondsActive: 0,
    };
  }

  componentDidMount() {
    // Fetch user data
    this.fetchUserData(this.props.userId);

    // Start timer
    this.timer = setInterval(() => {
      this.setState(prev => ({
        secondsActive: prev.secondsActive + 1,
      }));
    }, 1000);
  }

  componentDidUpdate(prevProps: ClassComponentProps) {
    // Re-fetch if userId changes
    if (prevProps.userId !== this.props.userId) {
      this.fetchUserData(this.props.userId);
    }
  }

  componentWillUnmount() {
    // Cleanup
    if (this.timer) {
      clearInterval(this.timer);
    }
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  fetchUserData = async (userId: string) => {
    // Cancel previous request
    if (this.abortController) {
      this.abortController.abort();
    }

    this.abortController = new AbortController();
    this.setState({ loading: true, error: null });

    try {
      const response = await fetch(`/api/users/${userId}`, {
        signal: this.abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const user = await response.json();
      this.setState({ user, loading: false });
      this.props.onUserLoaded?.(user);
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        this.setState({ error: error.message, loading: false });
      }
    }
  };

  render() {
    const { user, loading, error, secondsActive } = this.state;

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;
    if (!user) return null;

    return (
      <div>
        <h1>{user.name}</h1>
        <p>Email: {user.email}</p>
        <p>Time on page: {secondsActive}s</p>
      </div>
    );
  }
}

// ============================================
// AFTER: Functional Component with Hooks
// ============================================
export function UserProfileFunctional({ 
  userId, 
  onUserLoaded 
}: ClassComponentProps) {
  // Replace constructor state with useState
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [secondsActive, setSecondsActive] = useState(0);

  // Refs for cleanup
  const abortControllerRef = useRef<AbortController | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch user data (replaces componentDidMount + componentDidUpdate)
  const fetchUserData = useCallback(async (id: string) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/users/${id}`, {
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const userData = await response.json();
      setUser(userData);
      setLoading(false);
      onUserLoaded?.(userData);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message);
        setLoading(false);
      }
    }
  }, [onUserLoaded]);

  // Timer effect (replaces componentDidMount timer)
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSecondsActive(prev => prev + 1);
    }, 1000);

    // Cleanup (replaces componentWillUnmount)
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []); // Empty deps = run once on mount

  // Fetch data on mount and when userId changes
  useEffect(() => {
    fetchUserData(userId);

    // Cleanup: abort request on unmount or userId change
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [userId, fetchUserData]);

  // Memoized computed values
  const displayName = useMemo(() => {
    return user?.name || 'Unknown User';
  }, [user?.name]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!user) return null;

  return (
    <div>
      <h1>{displayName}</h1>
      <p>Email: {user.email}</p>
      <p>Time on page: {secondsActive}s</p>
    </div>
  );
}

// ============================================
// Migration Helper: Custom Hook Extraction
// ============================================
export function useUserData(userId: string) {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchUser = useCallback(async (id: string) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/users/${id}`, {
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const userData = await response.json();
      setUser(userData);
      setLoading(false);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message);
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchUser(userId);

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [userId, fetchUser]);

  return { user, loading, error, refetch: () => fetchUser(userId) };
}

// Simplified component using custom hook
export function UserProfileWithHook({ userId }: { userId: string }) {
  const { user, loading, error } = useUserData(userId);
  const [secondsActive, setSecondsActive] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsActive(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!user) return null;

  return (
    <div>
      <h1>{user.name}</h1>
      <p>Email: {user.email}</p>
      <p>Time on page: {secondsActive}s</p>
    </div>
  );
}

// ============================================
// Migration: Error Boundary (Must Stay Class)
// ============================================
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundaryClass extends Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div>
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message}</p>
        </div>
      );
    }

    return this.props.children;
  }
}

// ============================================
// Migration Checklist
// ============================================
export const migrationChecklist = `
Migration Checklist: Class to Functional Components

1. ✅ Convert state to useState hooks
   - this.state → useState
   - this.setState → setState function

2. ✅ Convert lifecycle methods to useEffect
   - componentDidMount → useEffect(..., [])
   - componentDidUpdate → useEffect(..., [deps])
   - componentWillUnmount → return cleanup in useEffect

3. ✅ Convert methods to functions
   - Class methods → const functions or useCallback

4. ✅ Handle refs
   - this.ref → useRef

5. ✅ Extract custom hooks
   - Reusable logic → custom hooks

6. ✅ Update error boundaries
   - Keep as class components (React limitation)

7. ✅ Test thoroughly
   - Verify all functionality works
   - Check for memory leaks
   - Test edge cases

8. ✅ Update TypeScript types
   - Remove class-specific types
   - Add hook return types
`;

// ============================================
// Migration: JavaScript to TypeScript
// ============================================
// BEFORE: JavaScript
/*
export function UserProfile({ userId, onUserLoaded }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/users/${userId}`)
      .then(res => res.json())
      .then(data => {
        setUser(data);
        setLoading(false);
        onUserLoaded?.(data);
      });
  }, [userId, onUserLoaded]);

  if (loading) return <div>Loading...</div>;
  return <div>{user.name}</div>;
}
*/

// AFTER: TypeScript
interface User {
  id: string;
  name: string;
  email: string;
}

interface UserProfileTSProps {
  userId: string;
  onUserLoaded?: (user: User) => void;
}

export function UserProfileTS({ userId, onUserLoaded }: UserProfileTSProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetch(`/api/users/${userId}`)
      .then(res => res.json())
      .then((data: User) => {
        setUser(data);
        setLoading(false);
        onUserLoaded?.(data);
      });
  }, [userId, onUserLoaded]);

  if (loading) return <div>Loading...</div>;
  if (!user) return null;
  
  return <div>{user.name}</div>;
}

// ============================================
// Migration Utility Functions
// ============================================
export function createMigrationPlan(componentName: string) {
  return {
    component: componentName,
    steps: [
      '1. Identify all state variables',
      '2. Convert to useState hooks',
      '3. Map lifecycle methods to useEffect',
      '4. Convert class methods to functions',
      '5. Extract custom hooks if reusable',
      '6. Add TypeScript types',
      '7. Test migration',
      '8. Update imports and exports',
    ],
  };
}

