# FIXORA - Municipal Issue Management System

**Developer:** Muhammad Usman (SP22-BCS-036)  
**Project Type:** Final Year Project  
**Technology:** React Native Mobile Application (Cross-platform - Android & iOS)  
**Backend:** Firebase & Supabase

---

## What is FIXORA?

FIXORA is a mobile application that connects citizens with municipal organizations to report and resolve civic infrastructure problems. It's designed to make it easy for people to report issues like broken roads, water leakage, garbage problems, and other municipal concerns directly from their smartphones.

The app has three types of users:
1. **Citizens (Users)** - Report problems in their area
2. **Municipal Admins** - Manage organizations and assign work
3. **Field Staff** - Receive tasks and fix issues on the ground

---

## Why This Project?

Municipal authorities face several challenges:
- Citizens don't have an easy way to report problems
- Complaints get lost or ignored
- No way to track if issues are being resolved
- Difficult to prioritize urgent vs non-urgent issues
- Hard to assign the right staff to the right problems
- No accountability or proof of work completion

FIXORA solves all these problems by providing a centralized digital platform where everything is tracked, organized, and transparent.

---

## How FIXORA Works

### For Citizens (Regular Users):
1. **Report an Issue:** User opens the app and clicks "Report Issue"
2. **Add Details:** They describe the problem (like "water pipe burst on Main Street")
3. **Add Photos:** Take or upload photos showing the problem
4. **Location:** GPS automatically captures the exact location
5. **AI Prediction:** The system automatically predicts how urgent the issue is (High, Medium, Low)
6. **Auto-Assignment:** The app automatically selects which municipal organization should handle it (like WASA for water issues, LESCO for electricity, etc.)
7. **Track Progress:** User can see the status - is it pending, assigned to staff, in progress, or resolved?

### For Municipal Admins:
1. **Create Organization:** Admin first creates their organization profile (like "WASA Lahore" or "Lahore Waste Management")
2. **Manage Staff:** They can approve staff members who apply to join their organization
3. **View Reports:** See all citizen complaints for their area
4. **Assign Tasks:** Choose one or multiple staff members to fix each issue
5. **Add Instructions:** Can write notes for staff about how to handle the task
6. **Review Work:** When staff upload proof of completion, admin reviews it
7. **Mark Resolved:** If satisfied with the work, admin marks the issue as resolved

### For Field Staff:
1. **Join Organization:** Staff member signs up and requests to join an organization
2. **Wait for Approval:** Admin must approve them before they get full access
3. **View Assigned Tasks:** After approval, they see all tasks assigned to them
4. **Start Working:** They can update status to "In Progress" when they begin work
5. **Upload Proof:** After fixing the issue, they upload photos showing the completed work and write a description
6. **Admin Reviews:** Admin checks their work and marks it as resolved if satisfied

---

## Key Features Currently Implemented

### 1. AI-Powered Urgency Prediction ✅
- When a user reports an issue, AI automatically analyzes the description
- It predicts urgency level: High (red), Medium (orange), or Low (green)
- All reports are automatically sorted by urgency so critical issues are handled first
- Uses a machine learning model hosted on Google Colab
- If AI fails, has a backup keyword-based system to ensure reports can still be submitted

**Example:** If someone reports "URGENT water pipe burst flooding the street", AI detects keywords and marks it as High urgency. A minor issue like "graffiti on wall" would be Low urgency.

### 2. Multi-Staff Assignment ✅
- Admins can assign multiple staff members to a single task
- Useful for big problems that need team effort (like a major road repair needing electricians + plumbers)
- All assigned staff can see the task
- Each staff member can upload their own proof of work
- Admin sees who did what

**Example:** A bathroom renovation might need both a plumber and an electrician. Admin can assign both to the same task.

### 3. Proof Upload System ✅
- Staff must provide photo evidence of completed work
- They upload "before and after" photos
- Write description of what they did
- System tracks who uploaded which proof and when
- Admin cannot mark task as "resolved" without proof
- This creates accountability

**Example:** Staff fixes a broken pipe, takes photos of the fixed pipe, uploads them with description "Replaced damaged section and tested water pressure - no leaks", then admin verifies and approves.

### 4. Smart Organization Assignment
- System has pre-configured organizations like WASA (water), LESCO (electricity), LWMC (waste), etc.
- When user reports an issue, system uses GPS to find nearest appropriate organization
- User can also manually select if needed
- Calculates distance using coordinates

