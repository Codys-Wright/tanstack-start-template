# Reference Implementations

This directory contains reference implementations and examples for comparison and learning.

## better-auth-effect

**Location**: `reference/better-auth-effect/`  
**Repository**: https://github.com/artimath/better-auth-effect  
**Type**: Git Submodule

A production-ready Effect.ts integration for Better Auth with Kysely/Postgres support.

### Key Files to Review:

- `src/service.ts` - Auth service implementation
- `src/router.ts` - Better Auth router integration
- `src/kysely.ts` - Kysely database adapter
- `src/index.ts` - Main exports

### Features:

- Type-safe Better Auth integration using Effect.ts
- Kysely database adapter for Postgres
- Effect layers for dependency injection
- HTTP middleware for authentication
- Built for production use

### To Update:

```bash
cd reference/better-auth-effect
git pull origin main
```

### To Remove:

```bash
git submodule deinit reference/better-auth-effect
git rm reference/better-auth-effect
```

## Adding New References

To add more reference implementations:

```bash
git submodule add <repository-url> reference/<name>
```
