/**
 * Question 11: CSS-in-JS vs Traditional Styling
 * 
 * Demonstrates different styling approaches: styled-components, Tailwind CSS,
 * CSS Modules, and traditional CSS with comparison and best practices.
 */

import React from 'react';

// ============================================
// Approach 1: Styled Components (CSS-in-JS)
// ============================================
/*
import styled from 'styled-components';

const StyledButton = styled.button<{ variant: 'primary' | 'secondary' }>`
  padding: 10px 20px;
  border-radius: 4px;
  font-weight: 600;
  transition: all 0.2s;
  background-color: ${props => 
    props.variant === 'primary' ? '#007bff' : '#6c757d'};
  color: white;
  border: none;
  cursor: pointer;

  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const StyledCard = styled.div<{ elevated?: boolean }>`
  padding: 20px;
  border-radius: 8px;
  background: white;
  ${props => props.elevated && `
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  `}
`;
*/

// ============================================
// Approach 2: Tailwind CSS (Utility-First)
// ============================================
export function TailwindButton({ 
  variant = 'primary',
  children,
  ...props 
}: { 
  variant?: 'primary' | 'secondary';
  children: React.ReactNode;
  [key: string]: any;
}) {
  const baseClasses = 'px-5 py-2 rounded-md font-semibold transition-all duration-200';
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function TailwindCard({ 
  elevated = false,
  children 
}: { 
  elevated?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`p-5 rounded-lg bg-white ${
        elevated ? 'shadow-lg' : 'border border-gray-200'
      }`}
    >
      {children}
    </div>
  );
}

// ============================================
// Approach 3: CSS Modules
// ============================================
// Button.module.css
export const buttonStyles = {
  button: 'button_button__abc123',
  primary: 'button_primary__def456',
  secondary: 'button_secondary__ghi789',
};

// Button.tsx
export function CSSModuleButton({ 
  variant = 'primary',
  children,
  ...props 
}: { 
  variant?: 'primary' | 'secondary';
  children: React.ReactNode;
  [key: string]: any;
}) {
  return (
    <button
      className={`${buttonStyles.button} ${buttonStyles[variant]}`}
      {...props}
    >
      {children}
    </button>
  );
}

// ============================================
// Approach 4: Traditional CSS with CSS Variables
// ============================================
export function TraditionalStyledButton({ 
  variant = 'primary',
  children,
  ...props 
}: { 
  variant?: 'primary' | 'secondary';
  children: React.ReactNode;
  [key: string]: any;
}) {
  const style: React.CSSProperties = {
    padding: '10px 20px',
    borderRadius: '4px',
    fontWeight: 600,
    transition: 'all 0.2s',
    backgroundColor: variant === 'primary' ? 'var(--color-primary)' : 'var(--color-secondary)',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
  };

  return (
    <button style={style} {...props}>
      {children}
    </button>
  );
}

// ============================================
// Hybrid Approach: CSS Variables + Inline Styles
// ============================================
export function HybridStyledComponent({ 
  children,
  className = '',
  ...props 
}: { 
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
}) {
  return (
    <div
      className={`hybrid-component ${className}`}
      style={{
        // Use CSS variables for theming
        color: 'var(--text-primary)',
        backgroundColor: 'var(--bg-primary)',
        // Use inline styles for dynamic values
        padding: 'var(--spacing-md)',
      }}
      {...props}
    >
      {children}
    </div>
  );
}

// ============================================
// Theme Provider with CSS Variables
// ============================================
interface Theme {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
  };
  spacing: {
    sm: string;
    md: string;
    lg: string;
  };
}

const lightTheme: Theme = {
  colors: {
    primary: '#007bff',
    secondary: '#6c757d',
    background: '#ffffff',
    text: '#000000',
  },
  spacing: {
    sm: '8px',
    md: '16px',
    lg: '24px',
  },
};

const darkTheme: Theme = {
  colors: {
    primary: '#4dabf7',
    secondary: '#868e96',
    background: '#1a1a1a',
    text: '#ffffff',
  },
  spacing: {
    sm: '8px',
    md: '16px',
    lg: '24px',
  },
};

export function ThemeProvider({ 
  theme,
  children 
}: { 
  theme: Theme;
  children: React.ReactNode;
}) {
  const cssVariables = {
    '--color-primary': theme.colors.primary,
    '--color-secondary': theme.colors.secondary,
    '--bg-primary': theme.colors.background,
    '--text-primary': theme.colors.text,
    '--spacing-sm': theme.spacing.sm,
    '--spacing-md': theme.spacing.md,
    '--spacing-lg': theme.spacing.lg,
  } as React.CSSProperties;

  return (
    <div style={cssVariables}>
      {children}
    </div>
  );
}