**Organizations included:** WASA, LESCO, FESCO, IESCO, MEPCO, K-Electric, LWMC, CDA, KDA, LDA, NHA, and more Pakistani municipal authorities.

### 5. Real-Time Location & Mapping
- Uses phone GPS to get exact location automatically
- Shows interactive map where user can adjust marker if needed
- Converts coordinates to readable address (like "Main Boulevard, Gulberg, Lahore")
- Uses OpenStreetMap for geocoding

### 6. Multi-Image Upload
- Users can upload multiple photos (up to 5) per report
- Can use camera or select from gallery
- Images stored on Supabase cloud storage
- Fast and reliable image handling

### 7. Complete Status Tracking
Reports go through these stages:
- **Pending** → Just submitted, waiting for admin
- **Assigned** → Admin assigned staff member(s)
- **In Progress** → Staff is working on it
- **Staff Proved** → Staff uploaded proof of completion
- **Resolved** → Admin verified and closed the issue

Everyone can see current status at all times.

### 8. Role-Based Access Control
- Different screens and features for different user types
- Users can only see their own reports
- Admins see all reports for their organization
- Staff see only tasks assigned to them
- Pending staff have limited access until admin approves them

### 9. Organization Management
- Admins can create new organizations
- Set organization name, type, coverage area, location
- Add categories (what types of issues they handle)
- Manage staff list
- View organization statistics

### 10. Staff Request System
- Staff members apply to join organizations
- Application goes to admin for approval
- Admin can approve or reject with reason
- Approved staff get full access
- Removed staff lose access

---



### 11. Feedback & Rating Module ⭐ PLANNED
**What it will do:**
- After an issue is resolved, user can rate the service
- Rate from 1-5 stars
- Write review comments
- Rate responsiveness, quality of work, professionalism
- Admin can see ratings to improve service
- Staff members get performance ratings

**Why it's useful:**
- Accountability for staff and organizations
- Citizens can see which organizations are reliable
- Helps identify and reward good performers
- Identifies areas needing improvement

### 2. Image Classification using MobileNetV2 🤖 PLANNED
**What it will do:**
- AI looks at uploaded photos and automatically categorizes the issue
- User uploads photo of broken pipe → AI says "Water Leakage"
- User uploads photo of pothole → AI says "Road Damage"
- Makes reporting even faster - less typing needed
- Improves accuracy of categorization

**Technical Details:**
- Uses MobileNetV2 deep learning model
- Trained on images of different municipal issues
- Lightweight model that works on mobile devices
- Can identify: water leaks, potholes, garbage, broken lights, drainage issues, electrical problems, etc.

**Benefits:**
- Faster report submission (just take photo)
- More accurate categorization
- Routes to correct department automatically
- Reduces admin workload

### 3. Enhanced Authentication & Role Refinements 🔐 PLANNED
**What will be improved:**
- More secure role-based access with better permission management
- Admin can set specific permissions for different staff levels (supervisor vs field worker)
- Two-factor authentication for admin accounts
- Verification system for organizations (prevent fake organizations)
- Better password security requirements
- Session management improvements
- Activity logging (who did what and when)

**New Permission Types:**
- Read-only staff (can view but not update)
- Supervisors (can assign to other staff)
- Department heads (manage multiple staff groups)
- Super admin (manage multiple organizations)

**Security Improvements:**
- Email verification for all users
- Phone number verification
- Better input validation
- Protection against spam reports
- Rate limiting

---

## Technical Architecture Overview

### Frontend (Mobile App):
- Built with React Native using Expo framework
- Works on both Android and iOS devices
- Single codebase for both platforms
- Modern, clean UI with smooth navigation
- Offline support (can queue reports when no internet)

### Backend & Database:
- **Firebase Authentication:** Handles user login/signup securely
- **Firebase Firestore:** NoSQL database storing all data (users, reports, organizations)
- **Supabase Storage:** Cloud storage for all images
- **Real-time Updates:** Changes sync instantly across all devices

### AI & External Services:
- **Custom ML Model:** Urgency prediction hosted on Google Colab, accessed via ngrok
- **OpenStreetMap Nominatim API:** Converts GPS coordinates to addresses
- **Expo Location:** Gets device GPS coordinates
- **React Native Maps:** Interactive map display

