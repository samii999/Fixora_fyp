# 🎯 FIXORA EVALUATION - PART 3: 30 Q&A

**Developer**: Muhammad Usman (SP22-BCS-036)  
**Quick Reference for Tomorrow's Evaluation**

---

## SECTION A: PROJECT BASICS (Q1-Q10)

### Q1: What is FIXORA?
Mobile app for municipal issue reporting (roads, garbage, water, electricity). Citizens report → Organizations manage → Staff resolve. Features: AI classification, duplicate detection, real-time notifications, team management.

### Q2: What problem does it solve?
- Citizens have no unified reporting system
- Organizations can't track issues efficiently  
- No accountability or status updates
- Duplicate reports waste resources
- Poor communication between parties

### Q3: Why React Native + Firebase?
- **React Native**: Cross-platform (iOS+Android), single codebase, fast development
- **Firebase**: Real-time database, built-in auth, offline support, free tier
- **Supabase**: Image storage with CDN, public URLs
- **Hugging Face**: Pre-trained AI, no model training needed

### Q4: Three user roles?
**Citizens**: Submit reports with photos/GPS → Track status → Give feedback  
**Admins**: Approve staff → Assign work → Verify completion → View analytics  
**Staff**: Join org → Receive assignments → Update status → Upload proof

### Q5: Database structure?
- **users**: uid, role, email, organizationId, teamId, status
- **organizations**: name, adminIds[], staffIds[], logo
- **reports**: category, location, status, assignedStaffIds, isDuplicate, urgency
- **teams**: name, members[], currentAssignments[], isAvailable
- **staff_requests**: uid, organizationId, status, approvedBy
- **feedback_requests**: reportId, rating, comment

### Q6: Report lifecycle timeline?
Submit (citizen) → Notify (admin) → Assign (admin) → Start work (staff) → Upload proof (staff) → Verify (admin) → Resolve → Feedback (citizen). **Average time**: 4 hours for urgent issues.

### Q7: How does AI classification work?
User uploads image → Convert to base64 → Send to Hugging Face (Google ViT model) → Predict category → Map to our categories → Auto-suggest organization. **Accuracy**: 85%+. **Fallback**: Manual selection.

### Q8: Explain duplicate detection algorithm?
Submit report → Query reports (same category + org, last 30 days) → Calculate GPS distance using **Haversine formula** → Find reports within 100m → Show alert → User confirms → Link reports → Update duplicate count. **Why 100m?**: Urban block size.

### Q9: How do notifications work?
Expo Notifications API → Request permission → Get push token → Save to Firestore → On events (assign/resolve/etc) → Send notification → User receives → Tap opens relevant screen. **Badge counter**: Real-time onSnapshot listener counts unread assignments.

### Q10: Team management benefits?
Group staff into specialized teams → Assign work to entire team at once → Track team availability → Show busy warnings → Better workload distribution → Performance tracking. **Example**: Emergency Team, Maintenance Team.

---

## SECTION B: TECHNICAL DETAILS (Q11-Q20)

### Q11: How does real-time sync work?
Firestore `onSnapshot()` listener → Monitors collection/document → Pushes changes instantly → UI auto-updates. No manual refresh needed. **Cleanup**: Unsubscribe on component unmount to prevent memory leaks.

### Q12: Image storage implementation?
expo-image-picker → Get URI → Convert to blob → Upload to Supabase Storage bucket "reports" → Get public URL → Store URL in Firestore → Display images via URL. **Compression**: 70% quality to reduce size.

### Q13: Location tracking process?
Request permission → expo-location gets GPS coordinates → Reverse geocoding converts to address → Store both lat/lon and address → Display on React Native Maps → Use in duplicate detection.

### Q14: Staff approval workflow?
Staff signs up → Creates join request → Status: "pending" → Admin sees request → Approves/Rejects → If approved: status → "active", added to org → Staff gets full access. **Pending staff**: Limited interface (Status + Profile only).

### Q15: Report status transitions?
**Flow**: pending → assigned → in_progress → needs_review → resolved  
**Validation**: Each status can only transition to specific next states  
**Roles**: Admin assigns, Staff updates progress, Admin resolves

### Q16: Urgency system logic?
AI predicts urgency from image/description → Assign High/Medium/Low → Sort reports by urgency → Color code (Red/Yellow/Green) → Duplicate count increases priority. **Keywords**: "broken", "dangerous", "emergency" → High priority.

### Q17: Feedback system flow?
Report resolved → Create feedback request → Notify user → User gives 1-5 stars + comment → Store feedback → Calculate org analytics (avg rating, response time). **Expiry**: 7 days.

### Q18: How to handle offline mode?
Firebase Firestore has built-in offline support → Data cached locally → Changes queued → Auto-sync when online → No code needed for basic offline. **Images**: Must be online to upload.

### Q19: Security implementation?
- Firebase Auth for passwords (hashed)
- Firestore security rules (role-based access)
- Role stored server-side, not client
- Image URLs are public (no sensitive data)
- API keys in environment variables

