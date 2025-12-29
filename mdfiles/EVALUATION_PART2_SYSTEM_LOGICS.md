# 🎯 FIXORA EVALUATION - PART 2: DETAILED SYSTEM LOGICS

**Developer**: Muhammad Usman (SP22-BCS-036)

---

## 🧠 MAIN SYSTEM LOGICS (Detailed Implementation)

### LOGIC 1: AUTHENTICATION & ROLE-BASED ACCESS

**How It Works:**
```
User Opens App → Role Selection (User/Admin/Staff) → Login/Signup
→ Firebase Authentication → Firestore User Doc Created/Updated
→ AuthContext Stores Global State → Navigation Routes to Correct Interface
```

**Key Code Pattern:**
```javascript
// AuthContext.js - Manages global auth state
const [user, setUser] = useState(null);
const [userRole, setUserRole] = useState(null);

useEffect(() => {
  onAuthStateChanged(auth, (firebaseUser) => {
    if (firebaseUser) {
      // Listen to user document for real-time role updates
      onSnapshot(doc(db, 'users', firebaseUser.uid), (userDoc) => {
        setUserRole(userDoc.data().role);
      });
    }
  });
}, []);

// AppNavigator.js - Routes based on role
if (userRole === 'admin') return <AdminTabNavigator />;
if (userRole === 'staff') return <StaffTabNavigator />;
if (userRole === 'user') return <MainTabNavigator />;
```

**Security Features:**
- Firebase Auth handles password hashing
- Role stored in secure Firestore (not client-side)
- Real-time role updates (admin can change roles instantly)
- Session persists across app restarts

---

### LOGIC 2: AI-POWERED IMAGE CLASSIFICATION

**How It Works:**
```
User Selects Image → Convert to Base64 → Send to Hugging Face API
→ Vision Transformer Model Analyzes → Returns Predictions Array
→ Map AI Label to Our Categories → Auto-fill Form Fields
→ Suggest Relevant Organization → User Can Override
```

**Implementation:**
```javascript
// predictionService.js
export async function classifyImage(imageUri) {
  // Convert image to base64
  const base64 = await FileSystem.readAsStringAsync(imageUri, {
    encoding: FileSystem.EncodingType.Base64
  });

  // Call Hugging Face API
  const response = await fetch(HUGGING_FACE_API, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${TOKEN}` },
    body: JSON.stringify({ inputs: base64 })
  });

  const predictions = await response.json();
  const topPrediction = predictions[0];
  
  // Map AI label to our categories
  return {
    category: mapLabelToCategory(topPrediction.label),
    confidence: (topPrediction.score * 100).toFixed(1) + '%',
    organization: matchToOrg(category)
  };
}

// Label mapping examples
function mapLabelToCategory(aiLabel) {
  if (aiLabel.includes('road') || aiLabel.includes('pothole'))
    return 'Road Damage';
  if (aiLabel.includes('garbage') || aiLabel.includes('waste'))
    return 'Garbage Collection';
  // ... more mappings
  return 'Other';
}
```

**Model Used:** Google Vision Transformer (ViT) - Pre-trained on ImageNet

**Advantages:**
- Saves user time (no manual selection)
- 85%+ accuracy for common issues
- Auto-suggests correct organization
- User can still override AI choice

---

### LOGIC 3: DUPLICATE REPORT DETECTION

**How It Works:**
```
User Submits Report with GPS Location → Query Recent Reports (30 days)
→ Filter by Same Category + Organization → Calculate Distance (Haversine)
→ Find Reports Within 100m → Show Alert if Duplicates Found
→ User Confirms → Link Reports Together → Update Counts
```

**Haversine Formula (GPS Distance Calculation):**
```javascript
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in meters
}

