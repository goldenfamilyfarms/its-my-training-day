# Full-Stack Technical Interview Questions - Platform Engineering

This directory contains full-stack implementations that demonstrate integration between React frontend and Node.js backend, with a focus on type safety and shared data structures.

## Directory Contents

### 01-typescript-compliance-types.ts
**Question:** Design TypeScript types for a compliance system where different frameworks have different control structures, but we need to work with them uniformly while maintaining type safety.

**Key Concepts Demonstrated:**
- **Discriminated Unions** for framework types
- **Branded Types** for validated data
- **Generic Repository Pattern** for type-safe data access
- **Type-Safe Factory Methods** for object creation
- **Exhaustiveness Checking** for compile-time safety

**Step-by-Step Implementation:**

1. **Discriminated Unions:**
   ```typescript
   type ComplianceControl = SOC2Control | FedRAMPControl | ISO27001Control | PCIControl;
   ```
   - Type-safe framework discrimination
   - Exhaustiveness checking
   - Framework-specific property access

2. **Base Control Structure:**
   - Common fields across all frameworks
   - Framework-specific extensions
   - Type-safe inheritance

3. **Branded Types:**
   ```typescript
   type ValidatedControlId = string & { readonly __brand: 'ValidatedControlId' };
   ```
   - Prevent invalid data from being used
   - Compile-time safety
   - Runtime validation required

4. **Generic Repository:**
   - Type-safe queries
   - Framework-specific filtering
   - Generic update operations

5. **Factory Pattern:**
   - Type-safe object creation
   - Framework-specific validation
   - Compile-time type inference

**Interview Talking Points:**
- Discriminated unions: Type narrowing, exhaustiveness checking
- Branded types: Runtime validation, compile-time safety
- Generic repositories: Type-safe data access, framework abstraction
- Factory pattern: Centralized creation, type inference

---

## Common Patterns

### Type Safety Patterns

1. **Discriminated Unions:**
   - Type narrowing in switch statements
   - Exhaustiveness checking
   - Framework-specific property access

2. **Branded Types:**
   - Runtime validation
   - Compile-time type safety
   - Prevent invalid data usage

3. **Type Guards:**
   - Runtime type checking
   - Type narrowing
   - Safe type assertions

### Data Access Patterns

1. **Repository Pattern:**
   - Abstract data access
   - Type-safe queries
   - Framework-specific operations

2. **Factory Pattern:**
   - Centralized creation
   - Type inference
   - Validation

---

## Interview Preparation Tips

### When Discussing Type Safety:

1. **Why TypeScript?**
   - Catch errors at compile time
   - Better IDE support
   - Self-documenting code

2. **Type Safety Trade-offs:**
   - More verbose
   - Learning curve
   - Compile-time overhead

3. **Advanced Types:**
   - Generics
   - Conditional types
   - Mapped types

---

## Dependencies

```json
{
  "typescript": "^5.0.0"
}
```

---

## Additional Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)
- [Effective TypeScript](https://effectivetypescript.com/)

