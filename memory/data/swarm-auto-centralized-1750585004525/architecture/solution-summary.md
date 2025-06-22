# Next.js 15 Params Await Fix - Solution Architecture

## Executive Summary

**Problem**: Next.js 15 changed `params` from synchronous objects to asynchronous Promises, breaking existing code that destructures `params` directly in function signatures.

**Solution**: Transform all function signatures to receive `params` as a Promise, then await and destructure inside the function body.

**Impact**: Affects all dynamic route layouts, pages, and components that receive params.

---

## Critical Transformation Pattern

### The Core Fix:
```tsx
// ❌ BROKEN (Next.js 14 style):
export default async function Layout({
  children,
  params: { locale }
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {

// ✅ FIXED (Next.js 15 style):
export default async function Layout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
```

---

## Immediate Action Required

### CRITICAL FIX - File: `/workspaces/funerally/app/[locale]/layout.tsx`

**Current Code (Lines 17-23):**
```tsx
export default async function LocaleLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
```

**Fixed Code:**
```tsx
export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
```

**Action Steps:**
1. Remove `: { locale }` from params in function signature
2. Change type from `params: { locale: string }` to `params: Promise<{ locale: string }>`
3. Add `const { locale } = await params;` as first line in function body

---

## Templates for Different Scenarios

### 1. Layout Template
```tsx
export default async function Layout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ [key: string]: string }>;
}) {
  const resolvedParams = await params;
  // Use resolvedParams.paramName
  
  return <div>{children}</div>;
}
```

### 2. Page Template
```tsx
export default async function Page({
  params,
  searchParams
}: {
  params: Promise<{ [key: string]: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  
  return <div>Content</div>;
}
```

### 3. Component Template
```tsx
export default async function Component({
  params
}: {
  params: Promise<{ [key: string]: string }>;
}) {
  const resolvedParams = await params;
  
  return <div>Component</div>;
}
```

---

## Implementation Sequence (Dependency-Safe Order)

### Phase 1: Root Layout (CRITICAL - 5 minutes)
- ✅ Fix `/workspaces/funerally/app/[locale]/layout.tsx`
- ✅ Test with `npm run build`

### Phase 2: Identify All Affected Files (10 minutes)
- Search for `params:` patterns
- Find all dynamic route directories
- Catalog all affected files

### Phase 3: Page Components (15 minutes)
- Fix all `page.tsx` files in dynamic routes
- Handle both params and searchParams

### Phase 4: Nested Layouts (10 minutes)
- Fix nested dynamic route layouts
- Ensure parent-child compatibility

### Phase 5: Components (10 minutes)
- Fix remaining components with params
- Handle forwarded params scenarios

---

## Error Prevention Strategies

### Before Starting:
- ✅ Commit current changes
- ✅ Run `npm run build` to establish baseline
- ✅ Run existing tests

### During Implementation:
- ✅ Fix one file at a time
- ✅ Run `npm run typecheck` after each file
- ✅ Test with `npm run dev` frequently

### After Each Phase:
- ✅ Run `npm run build`
- ✅ Test dynamic routes manually
- ✅ Verify no console errors

---

## Common Mistakes to Avoid

1. **❌ Forgetting to await params**
   ```tsx
   const { locale } = params; // Wrong!
   const { locale } = await params; // Correct!
   ```

2. **❌ Not updating TypeScript types**
   ```tsx
   params: { locale: string } // Wrong!
   params: Promise<{ locale: string }> // Correct!
   ```

3. **❌ Missing async keyword**
   ```tsx
   export default function Layout() // Wrong!
   export default async function Layout() // Correct!
   ```

4. **❌ Destructuring in function signature**
   ```tsx
   params: { locale } // Wrong!
   params // Correct!
   ```

---

## Batch Operation Commands

### Find All Affected Files:
```bash
# Search for params destructuring patterns
rg "params:\s*{[^}]+}" --type tsx --type ts

# Find dynamic route directories
find app -name "\[*\]" -type d

# Find all TypeScript files in dynamic routes
find app -path "*/\[*\]/*" -name "*.tsx"
```

### Validation Commands:
```bash
# Check TypeScript
npm run typecheck

# Build check
npm run build

# Test suite
npm run test
```

---

## Files Created in Memory

All templates and patterns are stored in:
- `/workspaces/funerally/memory/data/swarm-auto-centralized-1750585004525/architecture/`

### Key Files:
- `fix-patterns.json` - Complete transformation patterns
- `layout-template.tsx` - Reusable layout template
- `page-template.tsx` - Reusable page template  
- `exact-transformation.tsx` - Precise fix for current layout.tsx
- `implementation-plan.md` - Detailed implementation sequence
- `solution-summary.md` - This comprehensive overview

---

## Success Criteria

### Technical:
- ✅ No TypeScript errors
- ✅ Build completes successfully
- ✅ All tests pass
- ✅ No runtime console errors

### Functional:
- ✅ All locale routes work (`/en/`, `/es/`, etc.)
- ✅ Dynamic nested routes function correctly
- ✅ Search parameters parse properly
- ✅ Static generation works for all locales

---

## Ready for Implementation

The solution architecture is complete and ready for swarm execution. The critical path starts with fixing `/workspaces/funerally/app/[locale]/layout.tsx` using the exact transformation provided.

**Next Step**: Execute Phase 1 by applying the exact transformation to the layout.tsx file.