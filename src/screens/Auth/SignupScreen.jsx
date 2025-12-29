// src/screens/Auth/SignupScreen.jsx

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Alert,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { createUserWithEmailAndPassword, sendEmailVerification, signOut } from 'firebase/auth';
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../../config/firebaseConfig';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getAllOrganizationsWithAdmin } from '../../services/organizationService';
import { navigateToLogin } from '../../services/navigationService';

const SignupScreen = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [organizationSlug, setOrganizationSlug] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigation = useNavigation();
  const route = useRoute();
  const { role } = route.params || {};
  const [allOrganizations, setAllOrganizations] = useState([]);
  const [locationFilter, setLocationFilter] = useState('');
  const [selectedOrganizationId, setSelectedOrganizationId] = useState('');
  const [orgModalVisible, setOrgModalVisible] = useState(false);

  React.useEffect(() => {
    if (role === 'staff') {
      getAllOrganizationsWithAdmin().then(setAllOrganizations);
    }
  }, [role]);

  const filteredOrganizations = allOrganizations.filter(org => {
    if (!locationFilter) return true;
    const addr = String(org.address || '').toLowerCase();
    const name = String(org.name || '').toLowerCase();
    return (
      addr.includes(locationFilter.toLowerCase()) ||
      name.includes(locationFilter.toLowerCase())
    );
  });
  const selectedOrg = allOrganizations.find(org => org.id === selectedOrganizationId);

  const handleSignup = async () => {
    if (!firstName || !lastName || !email || !password) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }
    if (!confirmPassword) {
      Alert.alert('Error', 'Please confirm your password');
      return;
    }
    if (role === 'staff' && !selectedOrganizationId) {
      Alert.alert('Error', 'Please select your organization');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    // Ensure we land on Login and show verify message after signup
    if (role !== 'staff') {
      try {
        await AsyncStorage.setItem('showVerifyMsgOnLogin', 'true');
        await AsyncStorage.setItem('suppressAutoSignOutOnce', 'true');
      } catch {}
    }
    setLoading(true);
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCred.user;
      const fullName = `${firstName} ${lastName}`;

      if (role === 'admin') {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          firstName,
          lastName,
          name: fullName,
          role: 'admin',
          emailVerified: false,
          createdAt: new Date(),
        });
      } else if (role === 'staff') {
        await setDoc(doc(db, 'staff_requests', user.uid), {
          uid: user.uid,
          email: user.email,
          firstName,
          lastName,
          name: fullName,
          organizationId: selectedOrganizationId,
          status: 'pending',
          createdAt: new Date(),
        });
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          firstName,
          lastName,
          name: fullName,
          role: 'staff',
          organizationId: selectedOrganizationId,
          status: 'pending',
          emailVerified: false,
          createdAt: new Date(),
        });
        // Don't show Alert or navigate manually - let AuthContext and AppNavigator handle it
        // The auth state listener will detect the pending staff and show PendingApprovalScreen
      } else {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          firstName,
          lastName,
          name: fullName,
          role: 'user',
          emailVerified: false,
          createdAt: new Date(),
        });
      }

      try {
        await sendEmailVerification(user);
        if (role !== 'staff') {
          try {
            await AsyncStorage.setItem('showVerifyMsgOnLogin', 'true');
          } catch {}
          Alert.alert(
            'Verify your email',
            'We sent a verification link to your email. After verifying, please log in.',
            [
              {
                text: 'OK',
                onPress: async () => {
                  try {
                    await signOut(auth);
                  } finally {
                    try {
                      await AsyncStorage.removeItem('suppressAutoSignOutOnce');
                    } catch {}
                    navigateToLogin();
                  }
                },
              },
            ],
            { cancelable: false }
          );
        } else {
          Alert.alert(
            'Verify your email',
            'We sent a verification link to your email. Your staff request is pending admin approval. You can check your status in the app.',
            [{ text: 'OK' }],
            { cancelable: true }
          );
        }
      } catch (sendErr) {
        console.error('Failed to send verification email', sendErr);
        Alert.alert(
          'Email not sent',
          'Could not send verification email right now. Please try logging in to resend.'
        );
      }
      if (role === 'staff') {
        // For staff, do not sign out or navigate here; pending flow handles navigation.
      }
    } catch (error) {
      Alert.alert('Signup Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    navigation.navigate('Login', { role });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Sign up as a {role || 'User'}</Text>

          <View style={styles.form}>
            <TextInput
              placeholder="First Name"
              value={firstName}
              onChangeText={setFirstName}
              style={styles.input}
              placeholderTextColor="#9CA3AF"
            />
            <TextInput
              placeholder="Last Name"
              value={lastName}
              onChangeText={setLastName}
              style={styles.input}
              placeholderTextColor="#9CA3AF"
            />
            <TextInput
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              style={styles.input}
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <View style={styles.passwordContainer}>
              <TextInput
                placeholder="Password"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                style={styles.passwordInput}
                placeholderTextColor="#9CA3AF"
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? "eye" : "eye-off"}
                  size={20}
                  color="#9CA3AF"
                />
              </TouchableOpacity>
            </View>
            <View style={styles.passwordContainer}>
              <TextInput
                placeholder="Confirm Password"
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                style={styles.passwordInput}
                placeholderTextColor="#9CA3AF"
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons
                  name={showConfirmPassword ? "eye" : "eye-off"}
                  size={20}
                  color="#9CA3AF"
                />
              </TouchableOpacity>
            </View>
            {role === 'staff' && (
              <>
                <Text style={{ color: '#CBD5E1', marginBottom: 6 }}>Organization</Text>
                <TouchableOpacity
                  onPress={() => setOrgModalVisible(true)}
                  style={styles.selectorInput}
                >
                  <Text style={selectedOrg ? styles.selectorText : styles.selectorPlaceholder}>
                    {selectedOrg ? selectedOrg.name : 'Select your organization'}
                  </Text>
                  <Ionicons name="chevron-down" size={18} color="#9CA3AF" />
                </TouchableOpacity>
              </>
            )}

            <LinearGradient
              colors={['#3B82F6', '#1E3A8A']}
              style={[styles.signupButton, loading && styles.buttonDisabled]}
            >
              <TouchableOpacity onPress={handleSignup} disabled={loading} style={{ width: '100%' }}>
                <Text style={styles.signupButtonText}>
                  {loading ? 'Creating Account...' : 'Create Account'}
                </Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <TouchableOpacity onPress={handleLogin}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <Modal
        animationType="fade"
        transparent
        visible={orgModalVisible}
        onRequestClose={() => setOrgModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Organization</Text>
            <TextInput
              placeholder="Search by name or address"
              value={locationFilter}
              onChangeText={setLocationFilter}
              style={styles.input}
              placeholderTextColor="#9CA3AF"
            />
            <FlatList
              data={filteredOrganizations}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    setSelectedOrganizationId(item.id);
                    setOrgModalVisible(false);
                  }}
                  style={[
                    styles.listItem,
                    { backgroundColor: selectedOrganizationId === item.id ? '#28476A' : 'transparent' },
                  ]}
                >
                  <Text style={styles.listItemTitle}>{item.name}</Text>
                  {item.address ? (
                    <Text style={styles.listItemSub}>📍 {item.address}</Text>
                  ) : null}
                  <Text style={styles.listItemSub}>Type: {item.type || 'Organization'}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={{ color: '#FF9800', fontStyle: 'italic', margin: 10 }}>
                  No organizations found
                </Text>
              }
            />
            <TouchableOpacity onPress={() => setOrgModalVisible(false)} style={styles.modalCloseButton}>
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  keyboardAvoidingView: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#CBD5E1',
    textAlign: 'center',
    marginBottom: 20,
  },
  form: { marginBottom: 20 },
  input: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 14,
    color: '#FFFFFF',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 14,
    paddingRight: 12,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#FFFFFF',
  },
  eyeButton: {
    padding: 8,
  },
  signupButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.7 },
  signupButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  selectorInput: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectorText: {
    color: '#FFFFFF',
    fontSize: 15,
  },
  selectorPlaceholder: {
    color: '#9CA3AF',
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 16,
    maxHeight: 520,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  listItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  listItemTitle: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  listItemSub: {
    color: '#CBD5E1',
    fontSize: 12,
  },
  modalCloseButton: {
    marginTop: 12,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCloseText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  footer: { flexDirection: 'row', justifyContent: 'center' },
  footerText: { fontSize: 14, color: '#CBD5E1' },
  loginLink: { fontSize: 14, fontWeight: '600', color: '#3B82F6', marginLeft: 5 },
});

export default SignupScreen;
