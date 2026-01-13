# TypeScript with React - Interview Deep Dive

Advanced TypeScript patterns for React applications, focusing on type safety, generic components, and compile-time guarantees.

## 🎯 Why TypeScript with React

**Benefits for GRC Applications**:
- **Catch errors at compile-time**: Invalid prop types, missing fields
- **Better IDE support**: Autocomplete, refactoring, inline docs
- **Self-documenting code**: Types serve as documentation
- **Safer refactoring**: Rename detection, unused code identification
- **Team scalability**: Clear contracts between components

**Trade-offs**:
- ⚠️ Learning curve
- ⚠️ Slightly slower development initially
- ⚠️ More verbose code
- ✅ Fewer runtime errors
- ✅ Better developer experience long-term

---

## 📁 Implementation

### 01-type-safe-components.tsx
**Complexity**: ⭐⭐⭐⭐
**Interview Focus**: Generic components, Discriminated unions, Type guards, Advanced types

---

## 🔍 Deep Technical Analysis

### 1. Component Props Typing

**Basic component props**:

```typescript
// ❌ BAD: Using any
function Button({ onClick, children }: any) {
  return <button onClick={onClick}>{children}</button>;
}

// ⚠️ OKAY: Inline types
function Button({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return <button onClick={onClick}>{children}</button>;
}

// ✅ GOOD: Named interface
interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

function Button({ onClick, children, variant = 'primary', disabled = false }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-${variant}`}
    >
      {children}
    </button>
  );
}
```

**Extending HTML elements**:

```typescript
// ✅ Inherit native button props
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  loading?: boolean;
}

function Button({ variant = 'primary', loading, children, ...props }: ButtonProps) {
  return (
    <button
      {...props} // type-safe: onClick, disabled, aria-*, etc.
      className={`btn btn-${variant} ${props.className || ''}`}
    >
      {loading ? <Spinner /> : children}
    </button>
  );
}

// Usage: TypeScript ensures all props are valid
<Button
  onClick={() => console.log('clicked')}
  disabled={false}
  aria-label="Submit form"
  variant="primary"
  data-testid="submit-button"
/>
```

#### Interview Question: Props Typing

**Q: When do you use `type` vs `interface` for props?**
A: "Both work for props, but I prefer `interface` because:

```typescript
// ✅ Interface: Can be extended
interface BaseButtonProps {
  onClick: () => void;
  children: React.ReactNode;
}

interface IconButtonProps extends BaseButtonProps {
  icon: React.ReactNode;
}

// Type: Must use intersection
type IconButtonProps = BaseButtonProps & {
  icon: React.ReactNode;
};
```

**When to use `type`**:
- Unions: `type Status = 'pending' | 'success' | 'error'`
- Mapped types: `type Readonly<T> = { readonly [K in keyof T]: T[K] }`
- Conditional types: `type NonNullable<T> = T extends null | undefined ? never : T`

**When to use `interface`**:
- Object shapes (especially props)
- Declaration merging needs
- Extending other interfaces

In practice, for component props, either works. Be consistent within your codebase."

---

### 2. Discriminated Unions for Conditional Props

**Problem**: Conditional props not type-safe

```typescript
// ❌ BAD: mode and url can be mismatched
interface DataTableProps {
  mode: 'local' | 'remote';
  data?: any[];
  url?: string;
}

// TypeScript allows invalid combinations:
<DataTable mode="local" url="/api/data" /> // ❌ url ignored
<DataTable mode="remote" data={[]} /> // ❌ data ignored
```

**Solution**: Discriminated unions

```typescript
// ✅ GOOD: Type-safe conditional props
type DataTableProps =
  | {
      mode: 'local';
      data: any[];
      // url not allowed
    }
  | {
      mode: 'remote';
      url: string;
      // data not allowed
    };

function DataTable(props: DataTableProps) {
  if (props.mode === 'local') {
    // TypeScript knows: props.data exists, props.url doesn't
    return <Table data={props.data} />;
  } else {
    // TypeScript knows: props.url exists, props.data doesn't
    return <RemoteTable url={props.url} />;
  }
}

