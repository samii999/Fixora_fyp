import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  SafeAreaView,
  Switch,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebaseConfig';
import { useAuth } from '../../context/AuthContext';

const NotificationSettingsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    // My Reports
    reportStatusUpdates: true,
    reportComments: true,
    reportResolved: true,
    
    // General
    systemUpdates: false,
    news: false,
    
    // Methods
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
      if (user) {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const savedSettings = data.notificationSettings || {};
          setSettings(prev => ({ ...prev, ...savedSettings }));
        }
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
      Alert.alert('Error', 'Failed to update notification setting');
      // Revert the change
      setSettings(prev => ({ ...prev, [key]: !value }));
    }
  };

  const enableAll = async () => {
    const allEnabled = {};
    Object.keys(settings).forEach(key => {
      allEnabled[key] = true;
    });
    
    try {
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

  const disableAll = async () => {
    const allDisabled = {};
    Object.keys(settings).forEach(key => {
      allDisabled[key] = false;
    });
    
    try {
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
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickButton} onPress={enableAll}>
            <Text style={styles.quickButtonText}>Enable All</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.quickButton, styles.disableButton]} onPress={disableAll}>
            <Text style={[styles.quickButtonText, styles.disableButtonText]}>Disable All</Text>
          </TouchableOpacity>
        </View>

        {/* My Reports */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 My Reports</Text>
          <Text style={styles.sectionDescription}>
            Get notified about updates to your reported issues
          </Text>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Status Updates</Text>
              <Text style={styles.settingDescription}>
                When your report status changes
              </Text>
            </View>
            <Switch
              value={settings.reportStatusUpdates}
              onValueChange={(value) => updateSetting('reportStatusUpdates', value)}
              trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
              thumbColor={settings.reportStatusUpdates ? '#007AFF' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Comments & Replies</Text>
              <Text style={styles.settingDescription}>
                When someone comments on your reports
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
              <Text style={styles.settingLabel}>Issue Resolved</Text>
              <Text style={styles.settingDescription}>
                When your report is resolved
              </Text>
            </View>
            <Switch
              value={settings.reportResolved}
              onValueChange={(value) => updateSetting('reportResolved', value)}
              trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
              thumbColor={settings.reportResolved ? '#007AFF' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* General */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔔 General</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>System Updates</Text>
              <Text style={styles.settingDescription}>
                Important app updates and maintenance notices
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
                Updates about new features
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
          <Text style={styles.sectionTitle}>📱 Notification Methods</Text>
          <Text style={styles.sectionDescription}>
            Choose how you receive notifications
          </Text>

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
                Receive notifications via text message
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

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>ℹ️</Text>
          <Text style={styles.infoText}>
            You can customize which notifications you receive. Make sure push notifications are enabled in your device settings.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default NotificationSettingsScreen;

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
    borderRadius: 8,
    alignItems: 'center',
  },
  disableButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E1E5E9',
  },
  quickButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  disableButtonText: {
    color: '#666',
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
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
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
    lineHeight: 18,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#E8F4FD',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#0066CC',
    lineHeight: 20,
  },
});
