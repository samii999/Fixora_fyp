# Proof Upload Feature

## Overview
Staff members can upload proof of completed work with images and descriptions. Admin reviews the proof and marks the task as resolved.

## Complete Workflow

### 1. Staff Completes Work
**When staff finishes a task:**
1. Open the assigned report
2. Task must be in "In Progress" or "Assigned" status
3. Click "Upload Proof" button (green button in reports list or in detail screen)

### 2. Upload Proof Process
**Staff uploads proof:**
1. Enter description of work completed
2. Add 1-5 proof images showing completed work
3. Click "Upload Proof of Work"
4. Status changes to `staff_proved`
5. Admin gets notified

### 3. Admin Review
**Admin reviews proof:**
1. Open Admin Reports screen
2. Click "Staff-Proved Reports" filter tab
3. View proof images and descriptions
4. See which staff member uploaded proof
5. Click "Mark as Resolved" if satisfied
6. Status changes to `resolved`

## Data Structure

### Proof Object
```javascript
{
  imageUrl: "https://...",
  description: "Fixed the broken pipe and tested water flow",
  uploadedAt: "2025-11-03T18:30:00.000Z",
  uploadedBy: "staff_uid_123",
  uploadedByName: "John Doe"
}
```

### Report Document
```javascript
{
  ...otherFields,
  proofImages: [
    // Array of proof objects
  ],
  status: "staff_proved" // or "resolved"
}
```

## Features

### For Staff
✅ **Easy Access**: Upload button appears on in-progress tasks
✅ **Multi-Image**: Upload up to 5 images per proof
✅ **Description**: Add text description of work done
✅ **Team Visibility**: All assigned staff can see proof
✅ **Status Badge**: "✓ Proof Uploaded" badge shows when uploaded

### For Admin
✅ **Filter Tab**: Dedicated "Staff-Proved Reports" filter
✅ **Staff Attribution**: See which staff member uploaded proof
✅ **Timestamp**: See when proof was uploaded
✅ **Multiple Proofs**: View all proof submissions for a task
✅ **Safety Check**: Cannot mark as resolved without proof

## UI Elements

### Staff Reports Screen
```
┌─────────────────────────────────┐
│ Fix Broken Pipe        [In Progress]│
├─────────────────────────────────┤
│ Urgent repair needed...         │
│                                 │
│ Team Members:                   │
│ [John] [Jane]                   │
│                                 │
│ [Upload Proof]                  │
└─────────────────────────────────┘
```

### After Upload
```
┌─────────────────────────────────┐
│ Fix Broken Pipe    [Staff Proved]│
├─────────────────────────────────┤
│ Urgent repair needed...         │
│                                 │
│ [✓ Proof Uploaded]              │
└─────────────────────────────────┘
```

### Issue Detail - Proof Display
```
🛠️ Proof of Work (2)

┌─────────────────────────────────┐
│ [Proof Image]                   │
│ 👤 Uploaded by: John Doe        │
│ Fixed the pipe connection and   │
│ tested for leaks                │
│ 📅 11/3/2025, 6:30:00 PM        │
└─────────────────────────────────┘
```

## Status Flow

```
pending → assigned → in_progress → staff_proved → resolved
                                         ↑
                                    Staff uploads
                                    proof here
```

## Validation Rules

### Staff Cannot Upload If:
- ❌ Not assigned to the task
- ❌ Task status is not "in_progress" or "assigned"
- ❌ Task is already resolved

### Admin Cannot Resolve If:
- ❌ No proof images uploaded
- ❌ proofImages array is empty

### Upload Requirements:
- ✅ At least 1 image required
- ✅ Description text required
- ✅ Must be assigned staff member

## Multi-Staff Support

### Multiple Staff Can:
- All assigned staff can upload proof
- Each upload is tracked separately
- Admin sees all proofs from all team members
- Each proof shows uploader name

### Example:
```
Task assigned to: John, Jane, Mike

John uploads proof → 1 proof image
Jane uploads proof → 2 proof images
Total: 3 proof images

Admin sees all 3 with names:
- "Uploaded by: John Doe"
- "Uploaded by: Jane Smith"
- "Uploaded by: Mike Johnson"
```

## Code Changes Made

### 1. IssueDetailScreen.jsx
- ✅ Updated `canUploadProof` check for multi-staff assignments
- ✅ Added staff name to proof uploads
- ✅ Enhanced proof display with uploader name and timestamp
- ✅ Allow upload for both "assigned" and "in_progress" status

### 2. StaffReportsScreen.jsx
- ✅ Added "Upload Proof" button for in-progress tasks
- ✅ Added "✓ Proof Uploaded" badge when proof exists
- ✅ Auto-refresh when returning to screen

### 3. AdminReportsScreen.jsx
- ✅ Already has "Staff-Proved Reports" filter
- ✅ Already prevents resolution without proof
- ✅ Works with multi-staff assignments

## Testing Checklist

### Staff Upload Test
- [ ] Staff can see upload button on assigned task
- [ ] Can add description and images
- [ ] Upload succeeds and shows success message
- [ ] Status changes to "staff_proved"
- [ ] Badge shows "✓ Proof Uploaded"

### Admin Review Test
- [ ] Admin sees task in "Staff-Proved Reports" tab
- [ ] Can view all proof images
- [ ] Sees staff member name who uploaded
- [ ] Can mark as resolved after viewing proof
- [ ] Cannot resolve tasks without proof

### Multi-Staff Test
- [ ] All assigned staff can upload proof
- [ ] Each proof shows correct uploader name
- [ ] Admin sees all proofs from team
