import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Alert,
  SafeAreaView,
  Image
} from 'react-native';
import { signOut } from 'firebase/auth';
import { auth, db } from '../../config/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

const UserProfileScreen = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user, userRole } = useAuth();
  const navigation = useNavigation();

  const fetchUserData = async () => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const docRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserData(docSnap.data());
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  // Refetch user data when screen comes into focus (e.g., returning from settings)
  useFocusEffect(
    useCallback(() => {
      fetchUserData();
    }, [])
  );

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut(auth);
            } catch (error) {
              console.error('Error signing out:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleSettingPress = (setting) => {
    switch (setting) {
      case 'account':
        // Admin uses AdminAccountSettings, regular users use AccountSettings
        if (userRole === 'admin') {
          navigation.navigate('AdminAccountSettings');
        } else {
          navigation.navigate('AccountSettings');
        }
        break;
      case 'notifications':
        if (userRole === 'admin') {
          navigation.navigate('AdminNotificationSettings');
        } else {
          navigation.navigate('NotificationSettings');
        }
        break;
      case 'privacy':
        if (userRole === 'admin') {
          navigation.navigate('AdminPrivacySecurity');
        } else {
          navigation.navigate('PrivacySecurity');
        }
        break;
      case 'organization':
        navigation.navigate('OrganizationSettings');
        break;
      case 'permissions':
        navigation.navigate('AssignPermissions');
        break;
      case 'feedback':
        navigation.navigate('FeedbackDashboard');
        break;
      case 'help':
        if (userRole === 'admin') {
          navigation.navigate('AdminHelpSupport');
        } else {
          navigation.navigate('HelpSupport');
        }
        break;
      case 'about':
        Alert.alert('About', 'Fixora v1.0.0\nIssue Management System');
        break;
      default:
        break;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  if (!userData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>User data not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          {userData.profileImage ? (
            <Image
              source={{ uri: userData.profileImage }}
              style={styles.profileImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>
                {userData.email?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
          )}
          <Text style={styles.userName}>{userData.email}</Text>
          <Text style={styles.userRole}>
            {userRole === 'admin' ? 'Administrator' : 
             userRole === 'staff' ? 'Staff Member' : 
             userRole?.charAt(0).toUpperCase() + userRole?.slice(1) || 'User'}
          </Text>
        </View>

        {/* Settings Menu */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <TouchableOpacity 
            style={styles.settingItem} 
            onPress={() => handleSettingPress('account')}
          >
            <View style={styles.settingLeft}>
              <Text style={styles.settingIcon}>👤</Text>
              <Text style={styles.settingText}>Account Settings</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingItem} 
            onPress={() => handleSettingPress('notifications')}
          >
            <View style={styles.settingLeft}>
              <Text style={styles.settingIcon}>🔔</Text>
              <Text style={styles.settingText}>Notifications</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingItem} 
            onPress={() => handleSettingPress('privacy')}
          >
            <View style={styles.settingLeft}>
              <Text style={styles.settingIcon}>🔒</Text>
              <Text style={styles.settingText}>Privacy & Security</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          {/* Admin-specific settings */}
          {userRole === 'admin' && (
            <>
              <TouchableOpacity 
                style={styles.settingItem} 
                onPress={() => handleSettingPress('organization')}
              >
                <View style={styles.settingLeft}>
                  <Text style={styles.settingIcon}>🏢</Text>
                  <Text style={styles.settingText}>Organization Settings</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.settingItem} 
                onPress={() => handleSettingPress('permissions')}
              >
                <View style={styles.settingLeft}>
                  <Text style={styles.settingIcon}>👥</Text>
                  <Text style={styles.settingText}>Manage Permissions</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.settingItem} 
                onPress={() => handleSettingPress('feedback')}
              >
                <View style={styles.settingLeft}>
                  <Text style={styles.settingIcon}>⭐</Text>
                  <Text style={styles.settingText}>Feedback & Ratings</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Support Section */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          <TouchableOpacity 
            style={styles.settingItem} 
            onPress={() => handleSettingPress('help')}
          >
            <View style={styles.settingLeft}>
              <Text style={styles.settingIcon}>❓</Text>
              <Text style={styles.settingText}>Help & Support</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingItem} 
            onPress={() => handleSettingPress('about')}
          >
            <View style={styles.settingLeft}>
              <Text style={styles.settingIcon}>ℹ️</Text>
              <Text style={styles.settingText}>About</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default UserProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    paddingTop: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileHeader: {
    backgroundColor: '#FFFFFF',
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20,
    borderWidth: 3,
    borderColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 6,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  userRole: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#E5E7EB',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  settingsSection: {
    backgroundColor: '#FFFFFF',
    marginTop: 20,
    marginHorizontal: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    fontSize: 22,
    marginRight: 16,
    width: 24,
    textAlign: 'center',
  },
  settingText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
  },
  chevron: {
    fontSize: 20,
    color: '#9CA3AF',
    fontWeight: '300',
  },
  logoutButton: {
    backgroundColor: '#EF4444',
    marginHorizontal: 20,
    marginTop: 30,
    marginBottom: 20,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#EF4444',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 16,
  },
});
