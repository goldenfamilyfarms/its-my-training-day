# Styling Strategies - Interview Deep Dive

Modern CSS approaches for React applications: CSS-in-JS, Tailwind, CSS Modules comparison.

## 🎯 Styling Approaches Comparison

| Approach | Pros | Cons | Use Case |
|----------|------|------|----------|
| **CSS-in-JS** (Styled Components, Emotion) | Dynamic styles, TypeScript support, scoped | Runtime overhead, larger bundles | Complex theming |
| **Tailwind CSS** | Fast development, small bundles, utility-first | HTML verbosity, learning curve | Rapid prototyping |
| **CSS Modules** | Scoped styles, no runtime cost, familiar | Manual class management | Traditional projects |
| **Vanilla CSS** | Zero overhead, simple | Global scope, no variables | Small projects |

---

## Key Patterns

### 1. CSS-in-JS (Styled Components)

```typescript
import styled from 'styled-components';

const Button = styled.button<{ variant: 'primary' | 'secondary' }>`
  padding: 8px 16px;
  border-radius: 4px;
  background: ${props => props.variant === 'primary' ? '#007bff' : '#6c757d'};
  color: white;

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// Usage
<Button variant="primary" onClick={handleClick}>Submit</Button>
```

**Pros**:
- ✅ Dynamic styles based on props
- ✅ TypeScript support
- ✅ Scoped styles (no conflicts)
- ✅ Theming built-in

**Cons**:
- ❌ Runtime overhead (~8-10KB)
- ❌ Server-side rendering complexity
- ❌ Harder to debug

### 2. Tailwind CSS

```typescript
function Button({ variant, children }: ButtonProps) {
  const classes = variant === 'primary'
    ? 'bg-blue-600 hover:bg-blue-700'
    : 'bg-gray-600 hover:bg-gray-700';

  return (
    <button className={`px-4 py-2 rounded text-white ${classes}`}>
      {children}
    </button>
  );
}
```

**Pros**:
- ✅ Fast development
- ✅ Small bundle size (purges unused)
- ✅ Consistent design system
- ✅ No runtime cost

**Cons**:
- ❌ HTML verbosity
- ❌ Learning curve
- ❌ Harder for complex animations

### 3. CSS Modules

```typescript
import styles from './Button.module.css';

function Button({ variant, children }: ButtonProps) {
  return (
    <button className={`${styles.button} ${styles[variant]}`}>
      {children}
    </button>
  );
}
```

```css
/* Button.module.css */
.button {
  padding: 8px 16px;
  border-radius: 4px;
}

.primary {
  background: #007bff;
  color: white;
}

.secondary {
  background: #6c757d;
  color: white;
}
```

**Pros**:
- ✅ Scoped styles
- ✅ No runtime cost
- ✅ Familiar CSS syntax
- ✅ TypeScript support (with plugins)

**Cons**:
- ❌ Manual class management
- ❌ No dynamic styles
- ❌ Separate CSS files

---

## 🔑 Recommendation

**For GRC/Enterprise Apps**:
1. **Tailwind CSS**: Fast development, design consistency, small bundles
2. **CSS Modules**: If team prefers traditional CSS
3. **Styled Components**: If heavy theming/dynamic styles needed

Good luck with your Adobe TechGRC interview! 🚀
