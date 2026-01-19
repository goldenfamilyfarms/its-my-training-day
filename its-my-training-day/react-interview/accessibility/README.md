# Web Accessibility (WCAG) - Interview Deep Dive

Production-ready accessibility patterns for React applications, focusing on WCAG 2.1 AA compliance for GRC/enterprise applications.

## 🎯 Why Accessibility Matters for GRC Apps

- **Legal requirement**: Many compliance frameworks require WCAG compliance
- **Section 508**: Federal agencies must have accessible software
- **Broader audience**: 15% of population has disabilities
- **Better UX**: Accessibility improvements benefit all users
- **SEO**: Semantic HTML improves search rankings

## 📁 Implementation

### 01-wcag-compliance.tsx
**Complexity**: ⭐⭐⭐⭐
**Interview Focus**: ARIA attributes, Keyboard navigation, Screen readers, Focus management

---

## 🔍 WCAG 2.1 Principles (POUR)

**P - Perceivable**: Information must be presentable to users
**O - Operable**: Interface components must be operable
**U - Understandable**: Information and operation must be understandable
**R - Robust**: Content must be robust enough for assistive technologies

---

## Key Accessibility Patterns

### 1. Semantic HTML

```typescript
// ❌ BAD: Divs for everything
<div onClick={handleClick}>Click me</div>
<div className="header">Page Title</div>
<div className="nav">...</div>

// ✅ GOOD: Semantic elements
<button onClick={handleClick}>Click me</button>
<h1>Page Title</h1>
<nav>...</nav>
```

**Benefits**:
- Screen readers understand structure
- Keyboard navigation works automatically
- Default ARIA roles applied
- SEO improved

### 2. ARIA Attributes

**Common ARIA patterns**:

```typescript
// Button state
<button aria-pressed={isActive} onClick={toggle}>
  {isActive ? 'Active' : 'Inactive'}
</button>

// Loading state
<button aria-busy={loading} disabled={loading}>
  {loading ? 'Loading...' : 'Submit'}
</button>

// Expanded state
<button aria-expanded={isOpen} onClick={toggleMenu}>
  Menu
</button>

// Controls relationship
<button aria-controls="panel-1" onClick={openPanel}>
  Open Panel
</button>
<div id="panel-1" role="region">...</div>

// Labels
<button aria-label="Close dialog">
  <X /> {/* Icon only */}
</button>

// Descriptions
<input
  type="email"
  aria-describedby="email-help"
/>
<span id="email-help">We'll never share your email</span>

// Live regions
<div aria-live="polite" aria-atomic="true">
  {statusMessage}
</div>
```

### 3. Keyboard Navigation

**Focus management**:

```typescript
function Modal({ isOpen, onClose }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Save previous focus
      previousFocusRef.current = document.activeElement as HTMLElement;

      // Focus modal
      modalRef.current?.focus();

      // Trap focus in modal
      const handleTab = (e: KeyboardEvent) => {
        if (e.key === 'Tab') {
          const focusableElements = modalRef.current?.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );

          if (!focusableElements || focusableElements.length === 0) return;

          const first = focusableElements[0] as HTMLElement;
          const last = focusableElements[focusableElements.length - 1] as HTMLElement;

          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        } else if (e.key === 'Escape') {
          onClose();
        }
      };

      document.addEventListener('keydown', handleTab);
      return () => document.removeEventListener('keydown', handleTab);
    } else {
      // Restore previous focus
      previousFocusRef.current?.focus();
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      tabIndex={-1}
    >
      <h2 id="modal-title">Modal Title</h2>
      <button onClick={onClose} aria-label="Close modal">×</button>
      {/* Modal content */}
    </div>
  );
}
```

### 4. Skip Links

```typescript
function SkipLinks() {
  return (
    <div className="skip-links">
      <a href="#main-content">Skip to main content</a>
      <a href="#navigation">Skip to navigation</a>
      <a href="#footer">Skip to footer</a>
    </div>
  );
}

// CSS
.skip-links a {
  position: absolute;
  top: -40px;
  left: 0;
  background: #000;
  color: #fff;
  padding: 8px;
  z-index: 100;
}

.skip-links a:focus {
  top: 0;
}
```

### 5. Form Accessibility

```typescript
function AccessibleForm() {
  const [errors, setErrors] = useState<Record<string, string>>({});

  return (
    <form onSubmit={handleSubmit} aria-label="Contact form">
      <div>
        <label htmlFor="name">Name *</label>
        <input
          id="name"
          type="text"
          required
          aria-required="true"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'name-error' : undefined}
        />
        {errors.name && (
          <span id="name-error" role="alert">
            {errors.name}
          </span>
        )}
      </div>

      <fieldset>
        <legend>Compliance Framework</legend>
        <label>
          <input type="radio" name="framework" value="soc2" />
          SOC 2
        </label>
        <label>
          <input type="radio" name="framework" value="fedramp" />
          FedRAMP
        </label>
      </fieldset>

      <button type="submit">Submit</button>
    </form>
  );
}
```

### 6. Data Tables

```typescript
<table role="table" aria-label="Compliance controls">
  <caption>Compliance Control Status</caption>
  <thead>
    <tr>
      <th scope="col">Control ID</th>
      <th scope="col">Status</th>
      <th scope="col">Last Updated</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">AC-1</th>
      <td>Pass</td>
      <td>2026-01-10</td>
    </tr>
  </tbody>
</table>
```

### 7. Focus Indicators

```css
/* ❌ BAD: Removing focus outline */
*:focus {
  outline: none;
}

/* ✅ GOOD: Custom focus indicator */
*:focus-visible {
  outline: 2px solid #0066cc;
  outline-offset: 2px;
}

button:focus-visible {
  box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.3);
}
```

---

## 🎓 Testing Accessibility

### Automated Testing

```typescript
// jest-axe
import { axe } from 'jest-axe';

test('has no accessibility violations', async () => {
  const { container } = render(<ComplianceForm />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### Manual Testing Checklist

- [ ] Navigate with keyboard only (Tab, Shift+Tab, Enter, Space, Arrows)
- [ ] Test with screen reader (NVDA, JAWS, VoiceOver)
- [ ] Zoom to 200% (text should reflow)
- [ ] Disable CSS (content should be understandable)
- [ ] Use browser extensions (axe DevTools, Lighthouse)
- [ ] Test color contrast (4.5:1 for normal text, 3:1 for large)

---

## 🔑 Key WCAG Requirements

**Level A (Minimum)**:
- ✅ Keyboard accessible
- ✅ Text alternatives for images
- ✅ No keyboard traps
- ✅ Proper heading structure

**Level AA (Standard)**:
- ✅ Color contrast 4.5:1 (normal), 3:1 (large)
- ✅ Resize text to 200%
- ✅ Multiple ways to find pages
- ✅ Descriptive labels

**Level AAA (Enhanced)**:
- ✅ Color contrast 7:1 (normal), 4.5:1 (large)
- ✅ No time limits
- ✅ Sign language for audio

Most organizations target **AA compliance**.

---

Good luck with your Adobe TechGRC interview! 🚀
