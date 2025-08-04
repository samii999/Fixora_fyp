// src/screens/Auth/SignupScreen.jsx
import React, { useState } from 'react';
import { View, Text, TextInput, Alert, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
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
    // Validation
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

    // Validate organization slug format for staff
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
        // For admin, create user document
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          firstName: firstName,
          lastName: lastName,
          name: fullName,
          role: 'admin',
          createdAt: new Date(),
        });
      } else if (role === 'staff') {
        // For staff, check if organization exists
        const orgQuery = query(
          collection(db, 'organizations'),
          where('__name__', '==', organizationSlug)
        );
        const orgSnapshot = await getDocs(orgQuery);
        
        if (orgSnapshot.empty) {
          Alert.alert('Error', 'Organization not found. Please check the organization ID.');
          return;
        }

        // Create staff request
        await setDoc(doc(db, 'staff_requests', user.uid), {
          uid: user.uid,
          email: user.email,
          firstName: firstName,
          lastName: lastName,
          name: fullName,
          organizationId: organizationSlug,
          status: 'pending',
          createdAt: new Date(),
        });

        // Create user document with pending status
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          firstName: firstName,
          lastName: lastName,
          name: fullName,
          role: 'staff',
          organizationId: organizationSlug,
          status: 'pending',
          createdAt: new Date(),
        });

        Alert.alert('Success', 'Staff account created! Your request is pending admin approval.');
      } else {
        // For regular users
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          firstName: firstName,
          lastName: lastName,
          name: fullName,
          role: 'user',
          createdAt: new Date(),
        });
      }

      Alert.alert('Success', 'Account created successfully!');
      // Navigation will be handled by AuthContext automatically
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
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Sign up as a {role || 'User'}</Text>
            </View>

            <View style={styles.form}>
              <TextInput 
                placeholder="First Name" 
                value={firstName} 
                onChangeText={setFirstName} 
                style={styles.input}
                autoCapitalize="words"
                returnKeyType="next"
              />
              <TextInput 
                placeholder="Last Name" 
                value={lastName} 
                onChangeText={setLastName} 
                style={styles.input}
                autoCapitalize="words"
                returnKeyType="next"
              />
              <TextInput 
                placeholder="Email" 
                value={email} 
                onChangeText={setEmail} 
                style={styles.input}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                returnKeyType="next"
              />
              <TextInput 
                placeholder="Password" 
                secureTextEntry 
                value={password} 
                onChangeText={setPassword} 
                style={styles.input}
                autoComplete="new-password"
                returnKeyType="next"
              />
              <TextInput 
                placeholder="Confirm Password" 
                secureTextEntry 
                value={confirmPassword} 
                onChangeText={setConfirmPassword} 
                style={styles.input}
                autoComplete="new-password"
                returnKeyType="next"
              />
              {role === 'staff' && (
                <TextInput 
                  placeholder="Organization Slug (e.g., org_wasa)" 
                  value={organizationSlug} 
                  onChangeText={setOrganizationSlug} 
                  style={styles.input}
                  autoCapitalize="none"
                  returnKeyType="done"
                />
              )}
              
              <TouchableOpacity 
                style={[styles.signupButton, loading && styles.buttonDisabled]} 
                onPress={handleSignup}
                disabled={loading}
              >
                <Text style={styles.signupButtonText}>
                  {loading ? 'Creating Account...' : 'Create Account'}
                </Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account?</Text>
              <TouchableOpacity onPress={handleLogin}>
                <Text style={styles.loginLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40, // Add extra padding at bottom for keyboard
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    minHeight: '100%', // Ensure content takes full height
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  form: {
    marginBottom: 40,
    width: '100%',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E1E5E9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#F8F9FA',
  },
  signupButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
  },
  signupButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  footerText: {
    color: '#666',
    fontSize: 16,
  },
  loginLink: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SignupScreen;
