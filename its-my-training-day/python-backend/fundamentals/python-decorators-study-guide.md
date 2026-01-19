# Study Guide: Python Decorators

## Metadata
- **Track**: python-backend
- **Subdomain**: fundamentals
- **Difficulty**: Intermediate
- **Target Roles**: Backend Engineer, Python Developer, Automation Engineer
- **Estimated Time**: 45 minutes

## Questions

### Q1: What is a decorator in Python, and how does it work under the hood?

**Answer:**
A decorator is a function that takes another function as input and returns a modified version of that function. It's syntactic sugar for wrapping functions with additional behavior.

When you write:
```python
@my_decorator
def my_function():
    pass
```

Python translates this to:
```python
def my_function():
    pass
my_function = my_decorator(my_function)
```

The decorator pattern leverages Python's first-class functions—functions can be passed as arguments, returned from other functions, and assigned to variables.

A basic decorator structure:
```python
def my_decorator(func):
    def wrapper(*args, **kwargs):
        # Code before the function call
        result = func(*args, **kwargs)
        # Code after the function call
        return result
    return wrapper
```

**Key Concepts:**
- First-class functions
- Higher-order functions
- Closure (wrapper captures func in its scope)
- Function replacement

**Follow-up Questions:**
1. Why do we use `*args` and `**kwargs` in the wrapper function?
2. What happens to the original function's metadata (name, docstring)?

---

### Q2: How do you preserve the original function's metadata when using decorators?

**Answer:**
When you wrap a function with a decorator, the wrapper function replaces the original, losing its `__name__`, `__doc__`, and other metadata. This can break introspection and debugging.

The solution is `functools.wraps`, which copies metadata from the original function to the wrapper:

```python
from functools import wraps

def my_decorator(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return wrapper

@my_decorator
def greet(name):
    """Return a greeting message."""
    return f"Hello, {name}!"

# Without @wraps: greet.__name__ == 'wrapper'
# With @wraps: greet.__name__ == 'greet'
print(greet.__name__)  # 'greet'
print(greet.__doc__)   # 'Return a greeting message.'
```

`functools.wraps` preserves:
- `__name__` - Function name
- `__doc__` - Docstring
- `__module__` - Module where defined
- `__qualname__` - Qualified name
- `__annotations__` - Type annotations
- `__dict__` - Function attributes

**Key Concepts:**
- functools.wraps
- Function metadata preservation
- Introspection compatibility
- Debugging support

**Follow-up Questions:**
1. What problems might occur if you don't use `@wraps`?
2. How does `@wraps` actually work internally?

---

### Q3: How do you create a decorator that accepts arguments?

**Answer:**
To create a decorator with arguments, you need an additional layer of nesting—a decorator factory that returns the actual decorator:

```python
from functools import wraps

def repeat(times):
    """Decorator factory that repeats function execution."""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            result = None
            for _ in range(times):
                result = func(*args, **kwargs)
            return result
        return wrapper
    return decorator

@repeat(times=3)
def say_hello(name):
    print(f"Hello, {name}!")
    return name

# Equivalent to: say_hello = repeat(times=3)(say_hello)
say_hello("Alice")
# Output:
# Hello, Alice!
# Hello, Alice!
# Hello, Alice!
```

The execution flow:
1. `repeat(times=3)` is called, returns `decorator`
2. `decorator(say_hello)` is called, returns `wrapper`
3. `say_hello` now references `wrapper`

**Key Concepts:**
- Decorator factory pattern
- Three levels of nesting
- Closure over decorator arguments
- Parameterized behavior

**Follow-up Questions:**
1. How would you make the decorator work both with and without parentheses?
2. Can you use a class instead of nested functions for this pattern?

---

### Q4: What are class-based decorators and when would you use them?

**Answer:**
Class-based decorators use a class with `__call__` method instead of nested functions. They're useful when you need to maintain state across calls or want cleaner organization for complex decorators.

```python
from functools import wraps

class CountCalls:
    """Decorator that counts how many times a function is called."""
    
    def __init__(self, func):
        wraps(func)(self)
        self.func = func
        self.count = 0
    
    def __call__(self, *args, **kwargs):
        self.count += 1
        print(f"{self.func.__name__} called {self.count} times")
        return self.func(*args, **kwargs)

@CountCalls
def process_data(data):
    return data.upper()

process_data("hello")  # process_data called 1 times
process_data("world")  # process_data called 2 times
print(process_data.count)  # 2
```

For decorators with arguments, use `__init__` for arguments and `__call__` for the function:

```python
class Retry:
    def __init__(self, max_attempts=3):
        self.max_attempts = max_attempts
    
    def __call__(self, func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(self.max_attempts):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    if attempt == self.max_attempts - 1:
                        raise
        return wrapper

@Retry(max_attempts=5)
def fetch_data(url):
    # ... implementation
    pass
```

**Key Concepts:**
- `__call__` method makes instances callable
- State persistence across calls
- `wraps(func)(self)` for metadata preservation
- Cleaner organization for complex logic

**Follow-up Questions:**
1. What are the tradeoffs between function-based and class-based decorators?
2. How would you implement a decorator that works on both functions and methods?

