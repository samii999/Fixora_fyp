# Notification Not Showing on Expo Go - Troubleshooting Guide

## Issue
Notifications show in console logs but don't appear on Expo Go mobile device.

## Root Cause
Expo Go has **limitations** for push notifications. Local notifications work differently and may not always show when the app is in foreground.

---

## ✅ Quick Fixes to Try

### 1. **Test Notifications** (NEW!)
1. Open the app on your device
2. Go to **Profile → Help & Support**
3. At the top, you'll see "Test Notifications" section
4. Tap **"🔔 Test Notifications"** button
5. Grant permissions if prompted
6. **Put the app in background** (press home button)
7. You should receive a notification

### 2. **Check Permissions**
```javascript
// In Help & Support screen:
// Tap "Check Status" button to see:
// - Permission status (must be "granted")
// - Notification channels
```

**If permission is NOT granted:**
1. Tap "Test Notifications" again
2. When prompted, tap "Allow" 
3. Or manually enable in device settings:
   - **Android**: Settings → Apps → Expo Go → Notifications → ON
   - **iOS**: Settings → Expo Go → Notifications → Allow Notifications

### 3. **App Must Be in Background**
**IMPORTANT**: In Expo Go, notifications often don't show when app is in **foreground** (actively open).

**To see notifications:**
1. Submit a report
2. Press **Home button** (minimize the app)
3. Wait 2-3 seconds
4. Pull down notification shade
5. Notification should appear!

### 4. **Admin User Setup for Testing**
For admin notifications to work when YOU submit a report:

1. Open Firebase Console → Firestore
2. Find your user document in `users` collection
3. Update your user:
   ```javascript
   {
     role: "admin",              // Make yourself admin
     organizationId: "org_123",  // Set organization ID
     // ... other fields
   }
   ```
4. Now when you submit reports to that organization, YOU will receive notifications

---

## 🔧 Enhanced Notification Service

The notification service has been improved:

### Changes Made:
1. **Better permission checking** before sending notifications
2. **Enhanced logging** - every step is logged to console
3. **Test notification function** - `sendTestNotificationToSelf()`
4. **Higher priority** - Android HIGH priority for notifications
5. **Vibration enabled** - helps notice notifications

### New Console Logs:
```
📱 Scheduling local notification: {title, body}
✅ Local notification scheduled with ID: xxx-xxx-xxx
```

If you see:
```
❌ Notification permission not granted: denied
```
→ Check device settings and grant permission

---

## 📱 How Notifications Work in Expo Go

### Current User (Reporter):
When YOU submit a report:
- ✅ You see console logs
- ❌ You DON'T get notification (you're the reporter, not admin)

### Admin Users:
When someone else submits a report to your organization:
- ✅ Admins receive local notification (in Expo Go)
- ✅ Console shows: "Sending local notification to current user"
- ⚠️ Only works if admin is currently logged in with the app

### Expected Console Output:
```
🔔 Attempting to send notification to admins...
Organization ID: org_abc123
Report ID: report_xyz789
📨 notifyAdminsNewReport called with: {...}
👥 Found 2 admin(s) for organization org_abc123
📱 Expo Go: Sending local notification to current user
📱 Scheduling local notification: {title: "🟡 New Potholes Report", body: "..."}
✅ Local notification scheduled with ID: abc-123-def
✅ Admin notification sent successfully
```

---

## 🧪 Testing Checklist

### Test 1: Self-Test Notification
- [ ] Go to Help & Support
- [ ] Tap "Test Notifications"
- [ ] Grant permission if asked
- [ ] **Minimize the app** (home button)
- [ ] Check notification shade
- [ ] ✅ Should see test notification

### Test 2: Admin Notification
- [ ] Make yourself admin in Firestore
- [ ] Set your `organizationId`
- [ ] Submit a report to that organization
- [ ] **Minimize the app**
- [ ] Check notification shade
- [ ] ✅ Should see report notification

