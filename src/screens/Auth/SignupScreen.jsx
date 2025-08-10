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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../../config/firebaseConfig';
import { useNavigation, useRoute } from '@react-navigation/native';

const SignupScreen = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [organizationSlug, setOrganizationSlug] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const route = useRoute();
  const { role } = route.params || {};

  const handleSignup = async () => {
    if (!firstName || !lastName || !email || !password) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }
    if (!confirmPassword) {
      Alert.alert('Error', 'Please confirm your password');
      return;
    }
    if (role === 'staff' && !organizationSlug) {
      Alert.alert('Error', 'Please enter organization ID');
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
    if (role === 'staff' && !organizationSlug.startsWith('org_')) {
      Alert.alert('Error', 'Organization ID must start with "org_" (e.g., org_wasa)');
      return;
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
          createdAt: new Date(),
        });
      } else if (role === 'staff') {
        const orgQuery = query(collection(db, 'organizations'), where('__name__', '==', organizationSlug));
        const orgSnapshot = await getDocs(orgQuery);
        if (orgSnapshot.empty) {
          Alert.alert('Error', 'Organization not found. Please check the organization ID.');
          return;
        }
        await setDoc(doc(db, 'staff_requests', user.uid), {
          uid: user.uid,
          email: user.email,
          firstName,
          lastName,
          name: fullName,
          organizationId: organizationSlug,
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
          organizationId: organizationSlug,
          status: 'pending',
          createdAt: new Date(),
        });
        Alert.alert('Success', 'Staff account created! Your request is pending admin approval.');
      } else {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          firstName,
          lastName,
          name: fullName,
          role: 'user',
          createdAt: new Date(),
        });
      }

      Alert.alert('Success', 'Account created successfully!');
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
            <TextInput
              placeholder="Password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              style={styles.input}
              placeholderTextColor="#9CA3AF"
            />
            <TextInput
              placeholder="Confirm Password"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              style={styles.input}
              placeholderTextColor="#9CA3AF"
            />
            {role === 'staff' && (
              <TextInput
                placeholder="Organization Slug (e.g., org_wasa)"
                value={organizationSlug}
                onChangeText={setOrganizationSlug}
                style={styles.input}
                placeholderTextColor="#9CA3AF"
              />
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
  footer: { flexDirection: 'row', justifyContent: 'center' },
  footerText: { fontSize: 14, color: '#CBD5E1' },
  loginLink: { fontSize: 14, fontWeight: '600', color: '#3B82F6', marginLeft: 5 },
});

export default SignupScreen;
