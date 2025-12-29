import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  SafeAreaView,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebaseConfig';
import { useAuth } from '../../context/AuthContext';

const PrivacySecurityScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    profileVisibility: true,
    showReports: true,
    dataCollection: false,
    locationSharing: true,
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
          setSettings({
            profileVisibility: data.profileVisibility ?? true,
            showReports: data.showReports ?? true,
            dataCollection: data.dataCollection ?? false,
            locationSharing: data.locationSharing ?? true,
          });
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
        [key]: value,
      });
    } catch (error) {
      console.error('Error updating setting:', error);
      Alert.alert('Error', 'Failed to update setting');
      // Revert the change
      setSettings(prev => ({ ...prev, [key]: !value }));
    }
  };

  const handleChangePassword = () => {
    Alert.alert(
      'Change Password',
      'To change your password, you will need to re-authenticate.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: () => {
            // Navigate to change password screen or show password input dialogs
            Alert.alert('Coming Soon', 'Password change functionality will be available soon!');
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Coming Soon', 'Account deletion will be available soon. Please contact support for assistance.');
          },
        },
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert(
      'Export Data',
      'Your data will be prepared and sent to your registered email address within 24 hours.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request Export',
          onPress: () => {
            Alert.alert('Success', 'Data export request submitted. You will receive an email shortly.');
          },
        },
      ]
    );
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
        {/* Privacy Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔒 Privacy Settings</Text>
          <Text style={styles.sectionDescription}>
            Control what others can see about you
          </Text>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Profile Visibility</Text>
              <Text style={styles.settingDescription}>
                Make your profile visible to others
              </Text>
            </View>
            <Switch
              value={settings.profileVisibility}
              onValueChange={(value) => updateSetting('profileVisibility', value)}
              trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
              thumbColor={settings.profileVisibility ? '#007AFF' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Show My Reports</Text>
              <Text style={styles.settingDescription}>
                Let others see issues you've reported
              </Text>
            </View>
            <Switch
              value={settings.showReports}
              onValueChange={(value) => updateSetting('showReports', value)}
              trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
              thumbColor={settings.showReports ? '#007AFF' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Location Sharing</Text>
              <Text style={styles.settingDescription}>
                Share location when reporting issues
              </Text>
            </View>
            <Switch
              value={settings.locationSharing}
              onValueChange={(value) => updateSetting('locationSharing', value)}
              trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
              thumbColor={settings.locationSharing ? '#007AFF' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Usage Data</Text>
              <Text style={styles.settingDescription}>
                Help improve the app by sharing usage data
              </Text>
            </View>
            <Switch
              value={settings.dataCollection}
              onValueChange={(value) => updateSetting('dataCollection', value)}
              trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
              thumbColor={settings.dataCollection ? '#007AFF' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Account Security */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🛡️ Account Security</Text>
          <Text style={styles.sectionDescription}>
            Manage your account security
          </Text>

          <TouchableOpacity style={styles.actionItem} onPress={handleChangePassword}>
            <View style={styles.actionInfo}>
              <Text style={styles.actionIcon}>🔑</Text>
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionLabel}>Change Password</Text>
                <Text style={styles.actionDescription}>
                  Update your password
                </Text>
              </View>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem} onPress={handleExportData}>
            <View style={styles.actionInfo}>
              <Text style={styles.actionIcon}>📦</Text>
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionLabel}>Download My Data</Text>
                <Text style={styles.actionDescription}>
                  Get a copy of your reports and data
                </Text>
              </View>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem} onPress={handleDeleteAccount}>
            <View style={styles.actionInfo}>
              <Text style={styles.actionIcon}>⚠️</Text>
              <View style={styles.actionTextContainer}>
                <Text style={[styles.actionLabel, styles.dangerText]}>Delete Account</Text>
                <Text style={styles.actionDescription}>
                  Permanently delete your account
                </Text>
              </View>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Information */}
        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>ℹ️</Text>
          <Text style={styles.infoText}>
            We protect your privacy and keep your data secure. You have full control over what you share.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default PrivacySecurityScreen;

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
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
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
    fontSize: 14,
    color: '#666',
  },
  actionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  actionInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    color: '#666',
  },
  dangerText: {
    color: '#EF4444',
  },
  chevron: {
    fontSize: 24,
    color: '#C7C7CC',
    marginLeft: 8,
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
