import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Switch,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebaseConfig';
import { useAuth } from '../../context/AuthContext';

const StaffNotificationSettingsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    // Task Notifications
    taskAssigned: true,
    taskDeadline: true,
    taskComments: true,
    taskStatusChange: true,
    
    // Work Schedule
    shiftReminders: true,
    scheduleChanges: true,
    
    // General
    systemUpdates: false,
    news: false,
    
    // Notification Methods
    pushEnabled: true,
    emailEnabled: true,
    smsEnabled: false,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        const notificationSettings = data.notificationSettings || {};
        setSettings({
          taskAssigned: notificationSettings.taskAssigned ?? true,
          taskDeadline: notificationSettings.taskDeadline ?? true,
          taskComments: notificationSettings.taskComments ?? true,
          taskStatusChange: notificationSettings.taskStatusChange ?? true,
          shiftReminders: notificationSettings.shiftReminders ?? true,
          scheduleChanges: notificationSettings.scheduleChanges ?? true,
          systemUpdates: notificationSettings.systemUpdates ?? false,
          news: notificationSettings.news ?? false,
          pushEnabled: notificationSettings.pushEnabled ?? true,
          emailEnabled: notificationSettings.emailEnabled ?? true,
          smsEnabled: notificationSettings.smsEnabled ?? false,
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key, value) => {
    try {
      setSettings(prev => ({ ...prev, [key]: value }));
      await updateDoc(doc(db, 'users', user.uid), {
        [`notificationSettings.${key}`]: value,
      });
    } catch (error) {
      console.error('Error updating setting:', error);
      Alert.alert('Error', 'Failed to update setting');
      setSettings(prev => ({ ...prev, [key]: !value }));
    }
  };

  const enableAllNotifications = async () => {
    try {
      const allEnabled = {
        taskAssigned: true,
        taskDeadline: true,
        taskComments: true,
        taskStatusChange: true,
        shiftReminders: true,
        scheduleChanges: true,
        systemUpdates: true,
        news: true,
        pushEnabled: true,
        emailEnabled: true,
        smsEnabled: true,
      };
      setSettings(allEnabled);
      await updateDoc(doc(db, 'users', user.uid), {
        notificationSettings: allEnabled,
      });
      Alert.alert('Success', 'All notifications enabled');
    } catch (error) {
      console.error('Error enabling all:', error);
      Alert.alert('Error', 'Failed to update settings');
    }
  };

  const disableAllNotifications = async () => {
    try {
      const allDisabled = {
        taskAssigned: false,
        taskDeadline: false,
        taskComments: false,
        taskStatusChange: false,
        shiftReminders: false,
        scheduleChanges: false,
        systemUpdates: false,
        news: false,
        pushEnabled: false,
        emailEnabled: false,
        smsEnabled: false,
      };
      setSettings(allDisabled);
      await updateDoc(doc(db, 'users', user.uid), {
        notificationSettings: allDisabled,
      });
      Alert.alert('Success', 'All notifications disabled');
    } catch (error) {
      console.error('Error disabling all:', error);
      Alert.alert('Error', 'Failed to update settings');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading settings...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickButton}
            onPress={enableAllNotifications}
          >
            <Text style={styles.quickButtonText}>Enable All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickButton, styles.quickButtonSecondary]}
            onPress={disableAllNotifications}
          >
            <Text style={styles.quickButtonTextSecondary}>Disable All</Text>
          </TouchableOpacity>
        </View>

        {/* Task Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Task Notifications</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Task Assigned</Text>
              <Text style={styles.settingDescription}>
                When a new task is assigned to you
              </Text>
            </View>
            <Switch
              value={settings.taskAssigned}
              onValueChange={(value) => updateSetting('taskAssigned', value)}
              trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
              thumbColor={settings.taskAssigned ? '#007AFF' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Deadline Reminders</Text>
              <Text style={styles.settingDescription}>
                Reminders before task deadlines
              </Text>
            </View>
            <Switch
              value={settings.taskDeadline}
              onValueChange={(value) => updateSetting('taskDeadline', value)}
              trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
              thumbColor={settings.taskDeadline ? '#007AFF' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Comments & Updates</Text>
              <Text style={styles.settingDescription}>
                When someone comments on your tasks
              </Text>
            </View>
            <Switch
              value={settings.taskComments}
              onValueChange={(value) => updateSetting('taskComments', value)}
              trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
              thumbColor={settings.taskComments ? '#007AFF' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Status Changes</Text>
              <Text style={styles.settingDescription}>
                When task status is updated
              </Text>
            </View>
            <Switch
              value={settings.taskStatusChange}
              onValueChange={(value) => updateSetting('taskStatusChange', value)}
              trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
              thumbColor={settings.taskStatusChange ? '#007AFF' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Work Schedule */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Work Schedule</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Shift Reminders</Text>
              <Text style={styles.settingDescription}>
                Reminders before your shifts
              </Text>
            </View>
            <Switch
              value={settings.shiftReminders}
              onValueChange={(value) => updateSetting('shiftReminders', value)}
              trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
              thumbColor={settings.shiftReminders ? '#007AFF' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Schedule Changes</Text>
              <Text style={styles.settingDescription}>
                When your work schedule is updated
              </Text>
            </View>
            <Switch
              value={settings.scheduleChanges}
              onValueChange={(value) => updateSetting('scheduleChanges', value)}
              trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
              thumbColor={settings.scheduleChanges ? '#007AFF' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* General Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>General</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>System Updates</Text>
              <Text style={styles.settingDescription}>
                Important system updates and maintenance
              </Text>
            </View>
            <Switch
              value={settings.systemUpdates}
              onValueChange={(value) => updateSetting('systemUpdates', value)}
              trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
              thumbColor={settings.systemUpdates ? '#007AFF' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>News & Announcements</Text>
              <Text style={styles.settingDescription}>
                Organization news and announcements
              </Text>
            </View>
            <Switch
              value={settings.news}
              onValueChange={(value) => updateSetting('news', value)}
              trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
              thumbColor={settings.news ? '#007AFF' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Notification Methods */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Methods</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Push Notifications</Text>
              <Text style={styles.settingDescription}>
                Receive notifications on your device
              </Text>
            </View>
            <Switch
              value={settings.pushEnabled}
              onValueChange={(value) => updateSetting('pushEnabled', value)}
              trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
              thumbColor={settings.pushEnabled ? '#007AFF' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Email Notifications</Text>
              <Text style={styles.settingDescription}>
                Receive notifications via email
              </Text>
            </View>
            <Switch
              value={settings.emailEnabled}
              onValueChange={(value) => updateSetting('emailEnabled', value)}
              trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
              thumbColor={settings.emailEnabled ? '#007AFF' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>SMS Notifications</Text>
              <Text style={styles.settingDescription}>
                Receive notifications via SMS
              </Text>
            </View>
            <Switch
              value={settings.smsEnabled}
              onValueChange={(value) => updateSetting('smsEnabled', value)}
              trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
              thumbColor={settings.smsEnabled ? '#007AFF' : '#f4f3f4'}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default StaffNotificationSettingsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#007AFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: '#F8F9FA',
    flexGrow: 1,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  quickButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  quickButtonSecondary: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  quickButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  quickButtonTextSecondary: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: '#666',
  },
});
