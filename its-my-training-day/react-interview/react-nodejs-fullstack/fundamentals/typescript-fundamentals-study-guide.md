# Study Guide: TypeScript Fundamentals

## Metadata
- **Track**: react-nodejs-fullstack
- **Subdomain**: fundamentals
- **Difficulty**: intermediate
- **Target Roles**: Senior Full Stack Engineer, Frontend Engineer, Node.js Developer
- **Source JD**: [Senior Full Stack Engineer Sample](../../job-descriptions/senior-fullstack-engineer-sample.md)
- **Estimated Time**: 60 minutes
- **Created**: 2026-01-15
- **Last Modified**: 2026-01-15

## Overview

TypeScript is essential for modern full-stack development. Interviewers assess your understanding of the type system, generics, and how TypeScript improves code quality. This guide covers the most commonly asked TypeScript interview questions.

---

## Questions

### Q1: What's the difference between `interface` and `type` in TypeScript? When would you use each?

**Answer:**

Both `interface` and `type` can define object shapes, but they have key differences:

**Interface:**
```typescript
interface User {
  id: number;
  name: string;
}

// Can be extended
interface Admin extends User {
  permissions: string[];
}

// Can be merged (declaration merging)
interface User {
  email: string; // Adds to existing User interface
}
```

**Type:**
```typescript
type User = {
  id: number;
  name: string;
};

// Uses intersection for extension
type Admin = User & {
  permissions: string[];
};

// Can represent unions, primitives, tuples
type Status = 'active' | 'inactive';
type Coordinates = [number, number];
```

**When to use each:**
- Use `interface` for object shapes that might be extended or implemented by classes
- Use `type` for unions, intersections, mapped types, or when you need more flexibility
- In a team setting, pick one convention and stick with it for consistency

**Key Concepts:**
- **Declaration merging**: Interfaces with the same name automatically merge; types cannot
- **Extends vs Intersection**: Interfaces use `extends`, types use `&`
- **Flexibility**: Types can represent any type, interfaces are limited to object shapes

**Follow-up Questions:**
1. Can a class implement a type alias?
2. What happens if you try to merge two type aliases with the same name?
3. How do mapped types work with interfaces vs type aliases?

---

### Q2: Explain TypeScript generics. How would you create a generic function that works with arrays?

**Answer:**

Generics allow you to write reusable code that works with multiple types while maintaining type safety.

```typescript
// Generic function
function firstElement<T>(arr: T[]): T | undefined {
  return arr[0];
}

// TypeScript infers the type
const num = firstElement([1, 2, 3]); // type: number | undefined
const str = firstElement(['a', 'b']); // type: string | undefined

// Generic with constraints
function getLength<T extends { length: number }>(item: T): number {
  return item.length;
}

getLength('hello'); // Works - string has length
getLength([1, 2, 3]); // Works - array has length
getLength(123); // Error - number has no length

// Multiple type parameters
function merge<T, U>(obj1: T, obj2: U): T & U {
  return { ...obj1, ...obj2 };
}
```

**Real-world example - Generic API response:**
```typescript
interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
}

async function fetchUser(): Promise<ApiResponse<User>> {
  // ...
}
```

**Key Concepts:**
- **Type parameter**: The `<T>` placeholder that gets replaced with actual types
- **Constraints**: Using `extends` to limit what types can be used
- **Inference**: TypeScript can often infer generic types from usage

**Follow-up Questions:**
1. What's the difference between `<T extends object>` and `<T extends {}>`?
2. How do you set a default type for a generic parameter?
3. When would you use multiple type parameters?

---

### Q3: What are utility types in TypeScript? Give examples of when you'd use `Partial`, `Pick`, and `Omit`.

**Answer:**

Utility types are built-in generic types that transform other types.

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
}

// Partial<T> - Makes all properties optional
type UpdateUserDto = Partial<User>;
// { id?: number; name?: string; email?: string; createdAt?: Date; }

function updateUser(id: number, updates: Partial<User>) {
  // Can pass any subset of User properties
}
updateUser(1, { name: 'New Name' }); // Valid

// Pick<T, K> - Select specific properties
type UserPreview = Pick<User, 'id' | 'name'>;
// { id: number; name: string; }

// Omit<T, K> - Exclude specific properties
type CreateUserDto = Omit<User, 'id' | 'createdAt'>;
// { name: string; email: string; }

// Required<T> - Makes all properties required
type RequiredUser = Required<Partial<User>>;

