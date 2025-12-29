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

const AdminNotificationSettingsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    // Report Notifications
    newReports: true,
    reportStatusChange: true,
    reportComments: true,
    reportAssignment: true,
    urgentReports: true,
    
    // Staff Notifications
    staffJoinRequests: true,
    staffTaskCompletion: true,
    staffMessages: true,
    
    // Organization
    feedbackReceived: true,
    analyticsReports: false,
    systemAlerts: true,
    
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
          newReports: notificationSettings.newReports ?? true,
          reportStatusChange: notificationSettings.reportStatusChange ?? true,
          reportComments: notificationSettings.reportComments ?? true,
          reportAssignment: notificationSettings.reportAssignment ?? true,
          urgentReports: notificationSettings.urgentReports ?? true,
          staffJoinRequests: notificationSettings.staffJoinRequests ?? true,
          staffTaskCompletion: notificationSettings.staffTaskCompletion ?? true,
          staffMessages: notificationSettings.staffMessages ?? true,
          feedbackReceived: notificationSettings.feedbackReceived ?? true,
          analyticsReports: notificationSettings.analyticsReports ?? false,
          systemAlerts: notificationSettings.systemAlerts ?? true,
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
        newReports: true,
        reportStatusChange: true,
        reportComments: true,
        reportAssignment: true,
        urgentReports: true,
        staffJoinRequests: true,
        staffTaskCompletion: true,
        staffMessages: true,
        feedbackReceived: true,
        analyticsReports: true,
        systemAlerts: true,
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
        newReports: false,
        reportStatusChange: false,
        reportComments: false,
        reportAssignment: false,
        urgentReports: false,
        staffJoinRequests: false,
        staffTaskCompletion: false,
        staffMessages: false,
        feedbackReceived: false,
        analyticsReports: false,
        systemAlerts: false,
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

        {/* Report Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Report Notifications</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>New Reports</Text>
              <Text style={styles.settingDescription}>
                When new issues are reported in your area
              </Text>
            </View>
            <Switch
              value={settings.newReports}
              onValueChange={(value) => updateSetting('newReports', value)}
              trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
              thumbColor={settings.newReports ? '#007AFF' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Status Changes</Text>
              <Text style={styles.settingDescription}>
                When report status is updated
              </Text>
            </View>
            <Switch
              value={settings.reportStatusChange}
              onValueChange={(value) => updateSetting('reportStatusChange', value)}
              trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
              thumbColor={settings.reportStatusChange ? '#007AFF' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Comments</Text>
              <Text style={styles.settingDescription}>
                When someone comments on reports
              </Text>
            </View>
            <Switch
              value={settings.reportComments}
              onValueChange={(value) => updateSetting('reportComments', value)}
              trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
              thumbColor={settings.reportComments ? '#007AFF' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Report Assignments</Text>
              <Text style={styles.settingDescription}>
                When reports are assigned to staff
              </Text>
            </View>
            <Switch
              value={settings.reportAssignment}
              onValueChange={(value) => updateSetting('reportAssignment', value)}
              trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
              thumbColor={settings.reportAssignment ? '#007AFF' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Urgent Reports</Text>
              <Text style={styles.settingDescription}>
                Priority alerts for urgent issues
              </Text>
            </View>
            <Switch
              value={settings.urgentReports}
              onValueChange={(value) => updateSetting('urgentReports', value)}
              trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
              thumbColor={settings.urgentReports ? '#007AFF' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Staff Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Staff Management</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Join Requests</Text>
              <Text style={styles.settingDescription}>
                When staff request to join organization
              </Text>
            </View>
            <Switch
              value={settings.staffJoinRequests}
              onValueChange={(value) => updateSetting('staffJoinRequests', value)}
              trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
              thumbColor={settings.staffJoinRequests ? '#007AFF' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Task Completion</Text>
              <Text style={styles.settingDescription}>
                When staff complete assigned tasks
              </Text>
            </View>
            <Switch
              value={settings.staffTaskCompletion}
              onValueChange={(value) => updateSetting('staffTaskCompletion', value)}
              trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
              thumbColor={settings.staffTaskCompletion ? '#007AFF' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Staff Messages</Text>
              <Text style={styles.settingDescription}>
                Messages from staff members
              </Text>
            </View>
            <Switch
              value={settings.staffMessages}
              onValueChange={(value) => updateSetting('staffMessages', value)}
              trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
              thumbColor={settings.staffMessages ? '#007AFF' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Organization */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Organization</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Feedback Received</Text>
              <Text style={styles.settingDescription}>
                User feedback and ratings
              </Text>
            </View>
            <Switch
              value={settings.feedbackReceived}
              onValueChange={(value) => updateSetting('feedbackReceived', value)}
              trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
              thumbColor={settings.feedbackReceived ? '#007AFF' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Analytics Reports</Text>
              <Text style={styles.settingDescription}>
                Weekly and monthly analytics summaries
              </Text>
            </View>
            <Switch
              value={settings.analyticsReports}
              onValueChange={(value) => updateSetting('analyticsReports', value)}
              trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
              thumbColor={settings.analyticsReports ? '#007AFF' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>System Alerts</Text>
              <Text style={styles.settingDescription}>
                Critical system alerts and issues
              </Text>
            </View>
            <Switch
              value={settings.systemAlerts}
              onValueChange={(value) => updateSetting('systemAlerts', value)}
              trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
              thumbColor={settings.systemAlerts ? '#007AFF' : '#f4f3f4'}
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
                Platform updates and new features
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
                Platform news and announcements
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

export default AdminNotificationSettingsScreen;

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
