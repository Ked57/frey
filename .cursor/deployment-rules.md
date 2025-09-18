# Deployment Rules - Frey Framework

## CI/CD Pipeline Overview

### Workflow Structure
```
.github/workflows/
├── ci.yml              # Main CI pipeline
├── release.yml         # Automated releases
├── security.yml        # Security scanning
└── dependabot.yml     # Dependency updates
```

### Pipeline Stages
1. **Linting & Formatting** - Code quality checks
2. **Testing** - Multi-runtime test execution
3. **Security** - Vulnerability scanning
4. **Build** - TypeScript compilation
5. **Release** - Automated publishing

## CI Pipeline Rules

### Quality Gates
```yaml
# All checks must pass before merge
- ✅ Prettier formatting
- ✅ TypeScript strict mode
- ✅ All tests pass
- ✅ No security vulnerabilities
- ✅ Multi-runtime compatibility
```

### Matrix Testing Strategy
```yaml
# Node.js versions
node-version: ['18', '20', '21']

# Operating systems
os: [ubuntu-latest, macos-latest, windows-latest]

# JavaScript runtimes
runtime: [node, bun]
```

### Performance Benchmarks
- **Node.js**: Tests complete in ~400-500ms
- **Bun**: Tests complete in ~130-220ms (3x faster)
- **Build time**: < 30 seconds
- **Total CI time**: < 5 minutes

## Security Pipeline

### Security Checks
```yaml
# Dependency scanning
- npm audit (moderate+ vulnerabilities)
- CodeQL analysis
- License compliance
- Dependabot updates
```

### Security Rules
- **Zero tolerance** for high/critical vulnerabilities
- **Immediate updates** for security patches
- **License compliance** for all dependencies
- **Regular dependency updates** via Dependabot

### Vulnerability Response
1. **Immediate**: Fix critical/high vulnerabilities
2. **Within 24h**: Address moderate vulnerabilities
3. **Weekly**: Review and update dependencies
4. **Monthly**: Security audit and review

## Release Pipeline

### Release Triggers
```yaml
# Automatic releases on version tags
on:
  push:
    tags:
      - 'v*.*.*'
```

### Release Process
1. **Build** - TypeScript compilation
2. **Test** - Full test suite execution
3. **Package** - Create distribution files
4. **Publish** - Upload to npm registry
5. **Release** - Create GitHub release

### Version Management
- **Semantic Versioning** (SemVer)
- **Automated versioning** via GitHub Actions
- **Changelog generation** from commits
- **Release notes** with breaking changes

## Environment Configuration

### Required Secrets
```yaml
# GitHub Secrets
NPM_TOKEN: npm publish token
GITHUB_TOKEN: GitHub API token (auto-provided)
```

### Environment Variables
```bash
# Development
NODE_ENV=development
PORT=3000

# Production
NODE_ENV=production
PORT=8080
```

## Build Configuration

### TypeScript Build
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "dist",
    "declaration": true,
    "declarationMap": true
  }
}
```

### Build Artifacts
```
dist/
├── main.js           # Compiled JavaScript
├── main.d.ts         # TypeScript declarations
├── main.d.ts.map     # Declaration source maps
├── entity.js         # Entity module
├── entity.d.ts       # Entity declarations
└── routes/           # Route modules
```

## Deployment Strategies

### NPM Package Deployment
```yaml
# Package configuration
name: "frey"
version: "1.0.0"
main: "./dist/main.js"
types: "./dist/main.d.ts"
files: ["dist/**/*"]
```

### Docker Deployment (Future)
```dockerfile
# Multi-stage build for production
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:20-alpine AS runtime
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY dist ./dist
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

## Monitoring & Observability

### Health Checks
```typescript
// Health check endpoint
server.get('/health', async (request, reply) => {
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version,
    runtime: process.version,
  };
});
```

### Logging Standards
```typescript
// Structured logging
server.log.info({
  event: 'server_started',
  port: opts.port,
  entities: opts.entities.length,
  runtime: process.version,
});
```

### Metrics Collection
- **Response times** for entity operations
- **Error rates** by endpoint
- **Memory usage** patterns
- **CPU utilization** during peak loads

## Rollback Procedures

### Automated Rollback
```yaml
# Rollback on failed deployment
- Monitor health checks
- Automatic rollback on health check failures
- Notification to team on rollback events
```

### Manual Rollback
1. **Identify** problematic version
2. **Revert** to previous stable version
3. **Deploy** previous version
4. **Verify** system health
5. **Investigate** root cause

## Performance Monitoring

### Key Metrics
- **Response Time**: < 100ms for entity operations
- **Throughput**: > 1000 requests/second
- **Memory Usage**: < 100MB baseline
- **CPU Usage**: < 50% under normal load

### Performance Testing
```bash
# Load testing
npm run test:load

# Performance benchmarks
npm run benchmark

# Memory profiling
npm run profile:memory
```

## Disaster Recovery

### Backup Strategy
- **Code**: Git repository (primary)
- **Dependencies**: package-lock.json
- **Configuration**: Environment variables
- **Documentation**: README and docs

### Recovery Procedures
1. **Code Recovery**: Git clone from repository
2. **Dependency Recovery**: npm install from package-lock.json
3. **Configuration Recovery**: Environment variable restoration
4. **Service Recovery**: Restart services

## Compliance & Governance

### License Compliance
- **MIT License** for open source
- **Dependency licenses** checked via license-checker
- **Third-party licenses** documented
- **License compatibility** verified

### Audit Trail
- **Git commits** with conventional commits
- **Release notes** with changelog
- **Security scans** with results
- **Dependency updates** with rationale

## Environment-Specific Rules

### Development Environment
- **Hot reloading** enabled
- **Debug logging** enabled
- **Test data** populated
- **Mock services** available

### Staging Environment
- **Production-like** configuration
- **Integration tests** enabled
- **Performance testing** scheduled
- **Security scanning** active

### Production Environment
- **Minimal logging** (errors only)
- **Performance monitoring** active
- **Security scanning** continuous
- **Backup procedures** automated

## Deployment Checklist

### Pre-Deployment
- [ ] All tests pass
- [ ] Security scan clean
- [ ] Dependencies up to date
- [ ] Documentation updated
- [ ] Version bumped
- [ ] Changelog updated

### Deployment
- [ ] Build successful
- [ ] Package published to npm
- [ ] GitHub release created
- [ ] Health checks passing
- [ ] Monitoring active

### Post-Deployment
- [ ] Verify functionality
- [ ] Monitor metrics
- [ ] Check error rates
- [ ] Validate performance
- [ ] Update documentation

## Troubleshooting

### Common Issues
- **Build failures**: Check TypeScript errors
- **Test failures**: Verify multi-runtime compatibility
- **Security failures**: Update vulnerable dependencies
- **Deployment failures**: Check environment configuration

### Debug Commands
```bash
# Debug CI locally
npm run ci:local

# Debug security issues
npm audit --audit-level=moderate

# Debug build issues
npm run build:debug

# Debug test failures
npm run test:debug
```

## Best Practices

### Deployment Frequency
- **Feature releases**: Weekly
- **Bug fixes**: As needed
- **Security updates**: Immediate
- **Major versions**: Quarterly

### Change Management
- **Small, frequent** deployments
- **Feature flags** for gradual rollouts
- **Blue-green** deployments for zero downtime
- **Canary releases** for risk mitigation

### Communication
- **Release notes** for all changes
- **Breaking changes** clearly documented
- **Migration guides** for major updates
- **Team notifications** for deployments
