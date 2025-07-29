import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, SafeAreaView } from 'react-native';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../config/firebaseConfig';
import { useAuth } from '../../context/AuthContext';

const JoinOrganizationScreen = () => {
  const [orgId, setOrgId] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleRequest = async () => {
    if (!orgId.trim()) {
      Alert.alert('Error', 'Please enter an organization ID');
      return;
    }

    setLoading(true);
    try {
      await setDoc(doc(db, 'staff_requests', user.uid), {
        uid: user.uid,
        email: user.email,
        organizationId: orgId.trim(),
        status: 'pending',
        createdAt: new Date(),
      });
      Alert.alert('Success', 'Request sent successfully! Please wait for admin approval.');
      setOrgId('');
    } catch (err) {
      console.error('Error sending request:', err);
      Alert.alert('Error', 'Failed to send request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Join Organization</Text>
        <Text style={styles.subtitle}>Request to join an organization as staff member</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Organization ID *</Text>
          <TextInput
            placeholder="Enter organization ID (e.g., wasa-001)"
            style={styles.input}
            value={orgId}
            onChangeText={setOrgId}
            autoCapitalize="none"
            autoCorrect={false}
          />
          
          <Text style={styles.helpText}>
            Ask your organization administrator for the correct organization ID
          </Text>

          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]} 
            onPress={handleRequest}
            disabled={loading || !orgId.trim()}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Sending Request...' : 'Send Request'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>How it works:</Text>
          <Text style={styles.infoText}>
            1. Enter the organization ID provided by your admin{'\n'}
            2. Submit your request{'\n'}
            3. Wait for admin approval{'\n'}
            4. Check your status in the Status tab
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default JoinOrganizationScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
  form: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E1E5E9',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    backgroundColor: '#F8F9FA',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});
