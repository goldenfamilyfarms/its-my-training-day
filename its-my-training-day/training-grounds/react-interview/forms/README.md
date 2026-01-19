# Advanced Form Handling - Interview Deep Dive

Production-ready form patterns using React Hook Form and Zod for type-safe, performant form validation.

## 🎯 Key Concepts

- **React Hook Form**: Performant form library (minimal re-renders)
- **Zod**: Runtime type validation with TypeScript inference
- **Field dependencies**: Conditional validation based on other fields
- **Async validation**: Server-side validation (unique email, etc.)
- **Multi-step forms**: Wizard patterns with validation

---

## Form Libraries Comparison

| Feature | Formik | React Hook Form | Uncontrolled Forms |
|---------|--------|-----------------|---------------------|
| Re-renders | High | Low | Minimal |
| Bundle size | 15KB | 9KB | 0KB |
| Learning curve | Medium | Low | Low |
| TypeScript | Good | Excellent | Manual |
| Validation | Yup | Zod/Yup/Custom | Manual |

**Recommendation**: React Hook Form + Zod for most cases

---

## Key Patterns

### 1. Basic Form with Validation

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof schema>;

function SignupForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    await api.signup(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email')} />
      {errors.email && <span>{errors.email.message}</span>}

      <input type="password" {...register('password')} />
      {errors.password && <span>{errors.password.message}</span>}

      <input type="password" {...register('confirmPassword')} />
      {errors.confirmPassword && <span>{errors.confirmPassword.message}</span>}

      <button disabled={isSubmitting}>Sign Up</button>
    </form>
  );
}
```

### 2. Async Validation

```typescript
const schema = z.object({
  username: z.string()
    .min(3)
    .refine(async (username) => {
      const available = await api.checkUsername(username);
      return available;
    }, 'Username already taken'),
});
```

### 3. Field Dependencies

```typescript
const schema = z.object({
  requiresApproval: z.boolean(),
  approverEmail: z.string().email().optional(),
}).refine(data => {
  if (data.requiresApproval) {
    return !!data.approverEmail;
  }
  return true;
}, {
  message: 'Approver email required when approval is needed',
  path: ['approverEmail'],
});
```

---

## 🔑 Key Patterns

- ✅ React Hook Form for performance
- ✅ Zod for type-safe validation
- ✅ Schema-driven validation
- ✅ Async validation for server checks
- ✅ Field dependencies
- ✅ Custom error messages

Good luck with your Adobe TechGRC interview! 🚀
