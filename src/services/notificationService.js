import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { db } from '../config/firebaseConfig';
import { doc, updateDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Check if app is running in Expo Go
 */
const isExpoGo = () => {
  return Constants.appOwnership === 'expo';
};

/**
 * Register device for push notifications and save token to user profile
 * @param {string} userId - User ID
 * @returns {Promise<string|null>} - Push token or null if failed
 */
export const registerForPushNotifications = async (userId) => {
  try {
    // Skip push token registration in Expo Go (SDK 53+)
    if (isExpoGo()) {
      console.log('📱 Running in Expo Go - using local notifications only');
      console.log('ℹ️ Push notifications will work in production build');
      
      // Still request permissions for local notifications
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Notification permissions denied');
        return null;
      }
      
      // Configure notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }
      
      return 'expo-go-local';
    }

    if (!Device.isDevice) {
      console.log('Push notifications only work on physical devices');
      return null;
    }

    // Request permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token - permission denied');
      return null;
    }

    // Get push token
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log('Push token:', token);

    // Save token to user document
    if (userId) {
      await updateDoc(doc(db, 'users', userId), {
        pushToken: token,
        pushTokenUpdatedAt: new Date(),
      });
      console.log('Push token saved to user profile');
    }

    // Platform-specific configuration
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return token;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
};

/**
 * Send a local notification (for development/testing in Expo Go)
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {Object} data - Additional data
 * @returns {Promise<boolean>}
 */
const sendLocalNotification = async (title, body, data = {}) => {
  try {
    console.log('📱 Scheduling local notification:', { title, body });
    
    // Check permissions first
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      console.error('❌ Notification permission not granted:', status);
      return false;
    }
    
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: title,
        body: body,
        data: data,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        vibrate: [0, 250, 250, 250],
      },
      trigger: null, // Show immediately
    });
    
    console.log('✅ Local notification scheduled with ID:', identifier);
    return true;
  } catch (error) {
    console.error('❌ Error sending local notification:', error);
    console.error('Error details:', error.message);
    return false;
  }
};

/**
 * Send a test notification to current user (for testing)
 * @returns {Promise<boolean>}
 */
export const sendTestNotificationToSelf = async () => {
  try {
    console.log('🧪 Sending test notification...');
    
    const result = await sendLocalNotification(
      '🔔 Test Notification',
      'If you see this, notifications are working correctly!',
      { type: 'test', timestamp: Date.now() }
    );
    
    if (result) {
      console.log('✅ Test notification sent successfully');
    } else {
      console.log('❌ Test notification failed');
    }
    
    return result;
  } catch (error) {
    console.error('Error sending test notification:', error);
    return false;
  }
};

/**
 * Send a push notification to a specific user
 * @param {string} userId - Target user ID
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {Object} data - Additional data to send with notification
 * @param {string} currentUserId - Current logged in user ID (optional, for Expo Go filtering)
 * @returns {Promise<boolean>} - Success status
 */
export const sendNotificationToUser = async (userId, title, body, data = {}, currentUserId = null) => {
  try {
    // In Expo Go, use local notifications for testing
    if (isExpoGo()) {
      // Only send local notification if the target user is the current user
      if (currentUserId && userId === currentUserId) {
        console.log('📱 Expo Go: Sending local notification to current user');
        return await sendLocalNotification(title, body, data);
      } else {
        console.log(`📱 Expo Go: Skipping notification (target: ${userId}, current: ${currentUserId})`);
        return true; // Return success but don't send notification
      }
    }

    // Get user's push token
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      console.log('User not found:', userId);
      return false;
    }

    const pushToken = userDoc.data()?.pushToken;
    if (!pushToken) {
      console.log('User has no push token:', userId);
      return false;
    }

    // Send notification via Expo Push API
    const message = {
      to: pushToken,
      sound: 'default',
      title: title,
      body: body,
      data: data,
      priority: 'high',
    };

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();
    console.log('Notification sent:', result);
    return true;
  } catch (error) {
    console.error('Error sending notification:', error);
    return false;
  }
};

