# 🎯 FIXORA EVALUATION - PART 1: PROJECT OVERVIEW

**Developer**: Muhammad Usman (SP22-BCS-036)  
**Project**: FIXORA - Municipal Issue Reporting System  
**Tech Stack**: React Native + Firebase + Supabase + AI

---

## 📱 PROJECT OVERVIEW

### What is FIXORA?
Mobile app for citizens to report municipal issues (roads, garbage, water, electricity) and organizations to manage them efficiently through staff teams.

### Problem Solved
- ❌ No unified reporting system
- ❌ Citizens don't know which org to contact  
- ❌ No tracking/accountability
- ❌ Duplicate reports waste resources

### Key Features
1. ✅ AI Image Classification (auto-detect issue type)
2. ✅ Duplicate Detection (GPS-based, 100m radius)
3. ✅ Real-Time Notifications (instant updates)
4. ✅ Team Management (assign work to teams)
5. ✅ Staff Workflow (pending → active approval)
6. ✅ Feedback System (user ratings)
7. ✅ Location Tracking (GPS + Maps)
8. ✅ Proof of Work (before/after photos)
9. ✅ Urgency Sorting (High/Medium/Low)
10. ✅ Real-Time Sync (Firestore listeners)

### Technology Stack
- **Frontend**: React Native (Expo), React Navigation, React Native Maps
- **Backend**: Firebase Auth, Firestore, Supabase Storage
- **AI**: Hugging Face (Vision Transformer model)
- **Notifications**: Expo Notifications
- **Location**: Expo Location, GPS tracking

### Three User Roles
1. **Citizens**: Submit reports with photos/location
2. **Admins**: Manage org, approve staff, assign work
3. **Staff**: Receive assignments, update status, upload proof

---

## 🗄️ DATABASE STRUCTURE

### Collections in Firestore:

**1. users**
```
- uid, email, name, role (user/admin/staff)
- organizationId (for admin/staff)
- status (pending/active for staff)
- teamId, teamName (for staff in teams)
- pushToken, notificationsEnabled
```

**2. organizations**
```
- name, logo, adminIds[], staffIds[]
- createdBy, createdAt
```

**3. reports**
```
- reportId, uid (reporter), category, description
- imageUrl (from Supabase), location {lat, lon, address}
- organizationId, status (pending/assigned/in_progress/needs_review/resolved)
- urgency (High/Medium/Low)
- assignedStaffIds[], assignmentType (individual/team)
- isDuplicate, originalReportId, duplicateCount
- userRating, userFeedback
```

**4. teams**
```
- name, description, organizationId
- members[] {uid, name, email, addedAt}
- isAvailable, currentAssignments[]
- createdBy, createdAt
```

**5. staff_requests**
```
- uid, organizationId, status (pending/approved/rejected)
- approvedBy, approvedAt
```

**6. feedback_requests**
```
- reportId, userId, status (pending/completed)
- rating (1-5), comment
- createdAt, submittedAt
```

**Supabase Storage:**
- Bucket: "reports"
- Stores: Report images, proof photos
- Returns: Public CDN URLs

---

## 🔄 COMPLETE REPORT LIFECYCLE

### User Journey (End-to-End):

**1. Report Submission (Citizen)**
- Open app → "Report Issue"
- Take photo (camera/gallery)
- AI detects category (e.g., "Road Damage")
- Auto-suggests organization (e.g., "CDA")
- Add description, confirm GPS location
- System checks duplicates within 100m
- If duplicate → Alert shown, user confirms anyway
- Report stored in Firestore + Image in Supabase

**2. Admin Notification**
- Push notification: "New report submitted"
- Admin dashboard updates in real-time
- Report appears with urgency badge (Red/Yellow/Green)

**3. Admin Assignment**
- Reviews report details, location on map
- Checks duplicate badge ("+2 duplicates")
- Clicks "Assign Staff"
- Chooses: Individual staff OR Team
- Sees busy status warnings
- Adds optional admin notes
- Confirms assignment

**4. Staff Notification & Work**
- Push notification: "New Assignment"
- Badge appears on Reports tab (e.g., "3")
- Opens report, clicks "Start Work"
- Status: assigned → in_progress
- User notified: "Staff started working"
- Completes work, uploads proof photos
- Clicks "Submit for Review"
- Status: in_progress → needs_review

**5. Admin Verification**
- Notification: "Proof uploaded"
- Reviews before/after photos
- If OK: Marks "Resolved"
- Creates feedback request for user

**6. User Feedback**
- Notification: "Report resolved! Rate us"
- Gives 1-5 stars + comment
- Feedback stored with report

**7. Analytics Update**
- Org dashboard shows avg rating
- Response time calculated
- Performance metrics updated

**Timeline**: Urgent issues resolved same day

---

## 🎨 USER INTERFACE STRUCTURE

### Navigation Structure:

**Citizens (MainTabNavigator)**
- 🏠 Home (recent reports map)
- 📝 Report Issue (submit new)
- 📋 My Reports (track status)
- 👤 Profile (settings)

**Admin (AdminTabNavigator)**
- 📊 Dashboard (stats overview)
- 📄 Reports (all org reports)
- 👥 Manage Staff (approve requests, create teams)
- ✅ Staff-Proved (review proof of work)
- 👤 Profile (org settings)

**Staff (StaffTabNavigator)**
- 🏠 Home (stats, quick actions)
- 📋 Status (approval status)
- 📄 Reports (assigned work) - *with badge counter*
- 👤 Profile (account settings)

---

This covers the overview. **Continue to PART 2 for detailed system logics →**