### Test 3: Check Logs
- [ ] Watch Metro console when submitting
- [ ] Should see: "📱 Scheduling local notification"
- [ ] Should see: "✅ Local notification scheduled"
- [ ] No errors about permissions

---

## ⚠️ Common Issues & Solutions

### Issue 1: "Permission not granted"
**Solution:**
```
Settings → Apps → Expo Go → Notifications → Enable
```

### Issue 2: Notification doesn't show but logs say success
**Possible Causes:**
1. **App is in foreground** → Minimize the app
2. **Do Not Disturb is ON** → Turn off DND mode
3. **Notification sounds muted** → Check volume
4. **Battery saver mode** → Disable battery optimization for Expo Go

**Android Specific:**
```
Settings → Apps → Expo Go → Battery → Unrestricted
```

### Issue 3: "No admins found for organization"
**Solution:**
```javascript
// In Firestore users collection:
{
  role: "admin",  // MUST be lowercase
  organizationId: "org_123"  // Must match exactly
}
```

### Issue 4: You're admin but don't see notifications
**Check:**
1. Are you logged in on the device?
2. Is the app running in background when notification sends?
3. Does your user document have correct `organizationId`?

---

## 📊 Debugging with Test Button

### Check Status Button:
Shows:
- Permission status
- Number of notification channels
- Platform (Android/iOS)

**Expected Output:**
```
Permission: granted
Can Schedule: Yes
Platform: android
Channels: 1
```

### Test Notifications Button:
- Requests permission if needed
- Sends immediate test notification
- Shows helpful tips if it fails

---

## 🚀 Production Build (Future)

**Important**: Expo Go has limitations. For **full push notification support**:

1. Build standalone app:
   ```bash
   eas build --platform android
   # or
   eas build --platform ios
   ```

2. In production builds:
   - Push notifications work properly
   - Foreground notifications appear
   - Push tokens are registered
   - Notifications work across devices
   - No need for users to be logged in simultaneously

---

## 📝 Files Modified

1. **src/services/notificationService.js**
   - Enhanced `sendLocalNotification()` with better error handling
   - Added `sendTestNotificationToSelf()` export
   - Improved permission checking
   - Higher priority for Android notifications

2. **src/components/NotificationTestButton.jsx** (NEW)
   - Test notification button component
   - Permission checking UI
   - Status checking functionality

3. **src/screens/Main/HelpSupportScreen.jsx**
   - Added notification test section at top
   - Easy access to test notifications

4. **src/utils/testNotification.js** (NEW)
   - Standalone test utilities
   - Can be used from any screen

---

## 🎯 Next Steps

1. **Test Now:**
   - Open app on your device
   - Go to Help & Support
   - Use the test button

2. **Grant Permissions:**
   - Allow notifications when prompted
   - Check device settings if needed

3. **Minimize App:**
   - After triggering notification
   - Wait in background
   - Check notification shade

4. **For Admin Testing:**
   - Update your user role in Firestore
   - Set organizationId
   - Submit a test report

5. **Production:**
   - Build standalone app when ready
   - Full notification support will work

---

## 💡 Pro Tips

1. **Always minimize app** when testing notifications in Expo Go
2. **Check Metro console** for detailed logs
3. **Use test button** before submitting real reports
4. **Verify admin setup** in Firestore before testing
5. **Keep app in background** for 2-3 seconds after submission

---

## 📞 Still Having Issues?

Check these in order:
1. Console logs show "✅ Local notification scheduled"?
2. App is minimized/in background?
3. Notifications enabled in device settings?
4. Do Not Disturb is OFF?
5. Test button works?

If test button works but report notifications don't:
→ Check admin `role` and `organizationId` in Firestore

If nothing works:
→ Share console logs from Metro bundler
→ Share screenshot of "Check Status" output
→ Share screenshot of your user document from Firestore
