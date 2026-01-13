# Component Library Architecture - Interview Deep Dive

Building scalable, reusable component libraries for enterprise React applications.

## 🎯 Key Concepts

- **Compound Components**: Related components that work together
- **Polymorphic Components**: Components that can render as different elements
- **Variant System**: Consistent styling variations (CVA pattern)
- **Design Tokens**: Shared values (colors, spacing, typography)

---

## Key Patterns

### 1. Compound Components

```typescript
// Parent provides shared context
const TabsContext = createContext<TabsContextValue | null>(null);

export function Tabs({ children, defaultValue }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultValue);

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </TabsContext.Provider>
  );
}

Tabs.List = function TabsList({ children }: { children: React.ReactNode }) {
  return <div role="tablist">{children}</div>;
};

Tabs.Trigger = function TabsTrigger({ value, children }: TabsTriggerProps) {
  const { activeTab, setActiveTab } = useContext(TabsContext)!;

  return (
    <button
      role="tab"
      aria-selected={activeTab === value}
      onClick={() => setActiveTab(value)}
    >
      {children}
    </button>
  );
};

Tabs.Content = function TabsContent({ value, children }: TabsContentProps) {
  const { activeTab } = useContext(TabsContext)!;

  if (activeTab !== value) return null;
  return <div role="tabpanel">{children}</div>;
};

// Usage
<Tabs defaultValue="tab1">
  <Tabs.List>
    <Tabs.Trigger value="tab1">Tab 1</Tabs.Trigger>
    <Tabs.Trigger value="tab2">Tab 2</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="tab1">Content 1</Tabs.Content>
  <Tabs.Content value="tab2">Content 2</Tabs.Content>
</Tabs>
```

### 2. Polymorphic Components

```typescript
type PolymorphicProps<E extends React.ElementType> = {
  as?: E;
  children: React.ReactNode;
} & React.ComponentPropsWithoutRef<E>;

function Text<E extends React.ElementType = 'span'>({
  as,
  children,
  ...props
}: PolymorphicProps<E>) {
  const Component = as || 'span';
  return <Component {...props}>{children}</Component>;
}

// Usage: Renders as different elements with full type safety
<Text>Default span</Text>
<Text as="p">Paragraph</Text>
<Text as="h1">Heading</Text>
<Text as="a" href="/path">Link</Text> // TypeScript knows href is valid
```

### 3. Variant System (CVA)

```typescript
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  'rounded font-semibold transition-colors', // base styles
  {
    variants: {
      variant: {
        primary: 'bg-blue-600 text-white hover:bg-blue-700',
        secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
        destructive: 'bg-red-600 text-white hover:bg-red-700',
      },
      size: {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-6 py-3 text-lg',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

type ButtonProps = VariantProps<typeof buttonVariants> & {
  children: React.ReactNode;
};

function Button({ variant, size, children }: ButtonProps) {
  return (
    <button className={buttonVariants({ variant, size })}>
      {children}
    </button>
  );
}

// Usage
<Button variant="primary" size="lg">Large Primary</Button>
<Button variant="destructive" size="sm">Small Destructive</Button>
```

---

## 🔑 Key Patterns

- ✅ Compound components for complex UIs
- ✅ Polymorphic components for flexibility
- ✅ CVA for variant management
- ✅ Design tokens for consistency
- ✅ Storybook for documentation
- ✅ TypeScript for type safety

Good luck with your Adobe TechGRC interview! 🚀