// Usage: TypeScript enforces correct props
<DataTable mode="local" data={[]} /> // ✅
<DataTable mode="remote" url="/api" /> // ✅
<DataTable mode="local" url="/api" /> // ❌ Type error
<DataTable mode="remote" data={[]} /> // ❌ Type error
```

**Real-world example**: Form fields

```typescript
type FormFieldProps =
  | {
      type: 'text' | 'email' | 'password';
      value: string;
      onChange: (value: string) => void;
    }
  | {
      type: 'number';
      value: number;
      onChange: (value: number) => void;
      min?: number;
      max?: number;
    }
  | {
      type: 'select';
      value: string;
      onChange: (value: string) => void;
      options: Array<{ label: string; value: string }>;
    }
  | {
      type: 'checkbox';
      checked: boolean;
      onChange: (checked: boolean) => void;
    };

function FormField(props: FormFieldProps) {
  switch (props.type) {
    case 'text':
    case 'email':
    case 'password':
      return <input type={props.type} value={props.value} onChange={e => props.onChange(e.target.value)} />;

    case 'number':
      return <input type="number" value={props.value} onChange={e => props.onChange(Number(e.target.value))} min={props.min} max={props.max} />;

    case 'select':
      return (
        <select value={props.value} onChange={e => props.onChange(e.target.value)}>
          {props.options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      );

    case 'checkbox':
      return <input type="checkbox" checked={props.checked} onChange={e => props.onChange(e.target.checked)} />;
  }
}
```

---

### 3. Generic Components

**Problem**: Reusable components with different data types

```typescript
// ❌ BAD: Loses type information
interface TableProps {
  data: any[];
  columns: any[];
  onRowClick: (row: any) => void;
}
```

**Solution**: Generic components

```typescript
// ✅ GOOD: Type-safe with generics
interface Column<T> {
  key: keyof T;
  header: string;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (row: T) => void;
}

function Table<T extends Record<string, any>>({ data, columns, onRowClick }: TableProps<T>) {
  return (
    <table>
      <thead>
        <tr>
          {columns.map(col => (
            <th key={String(col.key)}>{col.header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <tr key={i} onClick={() => onRowClick?.(row)}>
            {columns.map(col => (
              <td key={String(col.key)}>
                {col.render ? col.render(row[col.key], row) : String(row[col.key])}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Usage: Fully type-safe
interface User {
  id: string;
  name: string;
  email: string;
  age: number;
}

const users: User[] = [
  { id: '1', name: 'Alice', email: 'alice@example.com', age: 30 },
];

<Table<User>
  data={users}
  columns={[
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
    {
      key: 'age',
      header: 'Age',
      render: (age) => `${age} years old` // age is type number
    },
  ]}
  onRowClick={(user) => {
    // user is type User, not any
    console.log(user.name, user.email);
  }}
/>
```

**Generic with constraints**:

```typescript
// Only accept objects with an 'id' field
function Table<T extends { id: string | number }>(props: TableProps<T>) {
  // ...
  const rowKey = row.id; // TypeScript knows id exists
}
```

#### Interview Question: Generics

**Q: When should you use generic components?**
A: "Use generics when:

1. **Component works with multiple types**: Table, List, Select
2. **Need type safety for callbacks**: onRowClick receives correct type
3. **Reusable across codebase**: Don't repeat code for different data types

**Don't use generics when**:
- Component is specific to one type
- Adds unnecessary complexity
- Props don't depend on data type

Example: Button doesn't need generics (same for all types), but Table does (needs to know data shape)."

---

### 4. Custom Hooks with TypeScript

**Type-safe custom hooks**:

```typescript
// Generic hook
function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = (value: T) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
}

// Usage: Type-safe
const [user, setUser] = useLocalStorage<User>('user', { id: '', name: '', email: '' });
setUser({ id: '1', name: 'Alice', email: 'alice@example.com' }); // ✅
setUser({ id: '1', name: 'Alice' }); // ❌ Type error: missing email
```

**Hook with overloads**:

```typescript
// Different return types based on arguments
function useFetch(url: string): { data: any; loading: boolean; error: Error | null };
function useFetch<T>(url: string): { data: T | null; loading: boolean; error: Error | null };
function useFetch<T>(url: string, options: { parse: (data: any) => T }): { data: T | null; loading: boolean; error: Error | null };

function useFetch<T = any>(url: string, options?: { parse?: (data: any) => T }) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetch(url)
      .then(res => res.json())
      .then(json => {
        const parsed = options?.parse ? options.parse(json) : json;
        setData(parsed);
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, [url, options]);

  return { data, loading, error };
}

// Usage
const { data } = useFetch<User[]>('/api/users');
// data is User[] | null
```

---

### 5. Type Guards and Narrowing

**Type guards for runtime checks**:

```typescript
// Type guard function
function isComplianceControl(value: unknown): value is ComplianceControl {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'controlId' in value &&
    'status' in value
  );
}

// Usage
function processData(data: unknown) {
  if (isComplianceControl(data)) {
    // TypeScript knows: data is ComplianceControl
    console.log(data.controlId, data.status);
  } else {
    console.error('Invalid data format');
  }
}

// Discriminated union narrowing
type ApiResponse<T> =
  | { status: 'success'; data: T }
  | { status: 'error'; error: string };

function handleResponse<T>(response: ApiResponse<T>) {
  if (response.status === 'success') {
    // TypeScript knows: response.data exists
    return response.data;
  } else {
    // TypeScript knows: response.error exists
    throw new Error(response.error);
  }
}
```

---

### 6. Utility Types for Props

**Common patterns**:

```typescript
// Make all properties optional
type PartialProps<T> = Partial<T>;

// Pick specific properties
type UserNameEmail = Pick<User, 'name' | 'email'>;

// Omit specific properties
type UserWithoutPassword = Omit<User, 'password'>;

// Extract props from component
type ButtonProps = React.ComponentProps<typeof Button>;

// Extract element props
type DivProps = React.HTMLProps<HTMLDivElement>;

// Make properties readonly
type ReadonlyUser = Readonly<User>;

// Record type for objects
type StatusMessages = Record<'pending' | 'success' | 'error', string>;
```

**Real-world example**:

```typescript
// Base form props
interface BaseFormProps {
  onSubmit: (data: any) => void;
  onCancel?: () => void;
  loading?: boolean;
}

// Specific form props
interface CreateUserFormProps extends Omit<BaseFormProps, 'onSubmit'> {
  onSubmit: (data: Omit<User, 'id'>) => void;
}

interface EditUserFormProps extends Omit<BaseFormProps, 'onSubmit'> {
  user: User;
  onSubmit: (data: Partial<User>) => void;
}
```

---

## 🎓 Study Strategy

### Must Know

1. **Component props typing**: Interface vs type, extending HTML elements
2. **Discriminated unions**: Type-safe conditional props
3. **Generic components**: Reusable with type safety
4. **Custom hooks typing**: Generic hooks, return types
5. **Type guards**: Runtime type checking

### Practice Explaining

"For TypeScript with React, I focus on type safety at component boundaries:

For props, I use interfaces that extend HTML element props to inherit native attributes. For conditional props, I use discriminated unions to ensure TypeScript enforces correct prop combinations.

For reusable components like tables, I use generics to maintain type safety while allowing different data types. This ensures callbacks like `onRowClick` receive the correct type.

For custom hooks, I use generics with constraints to create flexible, type-safe hooks. I also implement type guards for runtime validation when dealing with external data like API responses."

---

## 🔑 Key Patterns

- ✅ Interface for props (can extend)
- ✅ Discriminated unions for conditional props
- ✅ Generics for reusable components
- ✅ Type guards for runtime checks
- ✅ Utility types (Pick, Omit, Partial)
- ✅ Extend HTML element props
- ✅ Type-safe event handlers

---

Good luck with your Adobe TechGRC interview! 🚀