// Check for duplicates
export async function checkForDuplicates(lat, lon, category, radius, orgId) {
  const reports = await fetchRecentReports(orgId, category);
  
  return reports.filter(report => {
    const distance = calculateDistance(lat, lon, report.lat, report.lon);
    return distance <= radius;
  }).sort((a, b) => a.distance - b.distance);
}
```

**Linking Logic:**
```javascript
export async function linkDuplicates(newReportId, originalId, distance) {
  // Mark new report as duplicate
  await updateDoc(doc(db, 'reports', newReportId), {
    isDuplicate: true,
    originalReportId: originalId,
    duplicateDistance: distance
  });
  
  // Increment duplicate count on original
  await updateDoc(doc(db, 'reports', originalId), {
    duplicateCount: increment(1),
    duplicateReports: arrayUnion({ reportId: newReportId, distance })
  });
}
```

**User Experience:**
- Alert shows: "Similar report 45m away, Status: In Progress"
- Options: [Cancel] or [Submit Anyway]
- If submitted: Auto-linked, both visible with badges
- Original shows: "🔁 +3 duplicates" badge
- Duplicate shows: "🔗 Linked" badge

**Benefits:**
- Prevents duplicate work for staff
- More duplicates = higher priority
- Better resource allocation
- User not rejected (transparency)

---

### LOGIC 4: REAL-TIME NOTIFICATION SYSTEM

**How It Works:**
```
Event Triggered (Report/Assignment/Update) → Identify Recipients
→ Fetch Push Tokens → Compose Notification → Send via Expo API
→ User Receives Push → Tap Opens Relevant Screen
→ Badge Counter Updates in Real-Time
```

**Permission & Registration:**
```javascript
export async function registerForPushNotifications(userId) {
  // Request permission
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return null;
  
  // Get push token
  const token = (await Notifications.getExpoPushTokenAsync()).data;
  
  // Save to Firestore
  await updateDoc(doc(db, 'users', userId), {
    pushToken: token,
    notificationsEnabled: true
  });
  
  return token;
}
```

**Sending Notifications:**
```javascript
export async function notifyStaffAssignment(reportId, staffIds, category, address) {
  const title = '📋 New Assignment';
  const body = `Assigned to ${category} at ${address}`;
  
  for (const staffId of staffIds) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title, body,
        data: { type: 'assignment', reportId },
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH
      },
      trigger: null // Immediate
    });
  }
}
```

**Real-Time Badge Counter:**
```javascript
// In StaffTabNavigator
const [badgeCount, setBadgeCount] = useState(0);

useEffect(() => {
  const unsubscribe = onSnapshot(
    query(collection(db, 'reports')),
    (snapshot) => {
      const newAssignments = snapshot.docs.filter(doc => {
        const data = doc.data();
        return data.assignedStaffIds?.includes(user.uid) && 
               data.status === 'assigned';
      });
      setBadgeCount(newAssignments.length);
    }
  );
  return () => unsubscribe();
}, [user.uid]);

// Tab configuration
<Tab.Screen 
  name="Reports"
  options={{
    tabBarBadge: badgeCount > 0 ? badgeCount : undefined,
    tabBarBadgeStyle: { backgroundColor: '#FF3B30' }
  }}
/>
```

**Notification Events:**
1. New report → Notify admins
2. Work assigned → Notify staff
3. Work started → Notify reporter
4. Proof uploaded → Notify admins
5. Report resolved → Notify reporter
6. Feedback requested → Notify reporter

---

### LOGIC 5: TEAM MANAGEMENT SYSTEM

**How It Works:**
```
Admin Creates Team → Adds Staff Members → Staff Profiles Updated
→ Assign Work to Team → All Members Notified → Team Status Updated
→ Track Team Availability → Show Busy Warnings
```

**Create Team:**
```javascript
export async function createTeam(orgId, teamData, adminUid) {
  return await addDoc(collection(db, 'teams'), {
    name: teamData.name,
    description: teamData.description,
    organizationId: orgId,
    members: [],
    isAvailable: true,
    currentAssignments: [],
    createdBy: adminUid,
    createdAt: new Date()
  });
}
```

**Add Staff to Team:**
```javascript
export async function addStaffToTeam(teamId, staffUid) {
  const staffDoc = await getDoc(doc(db, 'users', staffUid));
  const teamDoc = await getDoc(doc(db, 'teams', teamId));
  
  // Add to team
  await updateDoc(doc(db, 'teams', teamId), {
    members: arrayUnion({
      uid: staffUid,
      name: staffDoc.data().name,
      email: staffDoc.data().email,
      addedAt: new Date()
    })
  });
  
  // Update staff profile
  await updateDoc(doc(db, 'users', staffUid), {
    teamId: teamId,
    teamName: teamDoc.data().name
  });
}
```

**Assign Work to Team:**
```javascript
export async function assignToTeam(reportId, teamId, adminUid) {
  const team = await getDoc(doc(db, 'teams', teamId));
  const memberIds = team.data().members.map(m => m.uid);
  
  // Update report
  await updateDoc(doc(db, 'reports', reportId), {
    assignmentType: 'team',
    assignedTeamId: teamId,
    assignedTeamName: team.data().name,
    assignedStaffIds: memberIds,
    assignedTo: `Team: ${team.data().name}`,
    status: 'assigned'
  });
  
  // Update team status
  await updateDoc(doc(db, 'teams', teamId), {
    isAvailable: false,
    currentAssignments: arrayUnion({
      reportId, assignedAt: new Date(), status: 'assigned'
    })
  });
  
  // Notify all members
  await notifyStaffAssignment(reportId, memberIds, category, address);
}
```

**Busy Status Checking:**
```javascript
// Check if team is busy
const teamDoc = await getDoc(doc(db, 'teams', teamId));
const activeWork = teamDoc.data().currentAssignments.filter(
  a => a.status === 'assigned' || a.status === 'in_progress'
).length;

