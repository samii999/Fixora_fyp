# Organization Categories Feature - Complete Guide

## Overview

Implemented comprehensive organization category management with AI classification validation. This ensures users can only submit reports to organizations that handle the specific problem type detected by the AI model.

---

## 🎯 Features Implemented

### 1. **Admin Can Create Only ONE Organization** ✅
- Admins can create only one organization
- System checks if admin already has an organization before allowing creation
- Alert shown if admin tries to create a second organization

### 2. **Category Selection During Organization Creation** ✅
- Admins select problem categories when creating organization
- Uses AI classification categories (8 types)
- Can leave empty to accept ALL problem types
- Visual feedback shows selected categories

### 3. **Organization Settings Screen** ✅
- Dedicated screen for managing organization categories
- Can update categories anytime after creation
- Quick actions: Select All, Clear All
- Shows count of selected categories
- Save button only enabled when changes are made

### 4. **Category Filtering in HomeScreen** ✅
- Users can filter organizations by problem category
- Updated to use AI classification categories
- Shows organization's accepted categories
- Organizations without specific categories show "Accepts all categories"

### 5. **AI Category Validation in ReportForm** ✅
- Validates if AI-classified problem matches organization's categories
- Blocks submission if mismatch detected
- Provides clear error message with options:
  - Change organization
  - Re-upload images
- If organization accepts all categories, validation passes

---

## 📊 Problem Categories (AI Classification)

1. **Broken Street Light** (`broken_street_light`)
2. **Electric Issue** (`electric_issue`)
3. **Garbage Overflow** (`garbage_overflow`)
4. **Gas Problem** (`gas_problem`)
5. **Open Manhole** (`open_manhole`)
6. **Potholes** (`potholes`)
7. **Traffic Lights** (`traffic_lights`)
8. **Water Leakage** (`water_leakage`)

---

## 🔄 User Flow Examples

### Example 1: Successful Submission
```
1. User selects "Garbage Department" organization
   - Org handles: garbage_overflow, water_leakage
   
2. User uploads images of overflowing garbage bin
   - AI classifies: garbage_overflow (92% confidence)
   
3. Validation: ✅ PASS
   - garbage_overflow is in organization's categories
   
4. Report submitted successfully
```

### Example 2: Category Mismatch - Blocked
```
1. User selects "Road Maintenance Dept" organization
   - Org handles: potholes, traffic_lights
   
2. User uploads images of garbage overflow
   - AI classifies: garbage_overflow (88% confidence)
   
3. Validation: ❌ FAIL
   - garbage_overflow NOT in organization's categories
   
4. Alert shown:
   "⚠️ Category Mismatch
   Your images show 'Garbage Overflow' but you selected 
   an organization that handles: Potholes, Traffic Lights
   
   Please either:
   • Change Organization, OR
   • Upload images matching the organization's categories"
   
5. Report submission blocked
```

### Example 3: Organization Accepts All Categories
```
1. User selects "City Municipal Corporation"
   - Org categories: [] (empty = accepts all)
   
2. User uploads ANY problem type
   - AI classifies: any category
   
3. Validation: ✅ PASS
   - Organization accepts all problem types
   
4. Report submitted successfully
```

---

## 📁 Files Modified

### 1. **CreateOrganizationScreen.jsx**
**Changes:**
- Added category selection UI with checkboxes
- Uses `API_CONFIG.IMAGE_CATEGORIES` for options
- Shows selected count and info messages
- Saves selected categories to `organizationData.categories`

**Key Code:**
```javascript
const [selectedCategories, setSelectedCategories] = useState([]);

// In organizationData:
categories: selectedCategories, // Empty array = accepts all
```

### 2. **OrganizationSettingsScreen.jsx** (NEW FILE)
**Features:**
- Manage organization categories after creation
- Quick actions: Select All, Clear All
- Visual status indicators
- Save changes with confirmation
- Only shows "Save" when changes are made

**Access:** Admin Settings → Organization Categories

### 3. **HomeScreen.jsx**
**Changes:**
- Updated category filter to use AI categories
- Shows formatted category names
- Filters organizations by selected category
- Displays organization's accepted categories

**Before:**
```javascript
['Electricity issue', 'garbage overflow', 'Road potholes', ...]
```

**After:**
```javascript
API_CONFIG.IMAGE_CATEGORIES.map(cat => formatCategoryName(cat))
// ['Broken Street Light', 'Electric Issue', 'Garbage Overflow', ...]
```

