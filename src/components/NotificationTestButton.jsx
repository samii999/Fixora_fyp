import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert, ActivityIndicator, View } from 'react-native';
import * as Notifications from 'expo-notifications';
import { sendTestNotificationToSelf } from '../services/notificationService';

/**
 * Test button component to verify notifications work
 * Add this to your Settings or Help screen for debugging
 */
const NotificationTestButton = () => {
  const [testing, setTesting] = useState(false);

  const handleTest = async () => {
    setTesting(true);
    try {
      console.log('🧪 Starting notification test...');
      
      // Check permissions
      const { status } = await Notifications.getPermissionsAsync();
      console.log('Permission status:', status);
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Notification permissions are needed. Please grant permission when prompted.',
          [
            {
              text: 'Request Permission',
              onPress: async () => {
                const { status: newStatus } = await Notifications.requestPermissionsAsync();
                console.log('New permission status:', newStatus);
                
                if (newStatus === 'granted') {
                  await testNotification();
                } else {
                  Alert.alert('Permission Denied', 'Please enable notifications in your device settings.');
                }
              }
            },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
        setTesting(false);
        return;
      }
      
      // Send test notification
      await testNotification();
      
    } catch (error) {
      console.error('Test error:', error);
      Alert.alert('Test Failed', error.message);
    } finally {
      setTesting(false);
    }
  };

  const testNotification = async () => {
    console.log('Sending test notification...');
    const result = await sendTestNotificationToSelf();
    
    if (result) {
      Alert.alert(
        'Test Sent!',
        'A notification should appear shortly.\n\n' +
        'If you don\'t see it:\n' +
        '• Swipe down to check notification shade\n' +
        '• Check device notification settings\n' +
        '• Notifications may not show while app is in foreground',
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert(
        'Test Failed',
        'Could not send notification. Check console logs for details.',
        [{ text: 'OK' }]
      );
    }
  };

  const checkStatus = async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      const channels = await Notifications.getNotificationChannelsAsync();
      
      Alert.alert(
        'Notification Status',
        `Permission: ${status}\n` +
        `Channels: ${channels?.length || 0}\n\n` +
        `Status must be "granted" for notifications to work.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.testButton}
        onPress={handleTest}
        disabled={testing}
      >
        {testing ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.testButtonText}>🔔 Test Notifications</Text>
        )}
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.statusButton}
        onPress={checkStatus}
      >
        <Text style={styles.statusButtonText}>Check Status</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  testButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  testButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  statusButton: {
    backgroundColor: '#F0F0F0',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  statusButtonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default NotificationTestButton;