if (activeWork > 0) {
  Alert.alert(
    'Team Busy',
    `${teamName} has ${activeWork} active assignment(s). Assign anyway?`,
    [
      { text: 'Cancel' },
      { text: 'Assign Anyway', onPress: () => assignToTeam(...) }
    ]
  );
}
```

**Visual Indicators:**
- Staff card shows: "👥 Team: Emergency Response"
- Team card shows: "⚠️ Busy (2 active works)" in yellow
- Available teams: "✅ Available" in green

---

### LOGIC 6: IMAGE STORAGE (Supabase)

**How It Works:**
```
User Picks Image → expo-image-picker Gets URI
→ Convert to Blob → Upload to Supabase Storage
→ Get Public URL → Store URL in Firestore
→ Display Images Throughout App
```

**Image Upload Implementation:**
```javascript
// Pick image
const pickImage = async () => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.7 // Compression (70%)
  });
  
  if (!result.canceled) {
    return result.assets[0].uri;
  }
};

// Upload to Supabase
export async function uploadImageToSupabase(imageUri) {
  try {
    // Convert to blob
    const response = await fetch(imageUri);
    const blob = await response.blob();
    
    // Generate unique filename
    const fileName = `${Date.now()}-${Math.random().toString(36)}.jpeg`;
    
    // Upload to Supabase bucket
    const { data, error } = await supabase.storage
      .from('reports')
      .upload(fileName, blob, {
        contentType: 'image/jpeg',
        cacheControl: '3600'
      });
    
    if (error) throw error;
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('reports')
      .getPublicUrl(fileName);
    
    return urlData.publicUrl;
    
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
}
```

**Usage in Report Form:**
```javascript
const handleSubmit = async () => {
  setLoading(true);
  
  // Upload image first
  const imageUrl = await uploadImageToSupabase(selectedImageUri);
  
  // Then save report with image URL
  await addDoc(collection(db, 'reports'), {
    imageUrl,
    category,
    description,
    location,
    // ... other fields
  });
  
  setLoading(false);
};
```

**Advantages:**
- Supabase provides CDN (fast loading)
- Public URLs (no auth needed for viewing)
- Automatic image optimization
- Scalable storage (pay as you grow)
- 1GB free tier

---

### LOGIC 7: LOCATION TRACKING & GEOCODING

**How It Works:**
```
Request Permission → Get GPS Coordinates → Reverse Geocoding
→ Convert Lat/Lon to Address → Store Both → Display on Map
→ Use in Duplicate Detection
```

**Get Current Location:**
```javascript
export async function getCurrentLocation() {
  // Request permission
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Location permission denied');
  }
  
  // Get coordinates
  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High
  });
  
  // Reverse geocode to address
  const address = await Location.reverseGeocodeAsync({
    latitude: location.coords.latitude,
    longitude: location.coords.longitude
  });
  
  const addr = address[0];
  const formattedAddress = `${addr.street}, ${addr.city}, ${addr.region}`;
  
  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    address: formattedAddress
  };
}
```

**Display on Map:**
```javascript
import MapView, { Marker } from 'react-native-maps';

<MapView
  style={{ flex: 1 }}
  initialRegion={{
    latitude: location.latitude,
    longitude: location.longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01
  }}
>
  <Marker
    coordinate={{
      latitude: location.latitude,
      longitude: location.longitude
    }}
    title={report.category}
    description={report.address}
  />
