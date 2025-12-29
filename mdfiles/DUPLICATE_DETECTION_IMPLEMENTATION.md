# Duplicate Report Detection Implementation

## Overview
Implemented an intelligent duplicate detection system that identifies reports at the same location or within a reasonable distance (100 meters), automatically links them together, and treats them as one unified issue to help prioritize high-impact problems.

## Key Features
- ✅ **Automatic Detection**: Detects duplicates within 100m radius
- ✅ **Smart Matching**: Only matches same category and organization
- ✅ **User Confirmation**: Shows dialog when duplicate detected
- ✅ **Automatic Linking**: Links duplicates to original report
- ✅ **Visual Indicators**: Badges show duplicate count in admin UI
- ✅ **Priority Boosting**: Multiple reports = higher priority
- ✅ **Distance Calculation**: Uses Haversine formula for accuracy

## Implementation Details

### 1. Duplicate Detection Service
**File:** `src/services/duplicateDetectionService.js`

**Functions:**
- `calculateDistance()` - Haversine formula for GPS distance
- `checkForDuplicates()` - Find nearby matching reports
- `linkDuplicateReports()` - Create bidirectional link
- `getRelatedReports()` - Get all linked reports
- `getDuplicateStats()` - Get duplicate statistics
- `mergeReportImages()` - Combine images from duplicates

### 2. Detection Parameters
- **Radius**: 100 meters
- **Category Match**: Required
- **Organization Match**: Required
- **Status Filter**: pending, assigned, in_progress only
- **Distance Display**: "same location" if <10m

### 3. Database Schema

**Duplicate Report Fields:**
```javascript
isDuplicate: true
originalReportId: "report_abc123"
duplicateDistance: 45.2  // meters
linkedAt: Date
```

**Original Report Fields:**
```javascript
duplicateCount: 3
duplicateReports: [
  { reportId: "dup1", distance: 25, linkedAt: Date },
  { reportId: "dup2", distance: 50, linkedAt: Date },
  { reportId: "dup3", distance: 15, linkedAt: Date }
]
lastDuplicateAt: Date
```

### 4. User Flow

**Report Submission with Duplicate:**
1. User completes report form
2. Validation passes
3. **Duplicate check runs**
4. If match found:
   - Alert shows:
     - Distance to original
     - Original report preview
     - Original status
   - User chooses:
     - Cancel submission
     - Submit and link as duplicate
5. Report created with link
6. Original report updated with +1 duplicate

### 5. Admin Interface

**Original Report Badge:**
- Orange background
- Shows: "🔁 +X duplicate(s)"
- Example: "🔁 +3 duplicates"

**Duplicate Report Badge:**
- Gray background
- Shows: "🔗 Duplicate"
- Indicates linked report

### 6. Benefits

**For Citizens:**
- No duplicate rejection - reports still accepted
- Awareness that issue is already reported
- Contribution helps prioritize the problem

**For Admins:**
- See high-impact issues with multiple reports
- Understand severity based on duplicate count
- Manage related reports as single issue
- Better resource allocation

**For Organizations:**
- Avoid duplicate work assignments
- Prioritize issues with most reports
- Track problem hotspots

## Technical Implementation

### Distance Calculation (Haversine)
```javascript
const R = 6371000; // Earth radius in meters
const φ1 = lat1 * Math.PI / 180;
const φ2 = lat2 * Math.PI / 180;
const Δφ = (lat2 - lat1) * Math.PI / 180;
const Δλ = (lon2 - lon1) * Math.PI / 180;

const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

distance = R * c; // meters
```

### Query Optimization
- Filter by status first (reduces dataset)
- Filter by organization (multi-tenant)
- Filter by category (accuracy)
- Calculate distance only for filtered results
- Return closest match within radius

## Files Modified
1. `src/services/duplicateDetectionService.js` - NEW
2. `src/components/form/ReportForm.js` - Integrated detection
3. `src/screens/Admin/AdminReportsScreen.jsx` - Added badges
4. `src/screens/Main/IssueDetailScreen.jsx` - Added duplicate display

## Configuration

**Adjustable Parameters:**
```javascript
// In ReportForm.js handleSubmit
const duplicateCheck = await checkForDuplicates(
  location.latitude,
  location.longitude,
  classificationResult.category,
  100,  // ← Radius in meters (adjustable)
  selectedOrganizationId
);
```

**To change detection radius:**
- Edit line 375 in `src/components/form/ReportForm.js`
- Change `100` to desired meters
- Recommended range: 50-200 meters

## Testing Scenarios

1. **Same Location Reports**
   - Submit report at Location A
   - Submit another at same location
   - Should detect as duplicate (<10m)

2. **Nearby Reports**
   - Submit report at Location A
   - Submit another 50m away (same category)
   - Should detect as duplicate

3. **Different Category**
   - Submit pothole report at Location A
   - Submit garbage report at same location
   - Should NOT detect as duplicate

4. **Outside Radius**
   - Submit report at Location A
   - Submit another 150m away
   - Should NOT detect as duplicate

5. **Different Organization**
   - Submit to Organization A
   - Submit to Organization B (same location)
   - Should NOT detect as duplicate

## Future Enhancements

- [ ] Admin merge duplicate reports manually
- [ ] Auto-merge images from duplicates to original
- [ ] Show duplicate reports on map view
- [ ] Duplicate notification to original reporter
- [ ] Severity increase based on duplicate count
- [ ] Duplicate report clustering analytics
- [ ] Time-based duplicate detection (same issue recurring)
- [ ] AI-based description similarity matching
- [ ] Duplicate report contribution points

## Edge Cases Handled

1. **No duplicates**: Normal submission flow
2. **User cancels**: Report not created
3. **Multiple duplicates**: Links to closest one
4. **Original resolved**: Still accepts duplicates
5. **Duplicate of duplicate**: Links to original
6. **Permission errors**: Graceful fallback
7. **Network errors**: Shows error message

## Success Metrics

- Duplicate detection rate
- User acceptance rate (Submit Anyway %)
- Average distance of duplicates
- Reports with multiple duplicates
- Admin time saved on duplicate management