### Data Storage:
All data stored in Firebase Firestore collections:
- **users:** User profiles (citizens, admins, staff)
- **organizations:** Municipal organization details
- **reports:** All issue reports with full details
- **staff_requests:** Applications from staff to join organizations

All images stored in Supabase "reports" bucket.

---

## User Journey Examples

### Example 1: Citizen Reports Water Leak
1. Ahmed opens FIXORA app on his phone
2. Taps "Report Issue" button
3. Takes photo of water gushing from broken pipe
4. Writes: "Major pipe burst on Canal Road near McDonald's"
5. GPS automatically captures location
6. AI analyzes text and marks as "High" urgency
7. System auto-selects "WASA Lahore" as responsible organization
8. Ahmed submits report
9. He can track progress in "My Reports" section

### Example 2: Admin Assigns Task
1. Sara (WASA admin) logs into admin dashboard
2. Sees Ahmed's report at top (because it's High urgency)
3. Reviews photos and location
4. Selects 2 staff members: Ali (senior plumber) and Hassan (assistant)
5. Adds note: "Priority task - handle today. Bring replacement pipes."
6. Assigns task to both staff members
7. Ali and Hassan receive notification

### Example 3: Staff Completes Work
1. Ali (plumber) sees new task in his app
2. Changes status to "In Progress"
3. Goes to Canal Road, fixes the pipe
4. Takes photos of: broken pipe, repair work, and final result
5. Uploads 3 proof photos
6. Writes: "Replaced 2-meter damaged section, tested pressure, no leaks detected"
7. Submits proof
8. Sara (admin) gets notification
9. Reviews proof photos
10. Satisfied with work, marks as "Resolved"
11. Ahmed (original reporter) sees his issue is now resolved

---

## Project Structure (File Organization)