</MapView>
```

**Used For:**
- Report submission (auto-detect location)
- Duplicate detection (calculate distance)
- Map visualization (show all reports)
- Staff navigation (directions to site)

---

### LOGIC 8: STAFF APPROVAL WORKFLOW

**How It Works:**
```
Staff Signs Up → Status: "pending" → Request Document Created
→ Admin Sees in Dashboard → Approves/Rejects
→ If Approved: Status → "active", Organization Linked
→ Staff Gets Full Access
```

**Request to Join:**
```javascript
export async function requestJoinOrganization(staffUid, orgId, staffData) {
  // Create request document
  await addDoc(collection(db, 'staff_requests'), {
    uid: staffUid,
    email: staffData.email,
    name: staffData.name,
    organizationId: orgId,
    status: 'pending',
    createdAt: new Date()
  });
  
  // Set user status to pending
  await updateDoc(doc(db, 'users', staffUid), {
    status: 'pending',
    organizationId: orgId
  });
}
```

**Admin Approval:**
```javascript
export async function approveStaffRequest(requestId, staffUid, orgId, adminUid) {
  // Update request
  await updateDoc(doc(db, 'staff_requests', requestId), {
    status: 'approved',
    approvedBy: adminUid,
    approvedAt: new Date()
  });
  
  // Update staff user
  await updateDoc(doc(db, 'users', staffUid), {
    status: 'active'
  });
  
  // Add to organization
  await updateDoc(doc(db, 'organizations', orgId), {
    staffIds: arrayUnion(staffUid)
  });
  
  // Send notification
  await sendNotificationToUser(
    staffUid,
    '✅ Request Approved',
    'Your request has been approved. You can now access all features.'
  );
}
```

**Access Control:**
```javascript
// Pending staff see limited interface
if (userStatus === 'pending') {
  return <PendingStaffTabNavigator />; // Only Status + Profile
} else {
  return <StaffTabNavigator />; // Full access
}
```

---

### LOGIC 9: REPORT STATUS LIFECYCLE

**Status Flow:**
```
pending → assigned → in_progress → needs_review → resolved
```

**Allowed Transitions:**
```javascript
const validTransitions = {
  'pending': ['assigned'],
  'assigned': ['in_progress', 'pending'],
  'in_progress': ['needs_review', 'assigned'],
  'needs_review': ['resolved', 'in_progress'],
  'resolved': [] // Terminal state
};
```

**Status Update with Validation:**
```javascript
export async function updateReportStatus(reportId, newStatus, userId, userRole) {
  const report = await getDoc(doc(db, 'reports', reportId));
  const currentStatus = report.data().status;
  
  // Validate transition
  if (!validTransitions[currentStatus].includes(newStatus)) {
    throw new Error(`Cannot transition from ${currentStatus} to ${newStatus}`);
  }
  
  // Role-based permissions
  if (newStatus === 'assigned' && userRole !== 'admin') {
    throw new Error('Only admins can assign reports');
  }
  if (newStatus === 'in_progress' && userRole !== 'staff') {
    throw new Error('Only staff can start work');
  }
  
  // Update report
  await updateDoc(doc(db, 'reports', reportId), {
    status: newStatus,
    updatedAt: new Date(),
    updatedBy: userId,
    statusHistory: arrayUnion({
      from: currentStatus,
      to: newStatus,
      changedBy: userId,
      changedAt: new Date()
    })
  });
  
  // Trigger notifications
  if (newStatus === 'assigned') {
    await notifyStaffAssignment(...);
  } else if (newStatus === 'in_progress') {
    await notifyUserReportInProgress(...);
  } else if (newStatus === 'resolved') {
    await notifyUserReportResolved(...);
    await createFeedbackRequest(...);
  }
}
```

**Color Coding:**
- pending: Gray
- assigned: Blue
- in_progress: Yellow
- needs_review: Orange
- resolved: Green

---

### LOGIC 10: FEEDBACK & RATING SYSTEM

**How It Works:**
```
Admin Resolves Report → Feedback Request Created
→ User Notified → Provides Rating (1-5) + Comment
→ Feedback Stored → Analytics Updated
```

**Create Request:**
```javascript
export async function createFeedbackRequest(reportId, userId) {
  const requestRef = await addDoc(collection(db, 'feedback_requests'), {
    reportId,
    userId,
    status: 'pending',
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  });
  
  await sendNotificationToUser(
    userId,
    '⭐ Share Your Feedback',
    'Your report was resolved. How did we do?',
    { type: 'feedback_request', reportId }
  );
  
  return requestRef.id;
}
```

**Submit Feedback:**
```javascript
export async function submitFeedback(requestId, rating, comment) {
  // Update request
  await updateDoc(doc(db, 'feedback_requests', requestId), {
    status: 'completed',
    rating,
    comment,
    submittedAt: new Date()
  });
  
  // Update report
  const request = await getDoc(doc(db, 'feedback_requests', requestId));
  await updateDoc(doc(db, 'reports', request.data().reportId), {
    userRating: rating,
    userFeedback: comment,
    feedbackReceived: true
  });
}
```

**Analytics Calculation:**
```javascript
export async function getOrganizationAnalytics(orgId) {
  const feedbacks = await getDocs(
    query(
      collection(db, 'feedback_requests'),
      where('status', '==', 'completed')
    )
  );
  
  let totalRating = 0;
  let count = 0;
  
  feedbacks.forEach(doc => {
    totalRating += doc.data().rating;
    count++;
  });
  
  const avgRating = count > 0 ? (totalRating / count).toFixed(1) : 0;
  
  return {
    averageRating: avgRating,
    totalFeedbacks: count,
    5stars: feedbacks.filter(d => d.data().rating === 5).length,
    4stars: feedbacks.filter(d => d.data().rating === 4).length,
    // ... etc
  };
}
```

---

**Continue to PART 3 for 30 Evaluation Questions & Answers →**