// ============================================
// Responsive Design Hook
// ============================================
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = React.useState(false);

  React.useEffect(() => {
    const media = window.matchMedia(query);
    
    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);

    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
}

// Responsive component
export function ResponsiveComponent({ children }: { children: React.ReactNode }) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTablet = useMediaQuery('(min-width: 769px) and (max-width: 1024px)');
  const isDesktop = useMediaQuery('(min-width: 1025px)');

  return (
    <div
      style={{
        padding: isMobile ? '10px' : isTablet ? '20px' : '30px',
        fontSize: isMobile ? '14px' : '16px',
      }}
    >
      {children}
    </div>
  );
}

// ============================================
// Animation with CSS-in-JS
// ============================================
export function AnimatedComponent({ 
  isVisible,
  children 
}: { 
  isVisible: boolean;
  children: React.ReactNode;
}) {
  const [shouldRender, setShouldRender] = React.useState(isVisible);

  React.useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
    } else {
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  if (!shouldRender) return null;

  return (
    <div
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(-10px)',
        transition: 'opacity 0.3s ease, transform 0.3s ease',
      }}
    >
      {children}
    </div>
  );
}

// ============================================
// Style System Component
// ============================================
interface StyleSystemProps {
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
}

export function StyleSystemButton({ 
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...props 
}: StyleSystemProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const baseStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '4px',
    fontWeight: 600,
    transition: 'all 0.2s',
    cursor: 'pointer',
    border: 'none',
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: { backgroundColor: '#007bff', color: 'white' },
    secondary: { backgroundColor: '#6c757d', color: 'white' },
    success: { backgroundColor: '#28a745', color: 'white' },
    danger: { backgroundColor: '#dc3545', color: 'white' },
  };

  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: { padding: '6px 12px', fontSize: '14px' },
    md: { padding: '10px 20px', fontSize: '16px' },
    lg: { padding: '14px 28px', fontSize: '18px' },
  };

  return (
    <button
      style={{
        ...baseStyles,
        ...variantStyles[variant],
        ...sizeStyles[size],
      }}
      className={className}
      {...props}
    >
      {children}
    </button>
  );
}

// ============================================
// Example: Equipment Dashboard with Styling
// ============================================
export function StyledEquipmentDashboard() {
  const [theme, setTheme] = React.useState<'light' | 'dark'>('light');

  return (
    <ThemeProvider theme={theme === 'light' ? lightTheme : darkTheme}>
      <div style={{ padding: 'var(--spacing-lg)' }}>
        <div style={{ marginBottom: 'var(--spacing-md)' }}>
          <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
            Toggle Theme
          </button>
        </div>

        <TailwindCard elevated>
          <h2>Equipment Status</h2>
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <TailwindButton variant="primary">Start Process</TailwindButton>
            <TailwindButton variant="secondary">Stop Process</TailwindButton>
          </div>
        </TailwindCard>

        <ResponsiveComponent>
          <p>This content adapts to screen size</p>
        </ResponsiveComponent>

        <AnimatedComponent isVisible={true}>
          <div>Animated content</div>
        </AnimatedComponent>
      </div>
    </ThemeProvider>
  );
}

// ============================================
// Styling Comparison Table
// ============================================
/*
CSS-in-JS (styled-components):
✅ Pros: Scoped styles, dynamic props, TypeScript support, no naming conflicts
❌ Cons: Runtime overhead, larger bundle, harder to debug

Tailwind CSS:
✅ Pros: Fast development, consistent design, small bundle (with purging), utility-first
❌ Cons: Verbose className strings, learning curve, less semantic HTML

CSS Modules:
✅ Pros: Scoped styles, standard CSS, good performance, easy migration
❌ Cons: No dynamic styling, requires build step, limited runtime flexibility

Traditional CSS:
✅ Pros: Standard, no runtime cost, easy to debug, works everywhere
❌ Cons: Global scope issues, naming conflicts, harder to maintain at scale

Recommendation for Equipment Monitoring Dashboard:
- Use Tailwind CSS for rapid UI development
- CSS Modules for complex component-specific styles
- CSS Variables for theming
- Inline styles for truly dynamic values
*/

