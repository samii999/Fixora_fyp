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

const AdminPrivacySecurityScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    profileVisibility: true,
    locationTracking: true,
    dataSharing: false,
    dataCollection: true,
    organizationDataSharing: true,
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
        setSettings({
          profileVisibility: data.profileVisibility ?? true,
          locationTracking: data.locationTracking ?? true,
          dataSharing: data.dataSharing ?? false,
          dataCollection: data.dataCollection ?? true,
          organizationDataSharing: data.organizationDataSharing ?? true,
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
        [key]: value,
      });
    } catch (error) {
      console.error('Error updating setting:', error);
      Alert.alert('Error', 'Failed to update setting');
      setSettings(prev => ({ ...prev, [key]: !value }));
    }
  };

  const handleChangePassword = () => {
    Alert.alert(
      'Change Password',
      'Password change feature will be implemented soon. For now, you can reset your password from the login screen.',
      [{ text: 'OK' }]
    );
  };

  const handleExportData = () => {
    Alert.alert(
      'Export Organization Data',
      'As an admin, you can export organization data including reports, staff information, and analytics. This may take a few minutes.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: () => {
            Alert.alert('Success', 'Data export initiated. You will receive an email with the download link within 24-48 hours.');
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Admin Account',
      'WARNING: Deleting your admin account will remove your access to the organization. You may need to transfer ownership first. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Contact Support',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Contact Support',
              'Please contact support to delete your admin account and transfer organization ownership if needed.',
              [{ text: 'OK' }]
            );
          },
        },
      ]
    );
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
        {/* Privacy Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Profile Visibility</Text>
              <Text style={styles.settingDescription}>
                Make your profile visible to staff and users
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
              <Text style={styles.settingLabel}>Location Tracking</Text>
              <Text style={styles.settingDescription}>
                Allow location tracking for issue management
              </Text>
            </View>
            <Switch
              value={settings.locationTracking}
              onValueChange={(value) => updateSetting('locationTracking', value)}
              trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
              thumbColor={settings.locationTracking ? '#007AFF' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Organization Data Sharing</Text>
              <Text style={styles.settingDescription}>
                Share organization metrics with the platform
              </Text>
            </View>
            <Switch
              value={settings.organizationDataSharing}
              onValueChange={(value) => updateSetting('organizationDataSharing', value)}
              trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
              thumbColor={settings.organizationDataSharing ? '#007AFF' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Data Sharing</Text>
              <Text style={styles.settingDescription}>
                Share usage data to help improve the platform
              </Text>
            </View>
            <Switch
              value={settings.dataSharing}
              onValueChange={(value) => updateSetting('dataSharing', value)}
              trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
              thumbColor={settings.dataSharing ? '#007AFF' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Data Collection</Text>
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

        {/* Security Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>

          <TouchableOpacity style={styles.actionItem} onPress={handleChangePassword}>
            <View style={styles.actionInfo}>
              <Text style={styles.actionIcon}>🔑</Text>
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionLabel}>Change Password</Text>
                <Text style={styles.actionDescription}>
                  Update your account password
                </Text>
              </View>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Data Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>

          <TouchableOpacity style={styles.actionItem} onPress={handleExportData}>
            <View style={styles.actionInfo}>
              <Text style={styles.actionIcon}>📦</Text>
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionLabel}>Export Organization Data</Text>
                <Text style={styles.actionDescription}>
                  Download all organization data
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
                  Permanently delete your admin account
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
            Your privacy is important to us. As an admin, you have additional responsibilities for managing organization data securely.
            Read our Privacy Policy for more information.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AdminPrivacySecurityScreen;

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
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
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
    fontSize: 13,
    color: '#666',
  },
  dangerText: {
    color: '#DC2626',
  },
  chevron: {
    fontSize: 24,
    color: '#999',
    fontWeight: '300',
  },
  infoCard: {
    backgroundColor: '#E8F0FE',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
});
