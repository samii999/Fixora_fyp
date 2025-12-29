import * as Notifications from 'expo-notifications';
import { Alert, Platform } from 'react-native';

/**
 * Test notification function to verify notifications work on device
 * Call this from any screen to test if notifications are properly configured
 */
export const sendTestNotification = async () => {
  try {
    console.log('🧪 Testing notification...');
    
    // Check permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    console.log('Current permission status:', existingStatus);
    
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      console.log('Requesting notification permissions...');
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
      console.log('Permission request result:', status);
    }
    
    if (finalStatus !== 'granted') {
      Alert.alert(
        'Permission Denied',
        'Notification permissions are required. Please enable them in your device settings.',
        [
          { text: 'OK' }
        ]
      );
      return false;
    }
    
    console.log('✅ Permissions granted, scheduling test notification...');
    
    // Schedule immediate notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🔔 Test Notification',
        body: 'If you see this, notifications are working!',
        data: { test: true },
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        vibrate: [0, 250, 250, 250],
      },
      trigger: null, // Show immediately
    });
    
    console.log('✅ Test notification scheduled');
    
    Alert.alert(
      'Test Notification Sent',
      'Check if you received a notification. If you don\'t see it:\n\n' +
      '1. Make sure notifications are enabled in device settings\n' +
      '2. The app might need to be in background\n' +
      '3. Try pulling down notification shade',
      [{ text: 'OK' }]
    );
    
    return true;
  } catch (error) {
    console.error('❌ Test notification error:', error);
    Alert.alert(
      'Test Failed',
      `Error: ${error.message}\n\nCheck console for details.`
    );
    return false;
  }
};

/**
 * Test local notification with custom message
 */
export const sendCustomTestNotification = async (title, body) => {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    
    if (status !== 'granted') {
      console.log('Permissions not granted');
      return false;
    }
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: title,
        body: body,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null,
    });
    
    console.log('📱 Custom test notification sent:', title);
    return true;
  } catch (error) {
    console.error('Error sending custom test notification:', error);
    return false;
  }
};

/**
 * Check notification settings and display status
 */
export const checkNotificationStatus = async () => {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    const canSchedule = await Notifications.getNotificationChannelsAsync();
    
    const statusInfo = {
      permissionStatus: status,
      canScheduleNotifications: status === 'granted',
      platform: Platform.OS,
      channels: canSchedule || []
    };
    
    console.log('📊 Notification Status:', statusInfo);
    
    Alert.alert(
      'Notification Status',
      `Permission: ${status}\n` +
      `Can Schedule: ${status === 'granted' ? 'Yes' : 'No'}\n` +
      `Platform: ${Platform.OS}\n` +
      `Channels: ${canSchedule?.length || 0}`,
      [{ text: 'OK' }]
    );
    
    return statusInfo;
  } catch (error) {
    console.error('Error checking notification status:', error);
    return null;
  }
};
