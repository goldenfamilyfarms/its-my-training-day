/**
 * Component Library Architecture
 * 
 * Implements a reusable component library with compound components,
 * polymorphic components, variant system, and comprehensive documentation.
 */

import React, { createElement, forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

// Variant system using CVA (Class Variance Authority)
const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        default: 'bg-blue-600 text-white hover:bg-blue-700',
        destructive: 'bg-red-600 text-white hover:bg-red-700',
        outline: 'border border-gray-300 bg-transparent hover:bg-gray-100',
        ghost: 'hover:bg-gray-100',
        link: 'underline-offset-4 hover:underline text-blue-600',
      },
      size: {
        default: 'h-10 py-2 px-4',
        sm: 'h-9 px-3 rounded-md',
        lg: 'h-11 px-8 rounded-md',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

// Polymorphic Button component
type ButtonElement = HTMLButtonElement | HTMLAnchorElement;

interface ButtonProps extends VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

type PolymorphicButtonProps = ButtonProps & {
  as?: 'button' | 'a';
  href?: string;
  onClick?: (e: React.MouseEvent) => void;
};

export const Button = forwardRef<ButtonElement, PolymorphicButtonProps>(
  (
    {
      as = 'button',
      variant,
      size,
      className,
      disabled,
      isLoading,
      leftIcon,
      rightIcon,
      children,
      asChild,
      ...props
    },
    ref
  ) => {
    const baseClasses = buttonVariants({ variant, size, className });

    if (isLoading) {
      return (
        <button
          ref={ref as React.Ref<HTMLButtonElement>}
          className={baseClasses}
          disabled
          {...(props as any)}
        >
          <span className="spinner" aria-label="Loading" />
        </button>
      );
    }

    const content = (
      <>
        {leftIcon && !isLoading && <span className="mr-2">{leftIcon}</span>}
        {children}
        {rightIcon && !isLoading && <span className="ml-2">{rightIcon}</span>}
      </>
    );

    if (as === 'a' && 'href' in props) {
      return (
        <a
          ref={ref as React.Ref<HTMLAnchorElement>}
          className={baseClasses}
          {...(props as any)}
        >
          {content}
        </a>
      );
    }

    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        className={baseClasses}
        disabled={disabled}
        {...(props as any)}
      >
        {content}
      </button>
    );
  }
);

Button.displayName = 'Button';

// Compound Component Pattern - Card
interface CardContextValue {
  variant: 'default' | 'outlined' | 'elevated';
}

const CardContext = React.createContext<CardContextValue>({ variant: 'default' });

interface CardProps {
  variant?: 'default' | 'outlined' | 'elevated';
  children: React.ReactNode;
  className?: string;
}

export function Card({ variant = 'default', children, className }: CardProps) {
  return (
    <CardContext.Provider value={{ variant }}>
      <div
        className={`card card-${variant} ${className || ''}`}
        style={{
          padding: '20px',
          borderRadius: '8px',
          ...(variant === 'outlined' && { border: '1px solid #ddd' }),
          ...(variant === 'elevated' && { boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }),
        }}
      >
        {children}
      </div>
    </CardContext.Provider>
  );
}

interface CardHeaderProps {
  children: React.ReactNode;
}

Card.Header = function CardHeader({ children }: CardHeaderProps) {
  return <div className="card-header" style={{ marginBottom: '16px' }}>{children}</div>;
};

interface CardTitleProps {
  children: React.ReactNode;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

Card.Title = function CardTitle({ children, as = 'h3' }: CardTitleProps) {
  return createElement(as, { className: 'card-title', style: { margin: 0 } }, children);
};

interface CardContentProps {
  children: React.ReactNode;
}

Card.Content = function CardContent({ children }: CardContentProps) {
  return <div className="card-content">{children}</div>;
};

interface CardFooterProps {
  children: React.ReactNode;
}

Card.Footer = function CardFooter({ children }: CardFooterProps) {
  return (
    <div className="card-footer" style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #eee' }}>
      {children}
    </div>
  );
};

// Input component with variants
const inputVariants = cva(
  'flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default: '',
        error: 'border-red-500 focus-visible:ring-red-500',
        success: 'border-green-500 focus-visible:ring-green-500',
      },
      size: {
        default: 'h-10',
        sm: 'h-9',
        lg: 'h-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, size, label, error, hint, id, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const errorId = `${inputId}-error`;
    const hintId = `${inputId}-hint`;

    return (
      <div className="input-wrapper">
        {label && (
          <label htmlFor={inputId} className="input-label">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={inputVariants({ variant: error ? 'error' : variant, size, className })}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={[error ? errorId : null, hint ? hintId : null]
            .filter(Boolean)
            .join(' ') || undefined}
          {...props}
        />
        {hint && !error && (
          <div id={hintId} className="input-hint">
            {hint}
          </div>
        )}
        {error && (
          <div id={errorId} className="input-error" role="alert">
            {error}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// Modal component with compound pattern
interface ModalContextValue {
  isOpen: boolean;
  onClose: () => void;
}

const ModalContext = React.createContext<ModalContextValue | null>(null);

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <ModalContext.Provider value={{ isOpen, onClose }}>
      <div
        className="modal-overlay"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}
      >
        {children}
      </div>
    </ModalContext.Provider>
  );
}

interface ModalContentProps {
  children: React.ReactNode;
  className?: string;
}

Modal.Content = function ModalContent({ children, className }: ModalContentProps) {
  const context = React.useContext(ModalContext);
  if (!context) throw new Error('Modal.Content must be used within Modal');

  return (
    <div
      className={`modal-content ${className || ''}`}
      onClick={(e) => e.stopPropagation()}
      style={{
        backgroundColor: 'white',
        padding: '24px',
        borderRadius: '8px',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto',
      }}
    >
      {children}
    </div>
  );
};

interface ModalHeaderProps {
  children: React.ReactNode;
}

Modal.Header = function ModalHeader({ children }: ModalHeaderProps) {
  const context = React.useContext(ModalContext);
  if (!context) throw new Error('Modal.Header must be used within Modal');

  return (
    <div className="modal-header" style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      {children}
      <button
        onClick={context.onClose}
        aria-label="Close modal"
        style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}
      >
        ×
      </button>
    </div>
  );
};

// Example usage
export function ComponentLibraryExample() {
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  return (
    <div style={{ padding: '20px' }}>
      <h1>Component Library Examples</h1>

      <Card variant="elevated">
        <Card.Header>
          <Card.Title>Button Variants</Card.Title>
        </Card.Header>
        <Card.Content>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Button variant="default">Default</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
            <Button isLoading>Loading</Button>
            <Button as="a" href="/link">As Link</Button>
          </div>
        </Card.Content>
      </Card>

      <Card variant="outlined" style={{ marginTop: '20px' }}>
        <Card.Header>
          <Card.Title>Input Components</Card.Title>
        </Card.Header>
        <Card.Content>
          <Input
            label="Temperature Threshold"
            placeholder="Enter temperature"
            hint="Value between 0 and 2000°C"
          />
          <Input
            label="Pressure"
            error="Pressure must be positive"
            style={{ marginTop: '10px' }}
          />
        </Card.Content>
      </Card>

      <div style={{ marginTop: '20px' }}>
        <Button onClick={() => setIsModalOpen(true)}>Open Modal</Button>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <Modal.Content>
          <Modal.Header>
            <h2>Modal Title</h2>
          </Modal.Header>
          <p>Modal content goes here</p>
        </Modal.Content>
      </Modal>
    </div>
  );
}