---

### Q5: How do decorators work with class methods, and what's the difference between @staticmethod, @classmethod, and @property?

**Answer:**
Decorators on class methods work the same way, but you need to understand how Python's descriptor protocol interacts with them.

**@staticmethod** - No implicit first argument:
```python
class MyClass:
    @staticmethod
    def utility_function(x, y):
        return x + y

# Can be called without an instance
MyClass.utility_function(1, 2)  # 3
```

**@classmethod** - Receives class as first argument:
```python
class MyClass:
    count = 0
    
    @classmethod
    def increment(cls):
        cls.count += 1
        return cls.count

MyClass.increment()  # 1
```

**@property** - Turns method into attribute access:
```python
class Circle:
    def __init__(self, radius):
        self._radius = radius
    
    @property
    def radius(self):
        return self._radius
    
    @radius.setter
    def radius(self, value):
        if value < 0:
            raise ValueError("Radius cannot be negative")
        self._radius = value
    
    @property
    def area(self):
        return 3.14159 * self._radius ** 2

c = Circle(5)
print(c.radius)  # 5 (getter)
c.radius = 10    # setter
print(c.area)    # 314.159 (computed property)
```

**Custom decorators on methods:**
```python
def log_method(func):
    @wraps(func)
    def wrapper(self, *args, **kwargs):
        print(f"Calling {func.__name__} on {self.__class__.__name__}")
        return func(self, *args, **kwargs)
    return wrapper

class MyClass:
    @log_method
    def my_method(self, x):
        return x * 2
```

**Key Concepts:**
- Descriptor protocol
- Method binding
- Property getters/setters/deleters
- Decorator stacking order matters

**Follow-up Questions:**
1. In what order are stacked decorators applied?
2. How does @property implement the descriptor protocol?

---

### Q6: Implement a caching decorator (memoization) from scratch.

**Answer:**
A caching decorator stores function results to avoid redundant computation. Here's a production-quality implementation:

```python
from functools import wraps
from typing import Callable, Any

def memoize(func: Callable) -> Callable:
    """
    Cache function results based on arguments.
    Only works with hashable arguments.
    """
    cache = {}
    
    @wraps(func)
    def wrapper(*args, **kwargs):
        # Create a hashable key from arguments
        key = (args, tuple(sorted(kwargs.items())))
        
        if key not in cache:
            cache[key] = func(*args, **kwargs)
        
        return cache[key]
    
    # Expose cache for inspection/clearing
    wrapper.cache = cache
    wrapper.cache_clear = lambda: cache.clear()
    
    return wrapper

@memoize
def fibonacci(n: int) -> int:
    """Calculate nth Fibonacci number recursively."""
    if n < 2:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

# Without memoization: O(2^n) time
# With memoization: O(n) time
print(fibonacci(100))  # Instant!
print(fibonacci.cache)  # View cached values
fibonacci.cache_clear()  # Clear cache
```

For production, use `functools.lru_cache`:
```python
from functools import lru_cache

@lru_cache(maxsize=128)
def expensive_computation(x, y):
    # ... complex calculation
    return result

# LRU cache with size limit
expensive_computation.cache_info()  # CacheInfo(hits=0, misses=0, ...)
expensive_computation.cache_clear()
```

**Key Concepts:**
- Memoization pattern
- Hashable cache keys
- Cache invalidation
- functools.lru_cache for production use
- Time/space tradeoff

**Follow-up Questions:**
1. How would you add a TTL (time-to-live) to the cache?
2. What are the limitations of this caching approach?
3. How does `lru_cache` handle the maxsize limit?

---

### Q7: What is decorator chaining, and in what order are decorators applied?

**Answer:**
Multiple decorators can be stacked on a single function. They're applied bottom-up (closest to function first) but execute top-down.

```python
def decorator_a(func):
    print("Applying A")
    @wraps(func)
    def wrapper(*args, **kwargs):
        print("Before A")
        result = func(*args, **kwargs)
        print("After A")
        return result
    return wrapper

def decorator_b(func):
    print("Applying B")
    @wraps(func)
    def wrapper(*args, **kwargs):
        print("Before B")
        result = func(*args, **kwargs)
        print("After B")
        return result
    return wrapper

@decorator_a
@decorator_b
def greet(name):
    print(f"Hello, {name}!")
    return name

# Application order (bottom-up):
# Output: "Applying B"
# Output: "Applying A"

# Equivalent to: greet = decorator_a(decorator_b(greet))

greet("Alice")
# Execution order (top-down):
# Output: "Before A"
# Output: "Before B"
# Output: "Hello, Alice!"
# Output: "After B"
# Output: "After A"
```

Think of it like wrapping layers:
- `decorator_b` wraps the original function
- `decorator_a` wraps the result of `decorator_b`
- When called, you go through outer layer (A) first, then inner (B)

**Key Concepts:**
- Bottom-up application
- Top-down execution
- Wrapper nesting
- Order matters for behavior

**Follow-up Questions:**
1. How would the behavior change if you swapped the decorator order?
2. When might decorator order cause bugs?
