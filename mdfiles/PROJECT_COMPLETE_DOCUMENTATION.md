# FIXORA - Complete Project Documentation

**Project Name:** Fixora  
**Developer:** Muhammad Usman (SP22-BCS-036)  
**Project Type:** Final Year Project - Mobile Application  
**Version:** 1.0.0  
**Platform:** React Native (Expo)

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [System Architecture](#system-architecture)
4. [User Roles & Permissions](#user-roles--permissions)
5. [Core Features](#core-features)
6. [Database Structure](#database-structure)
7. [Authentication System](#authentication-system)
8. [Report Management System](#report-management-system)
9. [Organization Management](#organization-management)
10. [Staff Management](#staff-management)
11. [AI & Machine Learning Integration](#ai--machine-learning-integration)
12. [Proof Upload Feature](#proof-upload-feature)
13. [Urgency Prediction System](#urgency-prediction-system)
14. [Multi-Staff Assignment](#multi-staff-assignment)
15. [Geolocation & Mapping](#geolocation--mapping)
16. [Planned Features](#planned-features)
17. [Project Structure](#project-structure)
18. [Installation & Setup](#installation--setup)
19. [API Documentation](#api-documentation)
20. [Development Workflow](#development-workflow)

---

## 1. Project Overview

### 1.1 Purpose
Fixora is a comprehensive municipal issue management mobile application designed to streamline the process of reporting, tracking, and resolving civic infrastructure problems. The app connects citizens with municipal organizations through an intelligent system that categorizes, prioritizes, and assigns tasks to appropriate staff members.

### 1.2 Problem Statement
Municipal authorities face challenges in:
- Receiving and organizing citizen complaints
- Prioritizing urgent issues
- Efficient staff allocation
- Tracking resolution progress
- Maintaining accountability

### 1.3 Solution
Fixora provides:
- **Citizens:** Easy mobile interface to report issues with photos and location
- **Municipal Organizations:** Centralized dashboard to manage all reports
- **Admins:** Tools to create organizations, manage staff, assign tasks
- **Staff:** Interface to view assigned tasks and upload proof of completion
- **AI Integration:** Automatic urgency prediction for intelligent prioritization

### 1.4 Key Objectives
- Simplify municipal issue reporting process
- Automate issue categorization and urgency detection
- Enable efficient task assignment and tracking
- Improve accountability with proof-of-work system
- Provide real-time status updates to all stakeholders

---

## 2. Technology Stack

### 2.1 Frontend
- **Framework:** React Native 0.79.5
- **Runtime:** Expo SDK 53.0.20
- **UI Components:** React Native core components
- **Navigation:** React Navigation 7.x
  - Native Stack Navigator
  - Bottom Tab Navigator
- **State Management:** React Context API
- **Styling:** StyleSheet API (React Native)

### 2.2 Backend & Database
- **Authentication:** Firebase Authentication (Email/Password)
- **Database:** Firebase Firestore (NoSQL)
- **Storage:** Supabase Storage (Image hosting)
- **Real-time Updates:** Firestore real-time listeners

### 2.3 APIs & External Services
- **Geolocation:** Expo Location API
- **Reverse Geocoding:** OpenStreetMap Nominatim API
- **AI Predictions:** Custom ML model hosted on Google Colab via ngrok
- **Image Handling:** Expo Image Picker
- **Maps:** React Native Maps

### 2.4 Key Dependencies
```json
{
  "expo": "~53.0.20",
  "react": "19.0.0",
  "react-native": "^0.79.5",
  "firebase": "^12.0.0",
  "@supabase/supabase-js": "^2.52.1",
  "@react-navigation/native": "^7.1.16",
  "@react-navigation/native-stack": "^7.3.23",
  "@react-navigation/bottom-tabs": "^7.4.4",
  "expo-location": "~18.1.6",
  "expo-image-picker": "~16.1.4",
  "react-native-maps": "^1.20.1",
  "expo-notifications": "~0.31.4"
}
```

### 2.5 Development Tools
- **Package Manager:** npm
- **Version Control:** Git
- **Code Editor:** VS Code
- **Testing:** Manual testing on Android/iOS
- **Deployment:** Expo Application Services (EAS)

---

## 3. System Architecture

### 3.1 Application Architecture
```
┌─────────────────────────────────────────┐
│         React Native Frontend           │
│  (Expo - Cross-platform Mobile App)    │
└─────────────────┬───────────────────────┘
                  │
        ┌─────────┴──────────┐
        │                    │
┌───────▼────────┐  ┌────────▼──────────┐
│    Firebase    │  │     Supabase      │
│  (Auth + DB)   │  │   (Storage)       │
└───────┬────────┘  └────────┬──────────┘
        │                    │
        │          ┌─────────▼──────────┐
        │          │   ML Model (Colab) │
        │          │   via ngrok        │
        └──────────┴────────────────────┘
```

### 3.2 Data Flow
1. **User Registration/Login:** Firebase Authentication → Firestore user profile
2. **Report Submission:**
   - User input → AI prediction (ngrok) → Image upload (Supabase) → Firestore save
3. **Admin Assignment:**
   - Admin selection → Firestore update → Staff notification
4. **Staff Completion:**
   - Proof upload (Supabase) → Firestore status update → Admin review
5. **Resolution:**
   - Admin verification → Final status update → User notification

### 3.3 Navigation Structure
```
App Navigator (Stack)
│
├── Auth Stack (Unauthenticated)
│   ├── RoleSelectionScreen
│   ├── LoginScreen
│   ├── SignupScreen
│   └── PendingApprovalScreen
│
├── Main Tabs (User Role)
│   ├── HomeScreen
│   ├── ReportIssueScreen
│   ├── MyReportsScreen
│   └── ProfileScreen
│
├── Admin Tabs (Admin Role)
│   ├── DashboardScreen
│   ├── AdminReportsScreen
│   ├── ManageStaffScreen
│   ├── StaffProvedReportsScreen
│   └── ProfileScreen
│
└── Staff Tabs (Staff Role)
    ├── StaffHomeScreen
    ├── StaffReportsScreen
    ├── StatusScreen
    └── StaffProfileScreen
```

---

## 4. User Roles & Permissions

### 4.1 User (Citizen)
**Purpose:** Report municipal issues and track their resolution

**Permissions:**
- ✅ Create new issue reports
- ✅ Upload multiple images per report
- ✅ Add GPS location automatically
- ✅ View their own submitted reports
- ✅ Track report status (pending, assigned, in progress, resolved)
- ✅ View all reports in their area on home screen
- ✅ Update profile information
- ❌ Cannot assign tasks
- ❌ Cannot access admin/staff features

**Workflow:**
1. Sign up → Select "User" role
2. Submit reports with description, images, location
3. AI automatically predicts urgency level
4. Track report progress
5. Receive updates on resolution

### 4.2 Admin (Organization Manager)
**Purpose:** Manage municipal organization, staff, and resolve issues

**Permissions:**
- ✅ Create and manage organizations
- ✅ Approve/reject staff join requests
- ✅ Assign reports to single or multiple staff members
- ✅ View all reports for their organization
- ✅ Filter reports by status (pending, assigned, in progress, staff proved, resolved)
- ✅ Add notes when assigning tasks
- ✅ Review staff-uploaded proof
- ✅ Mark tasks as resolved after verification
- ✅ View analytics and statistics
- ✅ Manage staff permissions
- ✅ View staff-proved reports in dedicated tab
- ❌ Cannot submit new issue reports (organization-focused role)

**Workflow:**
1. Sign up → Select "Admin" role
2. Create organization (name, type, location, categories)
3. Review and approve staff requests
4. Manage incoming reports
5. Assign tasks to staff (single or multi-staff)
6. Review proof of work
7. Mark issues as resolved

### 4.3 Staff (Field Worker)
**Purpose:** Receive assigned tasks and resolve issues on ground

**Permissions:**
- ✅ Request to join an organization
- ✅ View organization details after approval
- ✅ See all assigned tasks
- ✅ Update task status (in progress)
- ✅ Upload proof of completed work (images + description)
- ✅ View task details and admin notes
- ✅ See other staff members assigned to same task
- ✅ Track their work history
- ❌ Cannot assign tasks to others
- ❌ Cannot approve own work
- ❌ Limited access while pending approval

**Status Levels:**
- **Pending:** Awaiting admin approval (limited app access)
- **Approved:** Full access to assigned reports
- **Removed:** Access revoked by admin

**Workflow:**
1. Sign up → Select "Staff" role
2. Request to join an organization
3. Wait for admin approval (pending status)
4. After approval: View assigned tasks
5. Accept and start working (in progress)
6. Complete task and upload proof
7. Admin reviews and marks as resolved

---

## 5. Core Features (Current Implementation)

### 5.1 Report Submission System
**Purpose:** Enable citizens to easily report municipal issues

**Features Implemented:**
- ✅ Multi-image upload (camera + gallery access)
- ✅ Automatic GPS location capture
- ✅ Interactive map with draggable marker
- ✅ Reverse geocoding (Nominatim API)
- ✅ Organization auto-selection based on location
- ✅ Description text input with validation
- ✅ AI urgency prediction integration
- ✅ Real-time image preview
- ✅ Form validation

**Technical Stack:**
- **Image Upload:** Expo Image Picker → Supabase Storage
- **Location:** Expo Location API
- **Maps:** React Native Maps
- **Geocoding:** OpenStreetMap Nominatim
- **AI:** Custom ML model via ngrok

### 5.2 AI Urgency Prediction System ✅ IMPLEMENTED
**Purpose:** Automatically classify issue urgency for prioritization

**How It Works:**
1. User enters issue description
2. Optional: Click "Get AI Prediction" for preview
3. AI model analyzes text and predicts urgency (High/Medium/Low)
4. Prediction displayed with confidence score
5. Report submitted with urgency metadata
6. All screens sort reports by urgency automatically

**Urgency Levels:**
- 🔴 **High:** Critical issues (pipe bursts, electrical hazards, emergencies)
- 🟠 **Medium:** Important but not critical (broken lights, potholes)
- 🟢 **Low:** Minor issues (graffiti, cosmetic damage)

**Fallback System:**
- If AI API fails → Keyword-based fallback prediction
- Keywords checked: "urgent", "emergency", "critical", "dangerous", etc.
- Ensures reports can always be submitted

**Implementation Details:**
- **Model:** Hosted on Google Colab
- **Access:** via ngrok tunnel
- **API Endpoint:** `POST /predict`
- **Request:** `{ "text": "description" }`
- **Response:** `{ "urgency": "High", "confidence": 0.95 }`
- **Config File:** `src/config/apiConfig.js`
- **Service:** `src/services/predictionService.js`

**Urgency Display:**
- Colored badges on all report cards
- Sorting: High → Medium → Low → Newest first
- Visible to User, Admin, and Staff roles

### 5.3 Multi-Staff Assignment ✅ IMPLEMENTED
**Purpose:** Allow admins to assign complex tasks to multiple staff members

**Features:**
- ✅ Checkbox-based staff selection interface
- ✅ Assign 1 to N staff members to single task
- ✅ Display all assigned staff on report cards
- ✅ All assigned staff can view the task
- ✅ Any assigned staff can upload proof
- ✅ Admin sees which staff uploaded what proof

**Use Cases:**
- Large infrastructure repairs requiring multiple specialists
- Emergency situations needing faster response
- Training scenarios (experienced + new staff)
- Complex projects requiring cross-department coordination

**UI Implementation:**
- Staff list with checkboxes
- Selected items highlight in light blue
- Button shows count: "Assign to X Staff Members"
- Report cards show blue chips for each assigned staff
- Assigned staff names displayed as comma-separated list

**Data Structure:**
```javascript
{
  assignedStaff: [
    { uid: 'staff1', name: 'John', email: 'john@org.com' },
    { uid: 'staff2', name: 'Jane', email: 'jane@org.com' }
  ],
  assignedStaffIds: ['staff1', 'staff2'],
  assignedTo: 'John, Jane'
}
```

### 5.4 Proof Upload Feature ✅ IMPLEMENTED
**Purpose:** Enable staff to document completed work with evidence

**How It Works:**

**Staff Side:**
1. Staff views assigned task in "Reports" tab
2. Updates status to "In Progress"
3. Completes physical work on ground
4. Opens report detail screen
5. Clicks "Upload Proof of Work" button
6. Adds 1-5 proof images (before/after photos)
7. Writes description of work completed
8. Submits proof
9. Status automatically changes to "staff_proved"

**Admin Side:**
1. Admin navigates to "Staff-Proved Reports" tab
2. Views list of tasks with proof uploaded
3. Clicks on report to see details
4. Reviews all proof images and descriptions
5. Sees which staff member uploaded each proof
6. If satisfied, clicks "Mark as Resolved"
7. Status changes to "resolved"

**Features:**
- ✅ Upload 1-5 images per proof submission
- ✅ Add text description of work done
- ✅ Proof attributed to uploading staff member
- ✅ Multiple staff can upload separate proofs for same task
- ✅ Admin cannot mark as resolved without proof
- ✅ Proof display shows uploader name and timestamp
- ✅ "✓ Proof Uploaded" badge on staff screens

**Proof Object Structure:**
```javascript
{
  imageUrl: "https://supabase.co/storage/.../proof.jpg",
  description: "Replaced broken pipe and tested water flow",
  uploadedAt: Timestamp,
  uploadedBy: "staff_uid",
  uploadedByName: "Ahmed Ali"
}
```

### 5.5 Real-time Report Tracking
**Status Flow:**
```
pending → assigned → in_progress → staff_proved → resolved
```

**Status Indicators:**
- Color-coded badges
- Status text labels
- Progress percentage
- Timestamp for each transition

**Filters Available:**
- All Reports
- Pending (unassigned)
- Assigned (staff assigned but not started)
- In Progress (staff working)
- Staff Proved (proof uploaded, awaiting admin review)
- Resolved (completed and verified)

### 5.6 Organization-Based Routing
**Smart Organization Selection:**

**Automatic Selection:**
- User reports issue
- App captures GPS coordinates
- System finds nearest organizations (within 50km radius)
- Calculates distance using Haversine formula
- Suggests closest relevant organization
- User can override and select manually

**Manual Selection:**
- View list of all organizations
- Filtered by category (Water, Electric, Roads, etc.)
- Shows distance from current location
- Displays organization coverage areas

**Pre-configured Organizations (Pakistan):**
- **WASA** (Water & Sanitation - Lahore, Karachi, etc.)
- **LESCO, FESCO, IESCO, MEPCO, GEPCO, K-Electric** (Electricity)
- **LWMC** (Waste Management - Lahore)
- **CDA** (Capital Development Authority - Islamabad)
- **KDA, LDA** (Development Authorities)
- **MCL, MCG** (Municipal Corporations)
- **NHA** (National Highway Authority)

---

## 6. Database Structure (Firestore)

### 6.1 Collection: `users`
**Purpose:** Store profiles for all users (User, Admin, Staff roles)

**Schema:**
```javascript
{
  // Common fields
  uid: "string (Firebase Auth UID)",
  email: "string",
  name: "string",
  phone: "string",
  role: "user" | "admin" | "staff",
  createdAt: Timestamp,
  verified: boolean,
  
  // Admin-specific
  organizationId: "string (org_wasa)",
  permissions: ["array of permission strings"],
  
  // Staff-specific
  organizationId: "string",
  position: "string (e.g., Field Engineer)",
  status: "pending" | "approved" | "removed"
}
```

**Example Documents:**
```javascript
// User document
{
  uid: "abc123",
  email: "citizen@example.com",
  name: "Ali Khan",
  phone: "+923001234567",
  role: "user",
  createdAt: "2025-01-15T10:00:00Z",
  verified: true
}

// Admin document
{
  uid: "admin456",
  email: "admin@wasa.gov.pk",
  name: "Sara Ahmed",
  phone: "+923007654321",
  role: "admin",
  organizationId: "org_wasa",
  permissions: ["manage_staff", "assign_reports"],
  createdAt: "2025-01-10T08:00:00Z",
  verified: true
}

// Staff document
{
  uid: "staff789",
  email: "staff@wasa.gov.pk",
  name: "Usman Ali",
  phone: "+923009876543",
  role: "staff",
  organizationId: "org_wasa",
  position: "Plumber",
  status: "approved",
  createdAt: "2025-01-12T09:00:00Z",
  verified: true
}
```

### 6.2 Collection: `organizations`
**Purpose:** Store municipal organization details

**Schema:**
```javascript
{
  id: "string (org_wasa)",
  name: "string",
  type: "string (Water & Sanitation)",
  adminIds: ["array of admin UIDs"],
  staffIds: ["array of staff UIDs"],
  categories: ["array of issue types"],
  geo: {
    lat: number,
    lng: number
  },
  coverage: {
    cityIds: ["array"],
    districtIds: ["array"],
    villageIds: ["array"]
  },
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Example:**
```javascript
{
  id: "org_wasa",
  name: "WASA Lahore",
  type: "Water & Sanitation",
  adminIds: ["admin_uid_1"],
  staffIds: ["staff_uid_1", "staff_uid_2"],
  categories: ["Water Leakage", "Drainage", "Sewerage"],
  geo: { lat: 31.5204, lng: 74.3587 },
  coverage: {
    cityIds: ["lahore"],
    districtIds: ["gulberg", "model_town", "johar_town"],
    villageIds: []
  },
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### 6.3 Collection: `reports`
**Purpose:** Store all municipal issue reports

**Complete Schema:**
```javascript
{
  // Identification
  reportId: "string (RPT_timestamp)",
  uid: "string (reporter UID)",
  
  // Content
  category: "string (AI predicted)",
  description: "string",
  urgency: "High" | "Medium" | "Low",
  
  // Images
  imageUrls: ["array of Supabase URLs"],
  
  // Location
  location: {
    latitude: number,
    longitude: number,
    address: "string (from Nominatim)"
  },
  
  // Organization Assignment
  organizationId: "string",
  organizationName: "string",
  
  // Staff Assignment (Multi-staff support)
  assignedStaff: [
    { uid: "string", name: "string", email: "string" }
  ],
  assignedStaffIds: ["array of UIDs"],
  assignedTo: "string (comma-separated names)",
  assignedAt: Timestamp,
  adminNote: "string (optional)",
  
  // Status
  status: "pending" | "assigned" | "in_progress" | "staff_proved" | "resolved",
  
  // Proof of Work (Staff uploads)
  proofImages: [
    {
      imageUrl: "string",
      description: "string",
      uploadedAt: Timestamp,
      uploadedBy: "string (staff UID)",
      uploadedByName: "string"
    }
  ],
  
  // AI Prediction Metadata
  predictionMetadata: {
    urgency: "High" | "Medium" | "Low",
    confidence: number,
    isFallback: boolean,
    predictedAt: Timestamp
  },
  
  // Timestamps
  createdAt: Timestamp,
  updatedAt: Timestamp,
  resolvedAt: Timestamp | null
}
```

### 6.4 Collection: `staff_requests`
**Purpose:** Track staff applications to join organizations

**Schema:**
```javascript
{
  uid: "string (applicant UID)",
  email: "string",
  firstName: "string",
  lastName: "string",
  name: "string (full name)",
  organizationId: "string",
  status: "pending" | "approved" | "rejected",
  createdAt: Timestamp,
  approvedAt: Timestamp | null,
  approvedBy: "string (admin UID)" | null,
  rejectionReason: "string" | null
}
```

### 6.5 Supabase Storage Bucket: `reports`
**Purpose:** Store all uploaded images

**Configuration:**
- **Access:** Public
- **Max File Size:** 5MB
- **Allowed Types:** image/jpeg, image/png, image/jpg
- **Naming:** report_[timestamp].jpg, proof_[timestamp].jpg

**File Structure:**
```
reports/
├── report_1730000001.jpg (User uploads)
├── report_1730000002.jpg
├── report_1730000003.jpg
├── proof_1730000010.jpg (Staff proof uploads)
├── proof_1730000011.jpg
└── ...
```

**URL Format:**
```
https://[project].supabase.co/storage/v1/object/public/reports/[filename]
```

---

## 7. Authentication & Authorization

### 7.1 Firebase Authentication Setup
**Method:** Email/Password authentication

**Sign Up Flow:**
```javascript
1. User selects role (User/Admin/Staff)
2. Enters: email, password, name, phone
3. Firebase creates authentication account
4. Custom user document created in Firestore
5. Role stored in user document
6. Auto-login and redirect to role-specific home
```

**Login Flow:**
```javascript
1. User enters email + password
2. Firebase validates credentials
3. Fetch user document from Firestore
4. Check role and status
5. Navigate based on role:
   - User → Main Tabs
   - Admin → Admin Tabs
   - Staff (approved) → Staff Tabs
   - Staff (pending) → Pending Approval Screen
```

### 7.2 Role-Based Access Control (RBAC)

**AuthContext Provider:**
```javascript
const AuthContext = createContext({
  user: firebaseUser | null,
  userRole: 'user' | 'admin' | 'staff' | null,
  isPendingStaff: boolean,
  isAuthenticated: boolean,
  loading: boolean,
  roleDetermined: boolean,
  login: (email, password) => Promise,
  signup: (userData) => Promise,
  logout: () => Promise
});
```

**Access Control Matrix:**

| Feature | User | Admin | Staff (Pending) | Staff (Approved) |
|---------|------|-------|----------------|------------------|
| Submit Reports | ✅ | ❌ | ❌ | ❌ |
| View All Reports | ✅ (own only) | ✅ (org) | ❌ | ✅ (assigned) |
| Assign Staff | ❌ | ✅ | ❌ | ❌ |
| Create Organization | ❌ | ✅ | ❌ | ❌ |
| Approve Staff | ❌ | ✅ | ❌ | ❌ |
| Upload Proof | ❌ | ❌ | ❌ | ✅ |
| Mark Resolved | ❌ | ✅ | ❌ | ❌ |
| Join Organization | ❌ | ❌ | ✅ | N/A |
| View Status | ❌ | ❌ | ✅ | ✅ |

### 7.3 Protected Navigation
**Implementation in AppNavigator.js:**

```javascript
// Check authentication and role
const { loading, isAuthenticated, userRole, isPendingStaff } = useAuth();

// Show splash while checking auth
if (loading) return <SplashScreen />;

// Navigate based on authentication
if (!isAuthenticated) {
  return <AuthStack /> // Login, Signup, RoleSelection
}

// Navigate based on role
if (userRole === 'admin') {
  return <AdminTabs />
} else if (userRole === 'staff') {
  return isPendingStaff ? <PendingStaffTabs /> : <StaffTabs />
} else {
  return <MainTabs />
}
```

---

