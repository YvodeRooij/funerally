# 🎭 Demo Mode Setup - Real Components with Mock Data

## ✅ What's Implemented

**Real Components with Demo Data Injection:**
- ✅ **IntakeWizard** - Real component, demo mode bypasses auth & database
- ✅ **FamilyDashboard** - Real component, shows demo report data when no auth
- ✅ **DirectorReportAccess** - Real component, accepts demo codes
- ✅ **AI Chat Assistant** - Real component, works in demo mode

**Demo APIs:**
- ✅ `/api/demo/generate-report` - Demo report generation
- ✅ `/api/demo/director-access` - Demo director access validation

## 🚀 Test Without Auth (Demo Mode)

### 1. **Demo Family Journey**
```
Visit: /demo/start
1. Complete intake form (real UI, demo data)
2. Chat with AI assistant (real functionality) 
3. Generate report (demo API)
4. View dashboard (real component with demo data)
5. Copy access code: DEMO-123
```

### 2. **Demo Director Access**  
```
Visit: /demo/director-access
1. Enter code: DEMO-123, TEST-456, or SAMPLE-789
2. View professional report (real UI, demo data)
3. See all report sections and recommendations
```

### 3. **Demo Features**
- ✅ **Real UI** - All components are production components
- ✅ **Real Functionality** - AI chat, form validation, etc.
- ✅ **Demo Data** - Mock reports and access codes
- ✅ **Comments** - Code shows where to replace demo with real data

## 🔧 Demo Mode Detection

**How it works:**
```typescript
// In real components, demo mode is detected automatically
if (isDemoMode() && !session?.user?.id) {
  // Use demo data instead of database
  console.log('🎭 Demo: Loading demo data')
  setData(getDemoReportData())
} else {
  // Use real database queries
  const data = await supabase.from('table').select('*')
}
```

**Where Demo Data is Injected:**
- ✅ `FamilyDashboard` - Shows demo report when no auth
- ✅ `DirectorReportAccess` - Accepts demo access codes  
- ✅ `IntakeWizard` - Uses demo session when no auth
- ✅ APIs - Demo endpoints for report generation

## 📂 File Structure

**Real Components (Modified for Demo):**
- `/components/family/family-dashboard.tsx` - Added demo data injection
- `/components/director/director-report-access.tsx` - Added demo code support
- `/components/family/intake/intake-wizard.tsx` - Added demo session support

**Demo Routes (Using Real Components):**
- `/demo/start` - Uses real IntakeWizard
- `/demo/family-dashboard` - Uses real FamilyDashboard  
- `/demo/director-access` - Uses real DirectorReportAccess

**Demo Infrastructure:**
- `/lib/demo-mode.ts` - Demo configuration and mock data
- `/api/demo/generate-report/route.ts` - Demo report API
- `/api/demo/director-access/route.ts` - Demo access API

## 💾 Database Setup (Optional)

**Quick Setup:**
```bash
# Copy SQL to Supabase Dashboard > SQL Editor
node scripts/create-demo-tables.js

# Or manually run the SQL shown in the script output
```

**Creates:**
- `venues` table with Amsterdam/Utrecht venues
- `funeral_services` table with burial/cremation options
- Demo data for AI recommendations

## 🧪 Testing Workflow

**Complete Demo Flow:**
1. **Start**: `/demo/start`
2. **Fill Form**: Use real intake wizard
3. **AI Chat**: Test real AI assistant  
4. **Generate**: Creates demo report
5. **Dashboard**: `/demo/family-dashboard`
6. **Copy Code**: DEMO-123
7. **Director**: `/demo/director-access`
8. **Access**: Enter DEMO-123
9. **View Report**: Professional director view

## 🔄 Converting to Production

**To switch from demo to production:**

1. **Remove Demo Routes** - Delete `/demo/*` pages
2. **Enable Auth** - Set `DEMO_MODE.enabled = false`
3. **Database** - Run real migrations
4. **Comments** - Replace all `// TODO: Replace demo` sections

**Key Areas to Update:**
```typescript
// Replace this:
if (isDemoMode()) {
  return getDemoData()
}

// With this:
const { data } = await supabase.from('real_table').select('*')
return data
```

---

## 🎯 Ready to Test!

**Start here**: `/demo/start` 

The demo shows the **REAL product** with mock data - exactly what you wanted! 🚀