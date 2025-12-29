import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { validateEmail, validatePassword } from '../../utils/validators';
import { loginUser, getUserRole } from '../../api/firebase';
import { signInWithEmailAndPassword, sendEmailVerification, signOut } from 'firebase/auth';
import { auth } from '../../config/firebaseConfig';
import { useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path } from 'react-native-svg';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [infoMessage, setInfoMessage] = useState('');
  const route = useRoute();
  const { role } = route.params || {};

  useEffect(() => {
    (async () => {
      try {
        const v = await AsyncStorage.getItem('showVerifyMsgOnLogin');
        if (v === 'true') {
          setInfoMessage('We sent a verification link to your email. After verifying, please log in.');
          await AsyncStorage.removeItem('showVerifyMsgOnLogin');
        }
      } catch {}
    })();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill all fields');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    setCanResend(false);

    try {
      if (!validateEmail(email)) {
        setError('Please enter a valid email');
        return;
      }
      if (!validatePassword(password)) {
        setError('Password must be at least 6 characters');
        return;
      }

      const user = await loginUser(email, password);

      const userRole = await getUserRole(user.uid);
      if (role && userRole !== role.toLowerCase()) {
        setError(`This account is registered as ${userRole}, not ${role.toLowerCase()}`);
        return;
      }

    } catch (err) {
      setError(err.message);
      if (String(err.message || '').toLowerCase().includes('verify')) {
        setCanResend(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email || !password) {
      setError('Enter your email and password to resend verification.');
      return;
    }
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(cred.user);
      await signOut(auth);
      setError('We re-sent the verification email. Check your inbox/spam.');
      setCanResend(false);
    } catch (err) {
      setError(err.message || 'Could not resend verification email.');
    } finally {
      setLoading(false);
      setCanResend(false);
    }
  };

  const handleSignup = () => {
    navigation.navigate('Signup', { role });
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Top Blue Shape - Outside ScrollView */}
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1 }}>
          <Svg height="250" width="100%" viewBox="0 0 1440 320" preserveAspectRatio="none">
            <Path
              fill="#3B82F6"
              d="M0,128L60,144C120,160,240,192,360,181.3C480,171,600,117,720,96C840,75,960,85,1080,106.7C1200,128,1320,160,1380,176L1440,192L1440,0L1380,0C1320,0,1200,0,1080,0C960,0,840,0,720,0C600,0,480,0,360,0C240,0,120,0,60,0L0,0Z"
            />
          </Svg>
        </View>
        
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>Log In</Text>
              <Text style={styles.subtitle}>Sign in to your {role || 'User'} account</Text>
            </View>

            <View style={styles.form}>
              <TextInput
                style={styles.input}
                placeholder="Email or phone number"
                placeholderTextColor="#A0AEC0"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                returnKeyType="next"
              />

              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Password"
                  placeholderTextColor="#A0AEC0"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                  returnKeyType="done"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? "eye" : "eye-off"}
                    size={20}
                    color="#A0AEC0"
                  />
                </TouchableOpacity>
              </View>

              {infoMessage ? <Text style={styles.info}>{infoMessage}</Text> : null}
              {error ? <Text style={styles.error}>{error}</Text> : null}
              {canResend ? (
                <TouchableOpacity onPress={handleResendVerification} disabled={loading} style={styles.resendButton}>
                  <Text style={styles.resendText}>{loading ? 'Resending...' : 'Resend verification email'}</Text>
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity
                onPress={handleLogin}
                disabled={loading}
              >
                <LinearGradient
                  colors={['#3B82F6', '#1E3A8A']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.loginButton, loading && styles.buttonDisabled]}
                >
                  <Text style={styles.loginButtonText}>
                    {loading ? 'Signing In...' : 'Log In'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account?</Text>
              <TouchableOpacity onPress={handleSignup}>
                <Text style={styles.signupLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A', // Dark navy background
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 200, // space for top curve
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#CBD5E1',
    textAlign: 'center',
  },
  form: {
    marginBottom: 40,
    width: '100%',
  },
  input: {
    borderWidth: 0,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#1E293B', // Dark input
    color: '#fff',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    marginBottom: 16,
    paddingRight: 12,
  },
  passwordInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: '#fff',
  },
  eyeButton: {
    padding: 8,
  },
  loginButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  error: {
    color: '#F87171',
    marginBottom: 16,
    textAlign: 'center',
    fontSize: 14,
  },
  info: {
    color: '#93C5FD',
    marginBottom: 12,
    textAlign: 'center',
    fontSize: 14,
  },
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  footerText: {
    color: '#CBD5E1',
    fontSize: 16,
  },
  signupLink: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default LoginScreen;
