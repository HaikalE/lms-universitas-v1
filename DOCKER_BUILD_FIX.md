# Docker Build Fix - TypeScript Regular Expression Error

## Problem
The Docker build was failing with the error:
```
TS1161: Unterminated regular expression literal.
```

## Root Cause
The file `frontend/src/hooks/useAccessibility.ts` was using `.ts` extension but contained JSX syntax. TypeScript compiler was interpreting JSX tags as incomplete regular expressions.

## Solution
1. **Renamed the file** from `useAccessibility.ts` to `useAccessibility.tsx`
2. **Updated the file extension** to properly support JSX syntax
3. **Kept all functionality intact** - no code changes needed, just file extension

## Files Changed
- `frontend/src/hooks/useAccessibility.ts` → `frontend/src/hooks/useAccessibility.tsx`

## Technical Details
- The error occurred because TypeScript treats `.ts` files as pure TypeScript (no JSX)
- When JSX syntax like `<div>` is encountered in a `.ts` file, TypeScript interprets `<` as the start of a generic type parameter
- The JSX closing tag `>` is then seen as an incomplete regex pattern
- Using `.tsx` extension tells TypeScript to expect and properly parse JSX syntax

## Verification
After this fix, the Docker build should complete successfully:
```bash
docker-compose up --build -d
```

## Prevention
Always use:
- `.ts` for pure TypeScript files (no JSX)
- `.tsx` for TypeScript files that contain JSX/React components
