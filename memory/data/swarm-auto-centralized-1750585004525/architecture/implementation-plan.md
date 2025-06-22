# Next.js 15 Params Await Fix - Implementation Sequence Plan

## Phase 1: Critical Root Layout Fix (PRIORITY: CRITICAL)
**Duration: 5 minutes**

### Files to Fix:
- `/workspaces/funerally/app/[locale]/layout.tsx` (IMMEDIATE)

### Actions:
1. Apply exact transformation from `exact-transformation.tsx`
2. Change function signature: `params: { locale }` → `params`
3. Update TypeScript type: `params: { locale: string }` → `params: Promise<{ locale: string }>`
4. Add await statement: `const { locale } = await params;`
5. Test with `npm run build` to verify fix

### Success Criteria:
- No TypeScript errors
- Build completes successfully
- Layout renders correctly

---

## Phase 2: Search and Identify All Affected Files (PRIORITY: HIGH)
**Duration: 10 minutes**

### Search Patterns:
```bash
# Find all files with params destructuring in function signatures
rg "params:\s*{[^}]+}" --type tsx --type ts

# Find all dynamic route files
find app -name "[*]" -type d

# Find all page.tsx and layout.tsx files in dynamic routes
find app -path "*/[*]/*" -name "*.tsx"
```

### Expected Findings:
- Layout files: `app/[locale]/layout.tsx` ✓ (Phase 1)
- Page files: `app/[locale]/**/page.tsx`
- Nested dynamic routes: `app/**/[*]/page.tsx`, `app/**/[*]/layout.tsx`
- Components with params: Any component receiving params prop

---

## Phase 3: Fix Page Components (PRIORITY: HIGH)
**Duration: 15 minutes**

### Target Files:
- All `page.tsx` files in dynamic routes
- Files with both `params` and `searchParams`

### Transformation Pattern:
```tsx
// BEFORE:
export default async function Page({
  params: { param1, param2 },
  searchParams
}: {
  params: { param1: string; param2: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}) {

// AFTER:
export default async function Page({
  params,
  searchParams
}: {
  params: Promise<{ param1: string; param2: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { param1, param2 } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
```

---

## Phase 4: Fix Nested Layouts (PRIORITY: MEDIUM)
**Duration: 10 minutes**

### Target Files:
- `app/**/[*]/layout.tsx`
- `app/**/**/[*]/layout.tsx`

### Approach:
1. Apply same transformation as Phase 1
2. Handle multi-level param destructuring
3. Ensure parent-child layout compatibility

---

## Phase 5: Fix Components with Params (PRIORITY: LOW)
**Duration: 10 minutes**

### Target Files:
- Any remaining components that receive params
- Components that forward params to children

### Special Considerations:
- Components may receive already-resolved params
- Check if params are coming from parent that already awaited them

---

## Error Prevention Strategies

### Pre-Fix Validation:
1. **Backup Current State**: Commit current changes before starting
2. **Run Tests**: Ensure current test suite passes
3. **Build Check**: Run `npm run build` to establish baseline

### During Fix Validation:
1. **TypeScript Check**: Run `npm run typecheck` after each file
2. **Build Check**: Run `npm run build` after each phase
3. **Runtime Test**: Test with `npm run dev` and navigate to dynamic routes

### Post-Fix Validation:
1. **Full Test Suite**: Run `npm run test`
2. **Build Production**: Run `npm run build`
3. **Manual Testing**: Test all dynamic route combinations

---

## Batch Operation Commands

### Search for Affected Files:
```bash
# Find all params destructuring patterns
rg "params:\s*{" --type tsx --type ts -A 3 -B 1

# Find all dynamic route directories
find app -name "\[*\]" -type d

# Find all TypeScript files in dynamic routes
find app -path "*/\[*\]/*" -name "*.tsx" -o -name "*.ts"
```

### Automated Transformation Script:
```bash
# Create regex replacement for common patterns
sed -i 's/params: { \([^}]*\) }/params/g' target-files.txt
sed -i 's/params: { \([^}]*\) };/params: Promise<{ \1 }>;/g' target-files.txt
```

---

## Testing Strategy

### Unit Tests:
- Test locale detection and routing
- Test param parsing and validation
- Test generateStaticParams functionality

### Integration Tests:
- Test nested dynamic routes
- Test searchParams handling
- Test layout-page interaction

### Manual Testing:
- Navigate to `/en/dashboard`
- Navigate to `/es/profile`
- Test with invalid locales
- Test with query parameters

---

## Rollback Plan

### If Issues Arise:
1. **Immediate Rollback**: `git checkout HEAD~1`
2. **Selective Rollback**: `git checkout HEAD~1 -- app/[locale]/layout.tsx`
3. **Cherry-pick Good Changes**: Keep working fixes, rollback problematic ones

### Safe Progression:
- Fix one file at a time in Phase 1
- Test after each file
- Only proceed to next phase if current phase is stable

---

## Success Metrics

### Technical Metrics:
- ✅ No TypeScript errors
- ✅ Build completes without warnings
- ✅ All tests pass
- ✅ No runtime errors in browser console

### Functional Metrics:
- ✅ All locale routes work correctly
- ✅ Nested dynamic routes function properly
- ✅ Search parameters are parsed correctly
- ✅ Static generation works for all locales

### Performance Metrics:
- ✅ Build time doesn't increase significantly
- ✅ Runtime performance remains stable
- ✅ No additional re-renders or async waterfalls