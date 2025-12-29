# 🔔 Notifications Not Showing on Expo Go - Quick Fix

## The Problem
Notifications log successfully but don't appear on your Expo Go mobile device.

## The Solution (3 Steps)

### ✅ Step 1: Use the Test Button
1. Open the app on your phone
2. Go to **Profile → Help & Support**  
3. Tap **"🔔 Test Notifications"** button
4. Grant permission when asked
5. **Press Home button** (minimize app)
6. Pull down notification shade
7. You should see the test notification!

### ✅ Step 2: Key Understanding
**CRITICAL**: In Expo Go, notifications DON'T show when app is in **foreground** (actively open).

**You MUST minimize the app** to see notifications!

### ✅ Step 3: For Admin Notifications
To receive notifications when reports are submitted:

1. Go to Firebase Console
2. Open Firestore → `users` collection
3. Find your user document
4. Update these fields:
   ```javascript
   role: "admin"              // lowercase!
   organizationId: "your_org_id"
   ```
5. Now submit a report to that organization
6. **Minimize the app immediately**
7. Wait 2-3 seconds
8. Check notification shade!

---

## Why This Happens

**Expo Go Limitations:**
- Foreground notifications don't display properly
- Local notifications only (not push)
- Must minimize app to see them

**Production builds** won't have this issue!

---

## Quick Checklist

When testing notifications:
- [ ] Permission granted? (Check in device settings)
- [ ] App minimized/in background?
- [ ] Do Not Disturb is OFF?
- [ ] Test button works?
- [ ] You're an admin? (Check Firestore)
- [ ] Correct `organizationId`? (Check Firestore)

---

## What We Fixed

✅ Enhanced notification permission checking  
✅ Added test notification button in Help & Support  
✅ Fixed admin notification logic for duplicate reports  
✅ Improved console logging for debugging  
✅ Higher priority notifications for Android  

---

## Console Output You Should See

```
🔔 Attempting to send notification to admins...
📨 notifyAdminsNewReport called with: {...}
👥 Found 1 admin(s) for organization...
📱 Expo Go: Sending local notification to current user
📱 Scheduling local notification: {...}
✅ Local notification scheduled with ID: xxx
✅ Admin notification sent successfully
```

If you see this, notifications ARE working! Just minimize the app to see them.

---

## Still Not Working?

1. **Try Test Button First**
   - If test works → Admin setup issue
   - If test fails → Permission issue

2. **Check Device Settings**
   ```
   Settings → Apps → Expo Go → Notifications → ON
   ```

3. **Check Firestore**
   - Your user has `role: "admin"`?
   - Your user has correct `organizationId`?

4. **Share These**
   - Console logs from Metro
   - "Check Status" button output
   - Screenshot of your Firestore user document

---

## Remember!
🎯 **Minimize the app after triggering notification**  
🎯 **Use the test button to verify permissions**  
🎯 **Production builds will work normally**
