# CI/CD for React Applications - Interview Deep Dive

Production-ready CI/CD pipelines for React applications with GitHub Actions, testing, and deployment.

## 🎯 Key Concepts

- **Continuous Integration**: Automated testing on every commit
- **Continuous Deployment**: Automated deployment to production
- **Quality Gates**: Prevent bad code from reaching production
- **Docker**: Containerization for consistent deployments

---

## GitHub Actions Pipeline

### Complete CI/CD Workflow

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Type check
        run: npm run type-check

      - name: Unit tests
        run: npm run test:unit

      - name: Integration tests
        run: npm run test:integration

      - name: Build
        run: npm run build

      - name: E2E tests
        run: npm run test:e2e

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Run Snyk security scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

      - name: Run npm audit
        run: npm audit --audit-level=high

  deploy:
    needs: [test, security]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Build Docker image
        run: docker build -t myapp:${{ github.sha }} .

      - name: Push to registry
        run: |
          echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
          docker push myapp:${{ github.sha }}

      - name: Deploy to production
        run: kubectl set image deployment/myapp myapp=myapp:${{ github.sha }}
```

---

## Docker Multi-Stage Build

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# Production image
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

---

## Quality Gates

**Required checks before merge**:
- ✅ All tests pass (unit, integration, e2e)
- ✅ Code coverage > 80%
- ✅ No ESLint errors
- ✅ No TypeScript errors
- ✅ No security vulnerabilities (Snyk, npm audit)
- ✅ Bundle size < 500KB
- ✅ Lighthouse score > 90

---

## 🔑 Key Components

- ✅ GitHub Actions for CI/CD
- ✅ Multi-stage Docker builds
- ✅ Security scanning (Snyk)
- ✅ Quality gates (tests, lint, type-check)
- ✅ Automated deployment
- ✅ Environment-specific configs

Good luck with your Adobe TechGRC interview! 🚀