/**
 * Send notifications to multiple users
 * @param {Array<string>} userIds - Array of user IDs
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {Object} data - Additional data
 * @param {string} currentUserId - Current logged in user ID (optional, for Expo Go filtering)
 * @returns {Promise<Object>} - Success/failure counts
 */
export const sendNotificationToMultipleUsers = async (userIds, title, body, data = {}, currentUserId = null) => {
  try {
    // In Expo Go, only send local notification if current user is in the target list
    if (isExpoGo()) {
      if (currentUserId && userIds.includes(currentUserId)) {
        console.log('📱 Expo Go: Sending local notification to current user (one of multiple targets)');
        const success = await sendLocalNotification(title, body, data);
        return { successCount: success ? 1 : 0, failureCount: success ? 0 : 1, total: 1 };
      } else {
        console.log(`📱 Expo Go: Skipping notification (targets: ${userIds.join(',')}, current: ${currentUserId})`);
        return { successCount: 0, failureCount: 0, total: 0 };
      }
    }

    const results = await Promise.allSettled(
      userIds.map(userId => sendNotificationToUser(userId, title, body, data, currentUserId))
    );

    const successCount = results.filter(r => r.status === 'fulfilled' && r.value).length;
    const failureCount = results.length - successCount;

    console.log(`Notifications sent: ${successCount} succeeded, ${failureCount} failed`);
    return { successCount, failureCount, total: results.length };
  } catch (error) {
    console.error('Error sending notifications to multiple users:', error);
    return { successCount: 0, failureCount: userIds.length, total: userIds.length };
  }
};

/**
 * Get all admin users for an organization
 * @param {string} organizationId - Organization ID
 * @returns {Promise<Array<string>>} - Array of admin user IDs
 */
export const getOrganizationAdmins = async (organizationId) => {
  try {
    const q = query(
      collection(db, 'users'),
      where('role', '==', 'admin'),
      where('organizationId', '==', organizationId)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.id);
  } catch (error) {
    console.error('Error fetching organization admins:', error);
    return [];
  }
};

/**
 * Notify admins when a new report is submitted
 * @param {string} reportId - Report ID
 * @param {string} organizationId - Organization ID
 * @param {string} category - Report category
 * @param {string} urgency - Report urgency
 * @param {string} currentUserId - Current user ID (the one who submitted the report)
 */
export const notifyAdminsNewReport = async (reportId, organizationId, category, urgency, currentUserId = null) => {
  try {
    console.log('📨 notifyAdminsNewReport called with:', {
      reportId,
      organizationId,
      category,
      urgency,
      currentUserId
    });
    
    const adminIds = await getOrganizationAdmins(organizationId);
    console.log(`👥 Found ${adminIds.length} admin(s) for organization ${organizationId}:`, adminIds);
    
    if (adminIds.length === 0) {
      console.warn('⚠️ No admins found for organization:', organizationId);
      console.warn('ℹ️ Check that admins have role="admin" and organizationId set correctly');
      throw new Error(`No admins found for organization ${organizationId}`);
    }

    const urgencyEmoji = urgency === 'High' ? '🔴' : urgency === 'Medium' ? '🟡' : '🟢';
    const title = `${urgencyEmoji} New ${category} Report`;
    const body = `A new ${urgency.toLowerCase()} priority ${category.toLowerCase()} report has been submitted.`;
    
    console.log('📤 Sending notifications to admins...');
    const result = await sendNotificationToMultipleUsers(adminIds, title, body, {
      type: 'new_report',
      reportId,
      organizationId,
      urgency,
    }, currentUserId);
    
    console.log('✅ Notification result:', result);
    return result;
  } catch (error) {
    console.error('❌ Error notifying admins of new report:', error);
    console.error('Error stack:', error.stack);
    throw error; // Re-throw to let caller handle it
  }
};

/**
 * Notify staff when assigned to a report
 * @param {string} reportId - Report ID
 * @param {Array<string>} staffIds - Array of staff user IDs
 * @param {string} category - Report category
 * @param {string} address - Report address
 * @param {string} currentUserId - Current user ID (the admin who assigned)
 */
