# 1.0.0-beta.1 (2025-09-18)


### Bug Fixes

* add debugging to sync-to-beta workflow ([d322f3b](https://github.com/Ked57/frey/commit/d322f3b3f10e8f0a407ba34b184f5e3811956a8e))
* add explicit tag fetching to prevent semantic-release conflicts ([7ecba9f](https://github.com/Ked57/frey/commit/7ecba9fbafe84900bbb29c32efe1d6b2f309110e))
* add master branch back to semantic-release config ([fdd7cf8](https://github.com/Ked57/frey/commit/fdd7cf8f9cfc1fddabaec9915fb92364da2d7be7))
* add missing conventional-changelog-conventionalcommits dependency ([7ee4cfa](https://github.com/Ked57/frey/commit/7ee4cfab4c661ec7a7265c7d63462feef6b9bfc3))
* add smart tag checking to prevent duplicate beta releases ([fda2b55](https://github.com/Ked57/frey/commit/fda2b5586565a13287acc4546b0e53f138d1dca7))
* configure semantic-release to work properly on beta branch ([5894c75](https://github.com/Ked57/frey/commit/5894c7596357edfc1fe5ae922325cfb4aac38f41))
* ensure beta-release workflow always triggers after rebase ([fa8b2dc](https://github.com/Ked57/frey/commit/fa8b2dc1de0f0fbdc304bcc972abf27fc93119c0))
* ensure beta-release workflow uses latest beta branch ([4c80f20](https://github.com/Ked57/frey/commit/4c80f209094c17e498a908dbe55db15cdf5aedad))
* improve release workflow with rebase and consistent npm auth ([2ac344c](https://github.com/Ked57/frey/commit/2ac344c01ca08e668ef1d452d03d13c84c903253))
* prettier formatting ([1ac315b](https://github.com/Ked57/frey/commit/1ac315b81572ce20845a5918bda27dde4f5cacaa))
* remove [skip ci] from empty commit to trigger beta-release ([129b2fb](https://github.com/Ked57/frey/commit/129b2fb945f2de2a487796d1650b2a5c3e87c600))
* remove [skip ci] from semantic-release git plugin ([e486d64](https://github.com/Ked57/frey/commit/e486d64728b69ed69e0374367e85151b66b766a0))
* remove master from semantic-release branches config ([57e9867](https://github.com/Ked57/frey/commit/57e9867b0ff012fd2713d90a80fe7c882b397961))
* remove registry-url from setup-node to fix npm token auth ([c99cbc7](https://github.com/Ked57/frey/commit/c99cbc7622e081489a6a5e0e6d60781ec194f6bc))
* resolve semantic-release configuration issues ([7ed0826](https://github.com/Ked57/frey/commit/7ed08268f6472822414792f1c3cc9b47ddb92a11))
* resolve semantic-release master branch reference issue ([33f27b1](https://github.com/Ked57/frey/commit/33f27b1256cabddfa30c2e071ea7a61e86801eeb))
* simplify manual release workflow to use semantic-release ([29ed9b0](https://github.com/Ked57/frey/commit/29ed9b06d74611f98c24af048baee6a58fba2827))
* switch back to merge with explicit commit message ([2fd1714](https://github.com/Ked57/frey/commit/2fd1714f95002f04243b2c0599ad3678f355687b))


### Features

* add beta promotion to manual release workflow ([c76c1b9](https://github.com/Ked57/frey/commit/c76c1b92385cdf16c1fef34255fced6e9cf12973))
* add comprehensive Phase 2 roadmap ([a282f67](https://github.com/Ked57/frey/commit/a282f67801cb28350aa1eaee83989d905a8653ea))
* implement automated release process with prerelease and manual release workflows ([6a1b3d7](https://github.com/Ked57/frey/commit/6a1b3d79041bc8fca55de3cbc27f8e17d19cac66))
* implement beta branch approach for prerelease management ([3c23f84](https://github.com/Ked57/frey/commit/3c23f844825fbcea495fa8870c3a13993705ccfc))
* initial release of Frey framework ([#1](https://github.com/Ked57/frey/issues/1)) ([971f1bc](https://github.com/Ked57/frey/commit/971f1bc89981ae8657491f66314e11aaf0bbb9c7))
* rename package to frey and clean up changelog ([90675ee](https://github.com/Ked57/frey/commit/90675ee96b4e128e0f719a0286eb832d44ac518a))
* setup CI/CD pipeline with beta pre-releases and manual releases ([5ac7dbd](https://github.com/Ked57/frey/commit/5ac7dbd680b9ed4fce6c0665bb89dc995bc6e28f))

# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [1.0.0](https://github.com/Ked57/frey/compare/v1.0.0-beta.3...v1.0.0) (2025-09-18)

### Features

* **Initial Release**: Frey framework for entity-driven API generation with Fastify
* **Multi-runtime Support**: Compatible with both Node.js and Bun (3x faster with Bun)
* **Comprehensive Testing**: 53 tests across unit and integration
* **TypeScript Support**: Full TypeScript support with strict mode
* **CRUD Operations**: Automatic CRUD route generation
* **Custom Routes**: Support for custom route definitions
* **Parameter Parsing**: Advanced query parameter parsing and validation
* **Security**: Zero tolerance for vulnerabilities with automated auditing
* **Code Quality**: Prettier formatting and comprehensive linting

### Technical Details

* Entity-driven API generation
* Fastify integration
* Modular CRUD operations
* Type-safe parameter parsing
* Multi-runtime compatibility
* Comprehensive test coverage
* Automated security scanning