### Main Folders:
- **src/screens/** - All app screens for User, Admin, Staff
- **src/components/** - Reusable UI components (buttons, forms, cards)
- **src/services/** - Business logic (authentication, reports, location, predictions)
- **src/config/** - Configuration files (Firebase, Supabase, API settings)
- **src/navigation/** - App navigation and routing
- **src/utils/** - Helper functions and utilities
- **assets/** - Images, icons, fonts

### Key Files:
- **App.js:** Main application entry point
- **src/navigation/AppNavigator.js:** Handles all screen navigation and role-based routing
- **src/context/AuthContext.js:** Manages user authentication state
- **src/components/form/ReportForm.js:** The report submission form
- **src/config/apiConfig.js:** AI prediction API configuration (ngrok URL)
- **src/services/predictionService.js:** AI urgency prediction logic
- **package.json:** All project dependencies

---

## Database Collections Detail

### Users Collection:
Stores everyone who uses the app - citizens, admins, and staff. Each user has:
- Unique ID (from Firebase)
- Email and password (encrypted)
- Name and phone number
- Role (user/admin/staff)
- For admins: which organization they manage
- For staff: which organization they belong to, their position, approval status

### Organizations Collection:
Stores all municipal organizations. Each organization has:
- Unique ID (like org_wasa, org_lesco)
- Organization name (like "WASA Lahore")
- Type/Category (Water & Sanitation, Electricity, etc.)
- List of admin IDs managing it
- List of staff members
- Geographic location (latitude/longitude)
- Coverage areas (which cities/districts they serve)
- Issue categories they handle

### Reports Collection:
Stores all citizen complaints. Each report has:
- Unique report ID (RPT_timestamp)
- Who reported it (user ID)
- Description of problem
- Category (predicted by AI)
- Urgency level (High/Medium/Low)
- Photos (URLs to Supabase storage)
- GPS location (latitude, longitude, address)
- Which organization it's assigned to
- Which staff members are assigned
- Current status (pending/assigned/in_progress/staff_proved/resolved)
- Proof images from staff (if completed)
- All timestamps (created, assigned, resolved)

### Staff Requests Collection:
Tracks applications from people wanting to become staff. Each request has:
- Staff member's ID and details
- Which organization they want to join
- Status (pending/approved/rejected)
- When they applied
- Who approved them (if approved)
- Rejection reason (if rejected)

---

## Why These Technologies?

### React Native + Expo:
- Build once, deploy to both Android and iOS
- Large community and support
- Fast development
- Native mobile app performance
- Easy to test and update

### Firebase:
- Free tier available
- Real-time database synchronization
- Secure authentication built-in
- Scalable (can handle many users)
- Well documented
- Google's reliable infrastructure

### Supabase:
- Open-source alternative to Firebase Storage
- Better for handling large files (images)
- Generous free tier
- Fast CDN for image delivery
- Simple API

### AI Integration:
- Google Colab for free GPU access
- Ngrok for easy API access without deployment
- Can upgrade to proper server later
- Demonstrates machine learning integration

---

## Current Limitations & Future Improvements

### Current Limitations:
1. AI model hosted on Colab (ngrok URL changes frequently)
2. No push notifications yet (configured but not implemented)
3. No feedback/rating system yet
4. No image-based classification yet
5. No analytics dashboard for statistics
6. Limited to Pakistan organizations currently

### Future Improvements:
1. Deploy AI model to permanent server
2. Implement push notifications
3. Add rating system after resolution
4. Implement MobileNetV2 image classification
5. Enhanced authentication with 2FA
6. Analytics dashboard with graphs
7. Expand to other countries
8. Web admin panel
9. Automated report categorization
10. In-app chat between users and staff

---

## Installation & Running

### Requirements:
- Node.js installed
- Expo CLI
- Android Studio or Xcode (for testing)
- Firebase account
- Supabase account

### Setup Steps:
1. Clone project
2. Run `npm install` to install dependencies
3. Configure Firebase (add your credentials)
4. Configure Supabase (add your credentials)
5. Update ngrok URL in `src/config/apiConfig.js`
6. Run `npm start` to launch Expo
7. Scan QR code with Expo Go app or run on emulator

### For AI Prediction:
1. Start Google Colab notebook with ML model
2. Get ngrok URL from Colab output
3. Update `PREDICTION_API_URL` in `src/config/apiConfig.js`
4. Restart app

---

## Project Impact & Benefits

### For Citizens:
- Easy way to report problems
- Track progress transparently
- Get issues resolved faster
- Evidence-based accountability
- Improved civic services

### For Municipal Organizations:
- Centralized complaint management
- Better resource allocation
- Performance tracking
- Proof of work completion
- Improved public image
- Data-driven decisions

### For Government:
- Digital transformation of civic services
- Reduced paperwork
- Better citizen engagement
- Accountability and transparency
- Cost-effective solution
- Scalable system

### Social Impact:
- Cleaner cities
- Faster issue resolution
- Better quality of life
- Empowered citizens
- Efficient governance
- Technology-enabled civic participation

---

## Unique Selling Points

1. **AI-Powered Intelligence:** Automatic urgency detection and smart categorization
2. **Accountability:** Proof upload system ensures work is actually done
3. **Multi-Staff Coordination:** Teams can work together on complex issues
4. **Location-Based:** GPS and mapping integration for precise reporting
5. **Role-Based System:** Different interfaces for different user types
6. **Real-Time Tracking:** Everyone knows status at all times
7. **Free & Open:** Can be adopted by any municipal organization
8. **Scalable:** Works for small towns or large cities
9. **Evidence-Based:** Photos required for both reports and proof
10. **User-Friendly:** Simple interface anyone can use

---

## Project Statistics

### Code:
- **Platform:** React Native (Expo)
- **Total Screens:** 20+ screens
- **Components:** 15+ reusable components
- **Services:** 7 service modules
- **Lines of Code:** ~8,000+ lines
- **Dependencies:** 45+ npm packages

### Features:
- 3 user roles with distinct interfaces
- 5 status levels for reports
- Multi-image upload (up to 5 per report)
- Real-time AI urgency prediction
- Multi-staff assignment capability
- Proof upload with attribution
- 13+ pre-configured organizations
- GPS-based location capture
- Interactive map integration
- Automatic address lookup

---

## Conclusion

FIXORA represents a complete digital solution for municipal issue management. It bridges the gap between citizens and municipal authorities, making it easy to report problems and track their resolution. The integration of AI for urgency prediction and the proof upload system for accountability make it stand out from simple complaint management systems.

The planned enhancements (feedback/rating, image classification, enhanced security) will make it even more powerful and useful. This project demonstrates proficiency in mobile app development, database design, API integration, machine learning, and user experience design.

FIXORA is ready for real-world deployment and can significantly improve how cities manage and resolve civic infrastructure issues.

---

**End of Documentation**