// Readonly<T> - Makes all properties readonly
type ImmutableUser = Readonly<User>;
```

**Combining utility types:**
```typescript
// Create a type for updating user without changing id
type SafeUserUpdate = Partial<Omit<User, 'id'>>;
```

**Key Concepts:**
- **Partial**: Great for update operations where any field can change
- **Pick**: Extract a subset of properties for specific use cases
- **Omit**: Remove properties (like auto-generated fields) for DTOs

**Follow-up Questions:**
1. How would you implement `Partial` yourself using mapped types?
2. What's the difference between `Omit` and `Exclude`?
3. When would you use `Record<K, V>`?

---

### Q4: How does TypeScript's type narrowing work? Explain with examples.

**Answer:**

Type narrowing is how TypeScript refines types within conditional blocks based on runtime checks.

```typescript
// typeof narrowing
function processValue(value: string | number) {
  if (typeof value === 'string') {
    // TypeScript knows value is string here
    return value.toUpperCase();
  }
  // TypeScript knows value is number here
  return value.toFixed(2);
}

// instanceof narrowing
class Dog {
  bark() { console.log('woof'); }
}
class Cat {
  meow() { console.log('meow'); }
}

function makeSound(animal: Dog | Cat) {
  if (animal instanceof Dog) {
    animal.bark(); // TypeScript knows it's Dog
  } else {
    animal.meow(); // TypeScript knows it's Cat
  }
}

// Discriminated unions (most powerful pattern)
type Success = { status: 'success'; data: string };
type Error = { status: 'error'; message: string };
type Result = Success | Error;

function handleResult(result: Result) {
  if (result.status === 'success') {
    console.log(result.data); // TypeScript knows data exists
  } else {
    console.log(result.message); // TypeScript knows message exists
  }
}

// Custom type guards
function isString(value: unknown): value is string {
  return typeof value === 'string';
}
```

**Key Concepts:**
- **Control flow analysis**: TypeScript tracks type through if/else, switch, etc.
- **Discriminated unions**: Use a common property (like `status`) to differentiate types
- **Type predicates**: Custom functions that narrow types with `value is Type`

**Follow-up Questions:**
1. What's the difference between `unknown` and `any` for type narrowing?
2. How do you narrow types in a switch statement?
3. When would you use the `in` operator for narrowing?

---

### Q5: You're debugging a production issue where TypeScript types don't match runtime data. How do you handle this?

**Answer:**

This is a common issue because TypeScript types are erased at runtime. Here's how to handle it:

**1. Runtime validation with type guards:**
```typescript
interface User {
  id: number;
  name: string;
}

function isUser(data: unknown): data is User {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    typeof (data as User).id === 'number' &&
    'name' in data &&
    typeof (data as User).name === 'string'
  );
}

async function fetchUser(): Promise<User> {
  const response = await fetch('/api/user');
  const data = await response.json();
  
  if (!isUser(data)) {
    throw new Error('Invalid user data from API');
  }
  
  return data; // Now safely typed as User
}
```

**2. Use a validation library (Zod, io-ts, yup):**
```typescript
import { z } from 'zod';

const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
});

type User = z.infer<typeof UserSchema>;

const data = await response.json();
const user = UserSchema.parse(data); // Throws if invalid
```

**3. Defensive coding at boundaries:**
- Validate all external data (APIs, user input, localStorage)
- Use `unknown` instead of `any` for untyped data
- Add runtime checks at system boundaries

**Key Concepts:**
- **Type erasure**: TypeScript types don't exist at runtime
- **System boundaries**: Where external data enters your application
- **Schema validation**: Libraries that provide both types and runtime validation

**Follow-up Questions:**
1. How do you handle optional fields that might be `null` vs `undefined`?
2. What's your strategy for keeping Zod schemas in sync with TypeScript types?
3. How would you log type mismatches without crashing the application?

---

## Summary

### Key Takeaways
1. Use `interface` for extendable object shapes, `type` for unions and complex types
2. Generics enable reusable, type-safe code - use constraints to limit acceptable types
3. Utility types (`Partial`, `Pick`, `Omit`) reduce boilerplate and improve maintainability
4. Type narrowing with discriminated unions is the most robust pattern for handling variants
5. Always validate external data at runtime - TypeScript types are compile-time only

### Common Mistakes to Avoid
- Using `any` instead of `unknown` for untyped data
- Forgetting that TypeScript types don't exist at runtime
- Over-complicating types when simpler solutions exist

### Related Topics
- [React Hooks Study Guide](./react-hooks-study-guide.md)
- [State Management](../automation/state-management-study-guide.md)

---

## Practice Exercises

- [TypeScript Generics Exercise](../_practice/typescript-generics-problem.md)
