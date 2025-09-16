# GitHub Actions CI/CD Pipeline

This repository includes a comprehensive CI/CD pipeline using GitHub Actions.

## Workflows

### 🔄 CI Pipeline (`ci.yml`)
Runs on every push and pull request to `main` and `proto` branches:

- **Lint & Format Check**: Prettier formatting and TypeScript compilation
- **Test Suite**: Runs all tests with coverage reporting (artifacts uploaded)
- **Build Verification**: Ensures TypeScript compilation works
- **Matrix Testing**: Tests on Node.js 18, 20, 21 across Ubuntu, macOS, Windows
- **Security Check**: NPM audit and vulnerability scanning

### 🚀 Release Pipeline (`release.yml`)
Triggers on version tags (e.g., `v1.0.0`):

- **Build & Package**: Creates distribution package
- **Publish to NPM**: Automatically publishes to npm registry
- **Create GitHub Release**: Generates release notes and artifacts

### 🔒 Security Pipeline (`security.yml`)
Runs weekly and on demand:

- **Dependency Scan**: NPM audit and vulnerability checks
- **Code Scan**: GitHub CodeQL analysis (with proper permissions)
- **Dependency Updates**: Check for outdated packages
- **License Check**: License compliance verification

## Configuration Files

- **Dependabot** (`.github/dependabot.yml`): Automated dependency updates
- **Issue Templates**: Bug reports and feature requests
- **Pull Request Template**: Standardized PR format

## Required Secrets

To enable full functionality, add these secrets to your repository:

- `NPM_TOKEN`: NPM authentication token for publishing (for releases only)

## Scripts

The following npm scripts support the CI pipeline:

- `npm run lint`: Check code formatting
- `npm run format:fix`: Fix formatting issues
- `npm run test:run`: Run tests once
- `npm run test:coverage`: Run tests with coverage
- `npm run build`: TypeScript compilation check
- `npm run type-check`: Strict TypeScript checking
- `npm run audit`: Security audit

## Quality Gates

The CI pipeline enforces:

- ✅ All tests must pass
- ✅ Code must be properly formatted
- ✅ TypeScript compilation must succeed
- ✅ No critical security vulnerabilities
- ✅ Coverage reports generated (available as artifacts)