### 4. **ReportForm.js**
**Changes:**
- Added validation before submission
- Checks if AI category matches org categories
- Shows detailed error with organization's categories
- Provides actionable options on mismatch

**Validation Logic:**
```javascript
if (selectedOrganizationId) {
  const orgCategories = orgData.categories || [];
  
  if (orgCategories.length > 0) {
    const aiCategory = classificationResult.category;
    
    if (!orgCategories.includes(aiCategory)) {
      // BLOCK SUBMISSION
      Alert.alert('Category Mismatch', ...);
      return;
    }
  }
  // If orgCategories is empty, accepts all - validation passes
}
```

### 5. **AdminSettingsScreen.jsx**
**Changes:**
- Added navigation card to Organization Settings
- Modern card-based UI
- Shows description of settings option

### 6. **AppNavigator.js**
**Changes:**
- Imported `OrganizationSettingsScreen`
- Added route: `OrganizationSettings`
- Available to admin role

### 7. **apiConfig.js** (Already had this)
- Contains `IMAGE_CATEGORIES` array
- `formatCategoryName()` helper function

---

## 🗄️ Database Schema

### Organizations Collection
```javascript
{
  id: "org_abc123",
  name: "City Road Maintenance",
  type: "Municipality",
  adminIds: ["admin_uid"],
  staffIds: [],
  
  // NEW: Categories field
  categories: [
    "potholes",
    "traffic_lights"
  ], // Empty array = accepts all categories
  
  geo: { lat: 31.5204, lng: 74.3587 },
  address: "123 Main St, Lahore",
  createdAt: Timestamp,
  updatedAt: Timestamp, // Added when categories updated
}
```

**Categories Field:**
- **Array of strings** (slug format)
- **Empty array `[]`** = accepts ALL problem types
- **Non-empty array** = only accepts listed categories
- Uses slug format: `potholes`, `garbage_overflow`, etc.

---

## 🎨 UI Components

### CreateOrganizationScreen - Category Selection
```
Problem Categories
Select which problem types your organization handles

[✓ Broken Street Light]  [Electric Issue]  [✓ Garbage Overflow]
[Gas Problem]  [Open Manhole]  [✓ Potholes]
[Traffic Lights]  [Water Leakage]

✓ Selected 3 categories
```

### OrganizationSettings - Management Screen
```
Organization Settings
Road Maintenance Department

Problem Categories                    [Select All] [Clear All]
Select which problem types your organization handles

[✓ Broken Street Light]  [✓ Potholes]  [✓ Traffic Lights]
[Electric Issue]  [Garbage Overflow]  [Gas Problem]
[Open Manhole]  [Water Leakage]

✓ 3 categories selected

[Save Changes]
```

### HomeScreen - Category Filter
```
Problem Category

[All] [Broken Street Light] [Electric Issue] [Garbage Overflow]
[Gas Problem] [Open Manhole] [Potholes] [Traffic Lights]
[Water Leakage]

Organizations

┌─────────────────────────────────────┐
│ 🏢 Road Maintenance Dept            │
│ Municipality                        │
│ 📍 123 Main St, Lahore              │
│ Categories: Potholes, Traffic Lights│
│                                   > │
└─────────────────────────────────────┘
```

### ReportForm - Validation Error
```
⚠️ Category Mismatch

Your images show "Garbage Overflow" but you selected
an organization that handles:

Potholes, Traffic Lights

Please either:
• Change Organization, OR
• Upload images matching the organization's categories

[Change Organization]  [Re-upload Images]
```

---

## 🧪 Testing Scenarios

### Test 1: Create Organization with Categories
1. Admin creates new organization
2. Selects 2-3 categories
3. Saves organization
4. Verify categories saved in database

### Test 2: Create Organization Without Categories
1. Admin creates new organization
2. Leaves categories empty
3. Saves organization
4. Verify `categories: []` in database
5. Organization should accept all problem types

### Test 3: Update Organization Categories
1. Admin navigates to Settings → Organization Categories
2. Changes selected categories
3. Clicks "Save Changes"
4. Verify database updated
5. Verify users see updated categories

### Test 4: Filter Organizations by Category
1. User opens HomeScreen
2. Selects category filter (e.g., "Potholes")
3. Verify only orgs with potholes (or accepts all) shown
4. Select "All" filter
5. Verify all organizations shown

