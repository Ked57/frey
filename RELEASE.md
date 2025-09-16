# Release Process

This document describes the release process for the Frey project using semantic-release.

## Overview

Frey uses [semantic-release](https://semantic-release.gitbook.io/) for automated versioning and changelog generation. The system automatically determines the next version number based on commit messages following the [Conventional Commits](https://conventionalcommits.org/) specification.

## Automatic Releases

### Master Branch
- **Trigger**: Every commit to the `master` branch
- **Process**: 
  1. CI runs tests and checks
  2. If tests pass, semantic-release analyzes commits
  3. If there are releasable changes, creates a new version
  4. Updates CHANGELOG.md and package.json
  5. Creates a GitHub release
  6. Commits the version changes back to master

### Beta Branch
- **Trigger**: Every commit to the `beta` branch
- **Process**: Creates prerelease versions (e.g., `1.0.0-beta.1`)

## Manual Releases

Use the GitHub Actions "Manual Release" workflow:

1. Go to Actions tab in GitHub
2. Select "Manual Release" workflow
3. Click "Run workflow"
4. Choose release type:
   - **Patch**: Bug fixes (1.0.0 → 1.0.1)
   - **Minor**: New features (1.0.0 → 1.1.0)
   - **Major**: Breaking changes (1.0.0 → 2.0.0)
   - **Prerelease**: Beta/alpha versions

## Commit Convention

Follow [Conventional Commits](https://conventionalcommits.org/) for automatic versioning:

### Format
```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types
- `feat:` - New features (minor version bump)
- `fix:` - Bug fixes (patch version bump)
- `docs:` - Documentation changes (no version bump)
- `style:` - Code style changes (no version bump)
- `refactor:` - Code refactoring (no version bump)
- `perf:` - Performance improvements (patch version bump)
- `test:` - Adding or updating tests (no version bump)
- `build:` - Build system changes (no version bump)
- `ci:` - CI configuration changes (no version bump)
- `chore:` - Maintenance tasks (no version bump)
- `revert:` - Reverting changes (patch version bump)

### Breaking Changes
Use `BREAKING CHANGE:` in the footer or add `!` after the type:
```
feat!: remove deprecated API
feat: add new feature

BREAKING CHANGE: The old API has been removed
```

## First Release Setup

1. **Prepare the repository**:
   ```bash
   npm run prepare-release
   ```

2. **Switch to master branch**:
   ```bash
   git checkout master
   ```

3. **Commit changes with conventional format**:
   ```bash
   git add .
   git commit -m "feat: add semantic release system"
   ```

4. **Push to master**:
   ```bash
   git push origin master
   ```

5. **Monitor CI**: The GitHub Actions workflow will automatically run semantic-release

## Configuration Files

- `.releaserc.json` - Semantic-release configuration
- `.github/workflows/ci.yml` - CI/CD pipeline
- `.github/workflows/release.yml` - Manual release workflow
- `.commitlintrc.json` - Commit message linting rules

## Troubleshooting

### No Release Created
- Check if commits follow conventional commit format
- Verify you're on the correct branch (master for releases)
- Check CI logs for errors

### Wrong Version Bump
- Review commit messages for correct type prefixes
- Use `BREAKING CHANGE:` for major version bumps

### Manual Release Issues
- Ensure GitHub Actions has necessary permissions
- Check that NPM_TOKEN secret is configured (if publishing to npm)

## Environment Variables

Required secrets in GitHub repository settings:
- `GITHUB_TOKEN` - Automatically provided by GitHub Actions
- `NPM_TOKEN` - Required if publishing to npm (optional for now since `npmPublish: false`)

## Local Testing

Test semantic-release locally (dry run):
```bash
npx semantic-release --dry-run
```

**Note**: This won't create actual releases, just shows what would happen.