### Q20: Error handling strategy?
Try-catch blocks → Log errors to console → Show user-friendly alerts → Fallback values (AI fails → manual selection) → Network errors → Retry mechanism. **Example**: `Alert.alert('Error', 'Failed to submit. Try again.')`.

---

## SECTION C: FEATURES & FUNCTIONALITY (Q21-Q25)

### Q21: How does GPS distance calculation work?
**Haversine Formula**: Calculates great-circle distance between two lat/lon points on Earth. Formula accounts for Earth's curvature. Returns distance in meters. **Accuracy**: ±5-10m with good GPS signal.

### Q22: Badge counter implementation?
Real-time onSnapshot listener → Filter reports assigned to user with status "assigned" → Count array length → Update state → Pass to tab navigator → Badge shows count → Updates instantly when new assignment arrives.

### Q23: Proof of work verification?
Staff uploads before/after photos → Images stored in Supabase → Admin reviews photos → If OK: Mark resolved → If not: Reject with notes → Staff fixes and resubmits. **Storage**: Separate from report images.

### Q24: Organization matching logic?
AI detects category → Map category to relevant organization:
- Road Damage → CDA/NHA/LDA  
- Garbage → LWMC/MCL
- Water → WASA
- Electricity → LESCO/FESCO/IESCO
User can override if incorrect.

### Q25: Analytics calculation?
Query feedback_requests (status: completed) → Calculate avg rating, total feedbacks, rating distribution → Query reports → Calculate response time, resolution rate → Update dashboard in real-time. **Metrics**: Avg rating, total resolved, 5-star percentage.

---

## SECTION D: CHALLENGES & SOLUTIONS (Q26-Q30)

### Q26: Biggest challenge faced?
**Challenge**: Duplicate detection accuracy - GPS drift causes false positives/negatives.  
**Solution**: 100m radius (tested 50m/150m), filter by category + org, show user confirmation dialog (transparency), allow submission anyway.

### Q27: How to scale for large cities?
- Firestore auto-scales (no config needed)
- Index lat/lon fields for faster queries
- Paginate reports (load 20 at a time)
- Compress images before upload
- Use Firestore query limits
- Cache static data (organizations list)
- CDN for images (Supabase provides this)

### Q28: Testing strategy?
- Manual testing on Android (Expo Go)
- Test each user role separately
- Test network failures (airplane mode)
- Test with multiple devices simultaneously
- Test edge cases (empty data, no GPS)
- Location testing (different areas)
- AI testing (various image types)

### Q29: Future enhancements?
1. **Chat system**: In-app messaging between citizen and staff
2. **Route optimization**: AI suggests optimal route for multiple reports
3. **Voice reports**: Submit via voice description
4. **Multi-language**: Urdu, Punjabi support
5. **Report categories**: ML training on our own dataset
6. **Payment integration**: For paid services
7. **Statistics dashboard**: Heatmaps of problem areas
8. **Gamification**: Points system for active citizens

### Q30: Why this project is important?
**Social Impact**: Empowers citizens to participate in city improvement. Improves government accountability. Faster issue resolution improves quality of life. Reduces corruption (transparent system). Data-driven decision making for city planning.

**Technical Innovation**: Combines AI, real-time systems, location services, notifications. Demonstrates full-stack mobile development. Scalable architecture. Modern tech stack (React Native, Firebase, AI).

**Personal Learning**: Gained experience in: Mobile development, cloud databases, AI integration, real-time systems, UI/UX design, project management, problem-solving.

---

## QUICK STATISTICS TO MEMORIZE

- **Lines of Code**: ~15,000+
- **Components**: 30+ screens
- **Services**: 9 service files
- **Collections**: 6 Firestore collections
- **Features**: 10 major features
- **Technologies**: React Native, Firebase, Supabase, Hugging Face AI
- **Development Time**: 4-5 months
- **Team Size**: 1 (solo project)
- **Testing Devices**: Android (Expo Go)
- **AI Accuracy**: 85%+
- **Avg Response Time**: 4 hours for urgent issues
- **Duplicate Detection Radius**: 100 meters

---

## KEY POINTS TO EMPHASIZE

1. **Real-time everything**: Notifications, updates, badge counters
2. **AI integration**: Image classification, urgency prediction
3. **Smart features**: Duplicate detection saves resources
4. **Scalable architecture**: Firebase auto-scales, modular code
5. **User experience**: Intuitive UI, clear workflows, transparency
6. **Social impact**: Improves governance, empowers citizens
7. **Complete system**: Not just reporting, full lifecycle management
8. **Production-ready**: Error handling, offline support, security

---

## DEMO FLOW (If Asked to Demonstrate)

1. **Show citizen report flow** (2 min)
2. **Show AI classification** (30 sec)
3. **Show duplicate detection** (1 min)
4. **Show admin dashboard & assignment** (2 min)
5. **Show staff receiving notification** (30 sec)
6. **Show team management** (1 min)
7. **Show real-time updates** (30 sec)

**Total**: ~8 minutes for complete demo

---

**Good Luck! You've built an impressive, production-ready system! 🚀**