### Test 5: Valid Submission (Matching Category)
1. User selects organization (handles "potholes")
2. Uploads images of potholes
3. AI classifies as "potholes" (85% confidence)
4. Submit report
5. Verify submission successful

### Test 6: Blocked Submission (Category Mismatch)
1. User selects organization (handles "potholes")
2. Uploads images of garbage
3. AI classifies as "garbage_overflow" (90% confidence)
4. Try to submit report
5. Verify error alert shown
6. Verify submission blocked

### Test 7: Valid Submission (Organization Accepts All)
1. User selects organization (categories: [])
2. Uploads images of ANY problem type
3. AI classifies as any category
4. Submit report
5. Verify submission successful

### Test 8: Admin Cannot Create Multiple Organizations
1. Admin already has one organization
2. Navigates to Create Organization
3. Fills form and submits
4. Verify alert: "You can only create one organization"
5. Verify creation blocked

---

## 🔍 Validation Rules Summary

| Scenario | Organization Categories | AI Classification | Result |
|----------|------------------------|-------------------|--------|
| Match | `["potholes"]` | `potholes` | ✅ PASS |
| Mismatch | `["potholes"]` | `garbage_overflow` | ❌ FAIL |
| Accepts All | `[]` (empty) | ANY category | ✅ PASS |
| Multiple Categories | `["potholes", "traffic_lights"]` | `potholes` | ✅ PASS |
| Multiple Categories | `["potholes", "traffic_lights"]` | `garbage_overflow` | ❌ FAIL |

---

## 📝 Key Constraints

1. ✅ **One Organization Per Admin**
   - Enforced during creation
   - Check: `userDoc.data()?.organizationId`

2. ✅ **Categories Must Match AI Classification**
   - Validated before submission
   - Empty categories array = accepts all

3. ✅ **AI Confidence Must Be ≥ 80%**
   - Already implemented in image classification
   - Category validation happens AFTER confidence check

4. ✅ **Multiple Images Must Be Same Problem**
   - Already implemented in image classification
   - Category validation happens AFTER consistency check

---

## 🚀 How to Use

### For Admins:

**Creating Organization:**
1. Go to Create Organization screen
2. Fill organization details
3. **Select problem categories** (or leave empty for all)
4. Set location and submit
5. Organization created with selected categories

**Updating Categories:**
1. Navigate to Settings tab
2. Tap "Organization Categories"
3. Select/deselect categories
4. Tap "Save Changes"
5. Categories updated

### For Users:

**Submitting Report:**
1. Select organization from list
2. Upload images (AI will classify)
3. If category matches org → Submit allowed ✅
4. If category doesn't match → Error shown ❌
5. Either change organization or upload correct images

**Filtering Organizations:**
1. Open Home screen
2. Select problem category filter
3. Only relevant organizations shown
4. Select "All" to see all organizations

---

## 🎯 Benefits

1. **Better Organization**: Organizations only get reports they can handle
2. **User Guidance**: Users directed to correct organization
3. **Quality Control**: Prevents misrouted reports
4. **AI Integration**: Leverages AI classification for validation
5. **Flexibility**: Organizations can choose to accept all or specific types
6. **Transparency**: Users see which categories each org handles

---

## 🔧 Troubleshooting

### Issue: Validation Not Working
**Check:**
- Organization has categories set (check database)
- AI classification working (check console logs)
- `classificationResult.category` matches format (slug, not display)

### Issue: Organization Not Showing in Filter
**Check:**
- Organization categories include selected filter
- OR organization has empty categories array
- Organization has admin assigned

### Issue: Can't Update Categories
**Check:**
- User is admin of the organization
- `organizationId` field exists in user document
- Organization document exists in database

---

## 📚 Related Features

- **AI Image Classification**: `docs/IMAGE_CLASSIFICATION_SETUP.md`
- **Urgency Prediction**: `src/services/predictionService.js`
- **Organization Service**: `src/services/organizationService.js`

---

## ✅ Completion Status

All requested features implemented:

- ✅ Admin can create only ONE organization
- ✅ Category selection during organization creation
- ✅ Organization settings to update categories
- ✅ Category filter in HomeScreen (with AI categories)
- ✅ AI category validation in ReportForm
- ✅ Clear error messages on mismatch
- ✅ Options to change organization or re-upload images
- ✅ Empty categories = accepts all types

---

**Status**: 🎉 **COMPLETE AND READY TO USE!**
