# Release Process Documentation

This document describes the automated release process for the Frey project, which includes both automatic prerelease versions and manual release capabilities.

## Overview

The release process consists of two main workflows:

1. **Automatic Prerelease**: Triggered on every push to `master` branch
2. **Manual Release**: Triggered manually for specific tags

## Automatic Prerelease Process

### Trigger
- **When**: Every push to the `master` branch
- **What**: Syncs master to beta branch, then beta branch creates prerelease versions

### Workflow
1. **CI Workflow (on master push)**:
   - Runs all tests and quality checks
   - Syncs `master` branch to `beta` branch automatically
   
2. **Beta Release Workflow (on beta push)**:
   - Runs semantic-release on `beta` branch
   - Analyzes commits using conventional commits
   - Generates changelog
   - Publishes to npm with `beta` prerelease tag
   - Creates GitHub release as prerelease
   - Updates package.json and commits changes

### Configuration
- **Prerelease identifier**: `beta`
- **Branch**: `beta` (automatically synced from `master`)
- **NPM tag**: `beta` (users install with `npm install freyjs-test@beta`)

## Manual Release Process

### Trigger
- **When**: Manual trigger via GitHub Actions UI
- **What**: Creates stable releases for specific tags

### Usage
1. Go to GitHub Actions → "Manual Release" workflow
2. Click "Run workflow"
3. Enter the tag name (e.g., `v1.0.0`)
4. Choose whether to mark as prerelease
5. Click "Run workflow"

### Workflow
1. Verifies the tag exists
2. Checks out the specific tag
3. Updates package.json version
4. Generates/updates changelog
5. Creates GitHub release
6. Publishes to npm as stable version
7. Pushes changes

## Required Secrets

Make sure these secrets are configured in your GitHub repository:

- `GH_TOKEN`: GitHub token with repository permissions
- `NPM_TOKEN`: NPM token for publishing packages

## Version Numbering

### Prerelease Versions (Automatic)
- Format: `MAJOR.MINOR.PATCH-beta.N`
- Examples: `1.0.0-beta.1`, `1.0.0-beta.2`, `1.1.0-beta.1`

### Stable Versions (Manual)
- Format: `MAJOR.MINOR.PATCH`
- Examples: `1.0.0`, `1.1.0`, `2.0.0`

## Commit Convention

The project uses [Conventional Commits](https://www.conventionalcommits.org/) to determine version bumps:

- `feat:` → Minor version bump
- `fix:` → Patch version bump
- `BREAKING CHANGE:` → Major version bump
- Other commits → No version bump

## Files Modified During Release

### Automatic Prerelease
- `package.json` (version)
- `package-lock.json` (version)
- `CHANGELOG.md` (new entries)

### Manual Release
- `package.json` (version)
- `package-lock.json` (version)
- `CHANGELOG.md` (new entries)

## NPM Package Tags

- **Stable releases**: Default tag (latest)
- **Prerelease versions**: `beta` tag

Users can install specific versions:
```bash
# Latest stable
npm install freyjs-test

# Latest prerelease
npm install freyjs-test@beta

# Specific version
npm install freyjs-test@1.0.0
```

## GitHub Releases

### Prerelease
- Automatically created on every push to master
- Marked as "prerelease"
- Includes changelog and release notes

### Stable Release
- Created manually for specific tags
- Can be marked as prerelease or stable
- Includes changelog and release notes

## Troubleshooting

### Common Issues

1. **Release fails due to missing secrets**
   - Ensure `GH_TOKEN` and `NPM_TOKEN` are configured
   - Check token permissions

2. **NPM publish fails**
   - Verify NPM token has publish permissions
   - Check if version already exists

3. **GitHub release fails**
   - Ensure GitHub token has repository write permissions
   - Check if release already exists for the tag

### Manual Recovery

If automatic releases fail, you can:

1. Use the manual release workflow
2. Manually create tags and releases
3. Manually publish to NPM

## Best Practices

1. **Always test prerelease versions** before creating stable releases
2. **Use conventional commits** for proper version bumping
3. **Review changelog** before manual releases
4. **Tag releases** with meaningful names (e.g., `v1.0.0`)
5. **Keep master branch stable** - all pushes trigger prereleases

## Beta Branch Management

The `beta` branch is automatically maintained and kept in sync with `master`:

- **Automatic Sync**: Every push to `master` automatically updates the `beta` branch
- **No Manual Maintenance**: You don't need to manually maintain the `beta` branch
- **Prerelease Versions**: Semantic-release runs on the `beta` branch to create prerelease versions
- **Clean Separation**: `master` stays clean while `beta` handles prerelease versions

## Workflow Files

- `.github/workflows/ci.yml` - Contains tests and sync-to-beta job (runs on master)
- `.github/workflows/beta-release.yml` - Beta release workflow (runs on beta branch)
- `.github/workflows/release.yml` - Manual release workflow
- `.releaserc.json` - Semantic-release configuration