export const notifyStaffAssignment = async (reportId, staffIds, category, address, currentUserId = null) => {
  try {
    const title = '📋 New Assignment';
    const body = `You've been assigned to a ${category.toLowerCase()} report at ${address}.`;
    
    await sendNotificationToMultipleUsers(staffIds, title, body, {
      type: 'assignment',
      reportId,
    }, currentUserId);
  } catch (error) {
    console.error('Error notifying staff of assignment:', error);
  }
};

/**
 * Notify admins when staff uploads proof of work
 * @param {string} reportId - Report ID
 * @param {string} organizationId - Organization ID
 * @param {string} staffName - Name of staff who uploaded proof
 * @param {string} category - Report category
 * @param {string} currentUserId - Current user ID (the staff who uploaded)
 */
export const notifyAdminsProofUploaded = async (reportId, organizationId, staffName, category, currentUserId = null) => {
  try {
    const adminIds = await getOrganizationAdmins(organizationId);
    
    if (adminIds.length === 0) {
      console.log('No admins found for organization:', organizationId);
      return;
    }

    const title = '📸 Proof of Work Uploaded';
    const body = `${staffName} has uploaded proof for a ${category.toLowerCase()} report.`;
    
    await sendNotificationToMultipleUsers(adminIds, title, body, {
      type: 'proof_uploaded',
      reportId,
      organizationId,
    }, currentUserId);
  } catch (error) {
    console.error('Error notifying admins of proof upload:', error);
  }
};

/**
 * Notify user when their report is resolved
 * @param {string} userId - User ID who submitted the report
 * @param {string} reportId - Report ID
 * @param {string} category - Report category
 * @param {string} address - Report address
 * @param {string} currentUserId - Current user ID (the admin who resolved)
 */
export const notifyUserReportResolved = async (userId, reportId, category, address, currentUserId = null) => {
  try {
    const title = '✅ Report Resolved';
    const body = `Your ${category.toLowerCase()} report at ${address} has been marked as resolved!`;
    
    await sendNotificationToUser(userId, title, body, {
      type: 'report_resolved',
      reportId,
    }, currentUserId);
  } catch (error) {
    console.error('Error notifying user of resolution:', error);
  }
};

/**
 * Notify user when staff starts working on their report
 * @param {string} userId - User ID who submitted the report
 * @param {string} reportId - Report ID
 * @param {string} category - Report category
 * @param {string} currentUserId - Current user ID (the staff who started)
 */
export const notifyUserReportInProgress = async (userId, reportId, category, currentUserId = null) => {
  try {
    const title = '🔨 Work In Progress';
    const body = `Staff has started working on your ${category.toLowerCase()} report.`;
    
    await sendNotificationToUser(userId, title, body, {
      type: 'report_in_progress',
      reportId,
    }, currentUserId);
  } catch (error) {
    console.error('Error notifying user of progress:', error);
  }
};

/**
 * Setup notification listeners
 * @param {Function} onNotificationReceived - Callback when notification is received
 * @param {Function} onNotificationTapped - Callback when notification is tapped
 * @returns {Function} - Cleanup function
 */
export const setupNotificationListeners = (onNotificationReceived, onNotificationTapped) => {
  // Listener for notifications received while app is in foreground
  const receivedSubscription = Notifications.addNotificationReceivedListener(notification => {
    console.log('Notification received:', notification);
    if (onNotificationReceived) {
      onNotificationReceived(notification);
    }
  });

  // Listener for notification tapped by user
  const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
    console.log('Notification tapped:', response);
    if (onNotificationTapped) {
      onNotificationTapped(response.notification);
    }
  });

  // Return cleanup function
  return () => {
    receivedSubscription.remove();
    responseSubscription.remove();
  };
};

export default {
  registerForPushNotifications,
  sendNotificationToUser,
  sendNotificationToMultipleUsers,
  notifyAdminsNewReport,
  notifyStaffAssignment,
  notifyAdminsProofUploaded,
  notifyUserReportResolved,
  notifyUserReportInProgress,
  setupNotificationListeners,
  sendTestNotificationToSelf,
};
